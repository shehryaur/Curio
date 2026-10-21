'use client'
// One TTS player per screen: every say() cancels the previous line; stop() and unmount cancel too.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { speak } from '@/lib/speak'
import type { AgeMode } from '@/lib/types'

export interface Speaker {
  /** Speak one line. Resolves true when it finished, false when it was cancelled. */
  say: (text: string, mode: AgeMode) => Promise<boolean>
  stop: () => void
  speaking: boolean
  /** Last "voice unavailable" note (subtitles still shown). */
  note: string | null
}

export function useSpeaker(): Speaker {
  const ctrl = useRef<AbortController | null>(null)
  const [speaking, setSpeaking] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const stop = useCallback(() => {
    ctrl.current?.abort()
    ctrl.current = null
    setSpeaking(false)
  }, [])

  useEffect(() => () => ctrl.current?.abort(), [])

  const say = useCallback(async (text: string, mode: AgeMode) => {
    ctrl.current?.abort()
    const c = new AbortController()
    ctrl.current = c
    const line = text.trim()
    if (!line) return true
    setSpeaking(true)
    const r = await speak(line, mode, c.signal)
    const finished = !c.signal.aborted
    if (ctrl.current === c) {
      ctrl.current = null
      setSpeaking(false)
    }
    if (finished) setNote(r.error ?? null)
    return finished
  }, [])

  return useMemo(() => ({ say, stop, speaking, note }), [say, stop, speaking, note])
}
