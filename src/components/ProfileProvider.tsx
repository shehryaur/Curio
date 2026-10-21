'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  KidSettingsProvider,
  useKidAgeGate,
  useKidPermission,
  useKidPermissionSettings,
  useKidSession,
  type KidStatus,
  type PermissionName,
} from '@k-id/core'
import type { AgeMode, Profile } from '@/lib/types'
import { DEMO_PERSONAS, IS_DEMO, type DemoPersona } from '@/lib/demo'
import { kidStorage } from '@/lib/kidStorage'
import { useOnboarding } from '@/components/onboarding/OnboardingContext'
import styles from './onboarding/Onboarding.module.css'

/** What useKidPermissionSettings() returns (only available once a k-ID session exists). */
export type GrownupSettings = ReturnType<typeof useKidPermissionSettings>

export interface KidState {
  /** true once k-ID passed and a session exists: camera / AI / settings work (per permission). */
  ready: boolean
  /** k-ID age-gate status. 'pending' = waiting for the grown-up (app runs in limited mode: starter objects only). */
  status: KidStatus
  sessionId: string | null
  /** e.g. 'US-CA', 'GB' (demo persona's value while one is active). null when unknown. */
  jurisdiction: string | null
}

export interface ProfileContextValue {
  /** Effective profile: demo persona (if any) and temporary mode override applied to `mode`. */
  profile: Profile
  /** Mode before the temporary override (persona's mode while one is active). */
  baseMode: AgeMode
  isModeOverridden: boolean
  /** Temporary override for this visit (e.g. frustration -> 'plainWords'). Not saved. */
  setMode: (m: AgeMode) => void
  resetMode: () => void
  /** Clear the profile + every saved k-ID id and reload into onboarding. */
  startOver: () => void
  kid: KidState
  /** Real k-ID permission (session or settings) OR, only when IS_DEMO, a demo approval. Use this to gate features. */
  effectiveCan: (name: PermissionName) => boolean
  // ---- judge demo helpers (no-ops unless IS_DEMO) ----
  isDemo: boolean
  demoPersonas: DemoPersona[]
  demoPersonaId: string | null
  /** Swap name/age/mode/isMinor/display jurisdiction. Never touches k-ID. Pass null to go back to the real profile. */
  switchDemoPersona: (id: string | null) => void
  /** In-memory "approve as parent" simulation. */
  demoApproved: PermissionName[]
  demoApprove: (names: PermissionName[]) => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)
const GrownupSettingsContext = createContext<GrownupSettings | null>(null)

/** Publishes the settings controller's state into GrownupSettingsContext (only re-renders when it really changes). */
function SettingsBridge({ onValue }: { onValue: (v: GrownupSettings) => void }) {
  const v = useKidPermissionSettings()
  const latest = useRef(v)
  latest.current = v
  const sig = JSON.stringify([v.permissions, v.isLoaded, v.error, v.hasApproverEmail, v.challenge])
  useEffect(() => {
    onValue(latest.current)
  }, [sig, onValue])
  return null
}

function PendingBanner() {
  const gate = useKidAgeGate()
  const ob = useOnboarding()
  const [note, setNote] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (gate.status === 'error') {
    return (
      <div className={styles.banner} role="status">
        <span>Pip can&apos;t reach k-ID right now.</span>
        <button className={styles.bannerBtn} onClick={ob.retry}>
          Retry
        </button>
      </div>
    )
  }
  if (gate.status !== 'pending') return null

  async function resend() {
    setBusy(true)
    const r = await gate.submit()
    setBusy(false)
    setNote(r.ok ? 'Sent again ✓' : "Couldn't resend. Try again soon.")
    setTimeout(() => setNote(null), 4000)
  }

  return (
    <div className={styles.banner} role="status">
      <span>{note ?? 'Waiting for your grown-up to say yes ✉️'}</span>
      <span aria-hidden="true">·</span>
      <button className={styles.bannerBtn} onClick={resend} disabled={busy}>
        {busy ? 'Sending…' : 'Resend'}
      </button>
    </div>
  )
}

