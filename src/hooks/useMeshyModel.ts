'use client'
// Photo lessons with no matching template: build a 3D model with /api/meshy in the background.
import { useCallback, useEffect, useRef, useState } from 'react'
import { getJson, postJson } from '@/lib/api'
import type { MeshyStatus } from '@/lib/types'

export type MeshyPhase = 'idle' | 'building' | 'ready' | 'failed'
export interface MeshyModelState {
  phase: MeshyPhase
  progress: number
  glbUrl: string | null
  note: string | null
}

const IDLE: MeshyModelState = { phase: 'idle', progress: 0, glbUrl: null, note: null }
const POLL_MS = 5000
const MAX_MS = 6 * 60 * 1000
const FAIL_NOTE = "Pip couldn't build a 3D model this time, so we'll learn with your photo."

export function useMeshyModel() {
  const [state, setState] = useState<MeshyModelState>(IDLE)
  const run = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ctrl = useRef<AbortController | null>(null)

  const cancel = useCallback(() => {
    run.current++
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    ctrl.current?.abort()
    ctrl.current = null
  }, [])

  const reset = useCallback(() => {
    cancel()
    setState(IDLE)
  }, [cancel])

  useEffect(() => cancel, [cancel])

  const start = useCallback(
    async (imageBase64: string) => {
      cancel()
      const id = run.current
      const c = new AbortController()
      ctrl.current = c
      setState({ phase: 'building', progress: 0, glbUrl: null, note: null })
      const fail = (note = FAIL_NOTE) => {
        if (run.current === id) setState({ phase: 'failed', progress: 0, glbUrl: null, note })
      }
      const created = await postJson<{ taskId?: string } & Partial<MeshyStatus>>('/api/meshy', { imageBase64 }, c.signal)
      if (run.current !== id) return
      if (!created.ok || !created.data.taskId || created.data.status === 'UNAVAILABLE' || created.data.status === 'FAILED') {
        return fail()
      }
      const taskId = created.data.taskId
      const began = Date.now()
      let netErrors = 0
      const poll = async () => {
        if (run.current !== id) return
        const res = await getJson<MeshyStatus>(`/api/meshy?taskId=${encodeURIComponent(taskId)}`, c.signal)
        if (run.current !== id) return
        if (!res.ok) {
          netErrors++
          if (netErrors >= 3) return fail()
        } else {
          netErrors = 0
          const s = res.data
          if (s.status === 'SUCCEEDED') {
            const glbUrl = s.proxyUrl ?? `/api/meshy?proxy=${encodeURIComponent(taskId)}`
            setState({ phase: 'ready', progress: 100, glbUrl, note: null })
            return
          }
          if (s.status === 'FAILED' || s.status === 'UNAVAILABLE') return fail()
          const progress = Math.max(0, Math.min(99, Math.round(s.progress || 0)))
          setState((prev) => ({ ...prev, phase: 'building', progress }))
        }
        if (Date.now() - began > MAX_MS) return fail()
        timer.current = setTimeout(() => void poll(), POLL_MS)
      }
      timer.current = setTimeout(() => void poll(), 1500)
    },
    [cancel],
  )

  return { ...state, start, reset }
}
