'use client'
// k-ID decides every permission. This hook turns on missing permissions:
// player-managed ones the learner can switch on directly; guardian-managed ones are asked for in ONE email
// (real k-ID upgrade), then we poll the session every 4s until they flip on.
// Uses useProfile().effectiveCan (real permission, or a demo approval when IS_DEMO) and useGrownupSettings()
// (null until a k-ID session exists — e.g. while the first consent is still pending).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useKidPermission, useKidSession, type PermissionName } from '@k-id/core'
import { useGrownupSettings, useProfile } from '@/components/ProfileProvider'
import { addDemoRequest } from './useDemoRequests'

export type AskPhase = 'idle' | 'sending' | 'waiting' | 'error'

export function useGrownupAsk(names: readonly PermissionName[]) {
  const { effectiveCan, kid, isDemo } = useProfile()
  const { get } = useKidPermission()
  const settings = useGrownupSettings()
  const { refresh: refreshSession } = useKidSession()
  const [phase, setPhase] = useState<AskPhase>('idle')
  const [error, setError] = useState<string | null>(null)

  const managedBy = useCallback(
    (n: PermissionName) => (get(n) ?? settings?.permissions.find((p) => p.name === n))?.managedBy,
    [get, settings],
  )
  const missing = useMemo(() => names.filter((n) => !effectiveCan(n)), [names, effectiveCan])
  const prohibited = useMemo(() => missing.filter((n) => managedBy(n) === 'PROHIBITED'), [missing, managedBy])
  const allOn = missing.length === 0
  /** false when every missing permission is one the learner can switch on alone (no email needed). */
  const guardianNeeded = missing.some((n) => managedBy(n) !== 'PLAYER')

  const refreshers = useRef({ refreshSession, refreshSettings: settings?.refresh })
  refreshers.current = { refreshSession, refreshSettings: settings?.refresh }

  const refreshAll = useCallback(async () => {
    try {
      await Promise.all([refreshers.current.refreshSession(), refreshers.current.refreshSettings?.()])
    } catch {
      /* network blip: try again on the next tick */
    }
  }, [])

  useEffect(() => {
    if (phase !== 'waiting') return
    const t = setInterval(() => void refreshAll(), 4000)
    return () => clearInterval(t)
  }, [phase, refreshAll])

  useEffect(() => {
    if (allOn && phase !== 'idle') setPhase('idle')
  }, [allOn, phase])

  const ask = useCallback(
    async (approverEmail?: string) => {
      setError(null)
      if (isDemo) addDemoRequest(missing)
      if (!settings) {
        // No k-ID session yet (first consent pending): nothing to upgrade until the grown-up says yes.
        setPhase('waiting')
        return
      }
      setPhase('sending')
      const askable = missing.filter((n) => managedBy(n) !== 'PROHIBITED')
      const playerOnes = askable.filter((n) => managedBy(n) === 'PLAYER')
      const guardianOnes = askable.filter((n) => managedBy(n) !== 'PLAYER')
      for (const n of playerOnes) {
        const r = await settings.change(n, true)
        if (!r.ok) guardianOnes.push(n)
      }
      if (guardianOnes.length === 0) {
        await refreshAll()
        setPhase('idle')
        return
      }
      const email = approverEmail?.trim() || undefined
      const r = await settings.upgrade(guardianOnes, email)
      if (!r.ok) {
        setPhase('error')
        setError(
          r.code === 'invalid_request'
            ? 'That email did not work. Can you check it?'
            : r.code === 'rate_limited'
              ? 'Too many tries. Wait a minute and try again.'
              : "Pip couldn't send the note right now. Try again in a moment.",
        )
        return
      }
      await refreshAll()
      setPhase('waiting')
    },
    [missing, managedBy, settings, refreshAll, isDemo],
  )

  const cancel = useCallback(() => {
    setPhase('idle')
    setError(null)
  }, [])

  return {
    isOn: effectiveCan,
    missing,
    prohibited,
    allOn,
    guardianNeeded,
    phase,
    error,
    ask,
    cancel,
    refresh: refreshAll,
    /** No k-ID session yet: the first parental consent is still pending. */
    noSession: !kid.ready || !settings,
    needsEmail: settings ? !settings.hasApproverEmail : false,
    challengeStatus: settings?.challenge.status ?? 'pending',
  }
}
