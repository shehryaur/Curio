// Hold-to-talk -> /api/voice (Modulate). Moved here from src/components/MicButton.tsx.
'use client'

import { useEffect, useRef, useState } from 'react'
import { postForm } from '@/lib/api'
import type { VoiceResponse } from '@/lib/types'
import s from './experience.module.css'

interface Props {
  isMinor: boolean
  disabled?: boolean
  onResult: (v: VoiceResponse) => void | Promise<void>
  onStart?: () => void
  onError?: (msg: string) => void
}

function pickMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  for (const m of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']) {
    if (MediaRecorder.isTypeSupported(m)) return m
  }
  return undefined
}

export default function MicButton({ isMinor, disabled, onResult, onStart, onError }: Props) {
  const [state, setState] = useState<'idle' | 'recording' | 'sending'>('idle')
  const recRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const heldRef = useRef(false)
  const aliveRef = useRef(true)

  const release = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }
  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      if (recRef.current?.state === 'recording') recRef.current.stop()
      release()
    }
  }, [])

  const send = async (blob: Blob) => {
    if (!aliveRef.current) return
    if (blob.size < 1000) {
      setState('idle')
      onError?.('That was too short. Hold the button while you talk.')
      return
    }
    setState('sending')
    const form = new FormData()
    const ext = blob.type.includes('mp4') ? 'm4a' : 'webm'
    form.append('audio', blob, `speech.${ext}`)
    form.append('isMinor', String(isMinor))
    const res = await postForm<VoiceResponse>('/api/voice', form)
    if (!aliveRef.current) return
    setState('idle')
    if (!res.ok) {
      onError?.("Pip couldn't hear you. Try again?")
      return
    }
    await onResult(res.data)
  }

  const start = async () => {
    if (state !== 'idle' || disabled) return
    heldRef.current = true
    onStart?.()
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      onError?.('This browser cannot record audio. You can type instead.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      if (!heldRef.current || !aliveRef.current) {
        release()
        return
      }
      const mimeType = pickMime()
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data)
      }
      rec.onstop = () => {
        release()
        void send(new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' }))
      }
      recRef.current = rec
      rec.start()
      setState('recording')
    } catch (e) {
      release()
      setState('idle')
      onError?.(
        e instanceof Error && e.name === 'NotAllowedError'
          ? 'The microphone is blocked. You can allow it in your browser, or type instead.'
          : 'Could not start the microphone.',
      )
    }
  }

  const end = () => {
    heldRef.current = false
    if (recRef.current?.state === 'recording') recRef.current.stop()
    recRef.current = null
  }

  return (
    <button
      type="button"
      className={`${s.mic}${state === 'recording' ? ` ${s.micRec}` : ''}`}
      disabled={disabled || state === 'sending'}
      onPointerDown={(e) => {
        e.preventDefault()
        void start()
      }}
      onPointerUp={end}
      onPointerLeave={end}
      onPointerCancel={end}
      onContextMenu={(e) => e.preventDefault()}
      aria-label="Hold to talk to Pip"
    >
      {state === 'recording' ? '🔴 Let go' : state === 'sending' ? '…' : '🎤 Hold'}
    </button>
  )
}