/** Mounted by Gate once onboarding is done (k-ID 'pass', or 'pending' = limited mode). Requires KidSessionProvider above. */
export function ProfileProvider({ profile, children }: { profile: Profile; children: ReactNode }) {
  const ob = useOnboarding()
  const gate = useKidAgeGate()
  const { session } = useKidSession()
  const { can } = useKidPermission()

  const sessionId = gate.status === 'pass' ? gate.sessionId : null
  const [settings, setSettings] = useState<GrownupSettings | null>(null)
  useEffect(() => {
    if (!sessionId) setSettings(null)
  }, [sessionId])
  const [settingsChallengeId] = useState(() => kidStorage.getSettingsChallengeId())

  // The grown-up approved while the app was open: the draft is no longer needed.
  useEffect(() => {
    if (gate.status === 'pass') kidStorage.clearDraft()
  }, [gate.status])

  const [override, setOverride] = useState<AgeMode | null>(null)
  const [personaId, setPersonaId] = useState<string | null>(null)
  const [demoApproved, setDemoApproved] = useState<PermissionName[]>([])

  const persona = IS_DEMO ? (DEMO_PERSONAS.find((p) => p.id === personaId) ?? null) : null
  const base: Profile = useMemo(
    () =>
      persona
        ? { ...profile, name: persona.name, age: persona.age, mode: persona.mode, isMinor: persona.age < 18 }
        : profile,
    [profile, persona],
  )

  const setMode = useCallback((m: AgeMode) => setOverride(m === base.mode ? null : m), [base.mode])
  const resetMode = useCallback(() => setOverride(null), [])
  const switchDemoPersona = useCallback((id: string | null) => {
    if (!IS_DEMO) return
    setPersonaId(id)
    setOverride(null)
  }, [])
  const demoApprove = useCallback((names: PermissionName[]) => {
    if (!IS_DEMO) return
    setDemoApproved((prev) => Array.from(new Set([...prev, ...names])))
  }, [])

  const effectiveCan = useCallback(
    (name: PermissionName) =>
      can(name) ||
      !!settings?.permissions.some((p) => p.name === name && p.enabled) ||
      (IS_DEMO && demoApproved.includes(name)),
    [can, settings, demoApproved],
  )

  const realJurisdiction =
    session?.jurisdiction ?? (ob.jurisdiction && ob.jurisdiction !== 'auto' ? ob.jurisdiction : null)

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile: override ? { ...base, mode: override } : base,
      baseMode: base.mode,
      isModeOverridden: override !== null,
      setMode,
      resetMode,
      startOver: ob.startOver,
      kid: {
        ready: gate.status === 'pass' && !!sessionId,
        status: gate.status,
        sessionId,
        jurisdiction: persona?.jurisdiction ?? realJurisdiction,
      },
      effectiveCan,
      isDemo: IS_DEMO,
      demoPersonas: IS_DEMO ? DEMO_PERSONAS : [],
      demoPersonaId: persona?.id ?? null,
      switchDemoPersona,
      demoApproved,
      demoApprove,
    }),
    [base, override, setMode, resetMode, ob.startOver, gate.status, sessionId, persona, realJurisdiction, effectiveCan,
      switchDemoPersona, demoApproved, demoApprove],
  )

  return (
    <ProfileContext.Provider value={value}>
      {/* Sibling, not a wrapper: mounting it when the grown-up approves must not remount the app. */}
      {sessionId ? (
        <KidSettingsProvider
          key={sessionId}
          sessionId={sessionId}
          challengeId={settingsChallengeId}
          onChallenge={kidStorage.setSettingsChallengeId}
        >
          <SettingsBridge onValue={setSettings} />
        </KidSettingsProvider>
      ) : null}
      <GrownupSettingsContext.Provider value={settings}>
        <PendingBanner />
        {children}
      </GrownupSettingsContext.Provider>
    </ProfileContext.Provider>
  )
}

/** Available anywhere inside the app (rendered once onboarding is done). */
export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile() must be used inside <ProfileProvider> (mounted by KidRoot after onboarding).')
  return ctx
}

/**
 * Safe version of useKidPermissionSettings(): null until a k-ID session exists (e.g. while consent is pending),
 * then the live settings state + actions (change / upgrade / refresh / challenge). Never throws.
 */
export function useGrownupSettings(): GrownupSettings | null {
  return useContext(GrownupSettingsContext)
}
