// Push-to-talk -> /api/voice (Modulate). Owner: Sruthi
'use client'

import { useEffect, useRef, useState } from 'react'
import { postForm } from '@/lib/api'
import type { VoiceResponse } from '@/lib/types'

interface Props {
  isMinor: boolean
  disabled?: boolean
  onResult: (v: VoiceResponse) => void | Promise<void>
}

function pickMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  for (const m of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']) {
    if (MediaRecorder.isTypeSupported(m)) return m
  }
  return undefined
}

export function MicButton({ isMinor, disabled, onResult }: Props) {
  const [state, setState] = useState<'idle' | 'recording' | 'sending'>('idle')
  const [err, setErr] = useState<string | null>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const heldRef = useRef(false) // still holding the button?

  const release = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }
  useEffect(() => () => { recRef.current?.state === 'recording' && recRef.current.stop(); release() }, [])

  const send = async (blob: Blob) => {
    if (blob.size < 1000) {
      setState('idle')
      setErr('That was too short. Hold the button while you talk.')
      return
    }
    setState('sending')
    const form = new FormData()
    form.append('audio', blob, 'speech.webm')
    form.append('isMinor', String(isMinor))
    const res = await postForm<VoiceResponse>('/api/voice', form)
    setState('idle')
    if (!res.ok) {
      setErr(`Couldn't hear you (${res.error}).`)
      return
    }
    await onResult(res.data)
  }

  const start = async () => {
    if (state !== 'idle' || disabled) return
    setErr(null)
    heldRef.current = true
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setErr('This browser cannot record audio.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      if (!heldRef.current) { release(); return } // let go before the mic opened
      const mimeType = pickMime()
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data) }
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
      setErr(e instanceof Error && e.name === 'NotAllowedError' ? 'Microphone permission was denied.' : 'Could not start the microphone.')
    }
  }

  const end = () => {
    heldRef.current = false
    if (recRef.current?.state === 'recording') recRef.current.stop()
    recRef.current = null
  }

  return (
    <div className="curio-mic-wrap">
      <button
        className={`curio-btn curio-mic${state === 'recording' ? ' recording' : ''}`}
        disabled={disabled || state === 'sending'}
        onPointerDown={(e) => { e.preventDefault(); void start() }}
        onPointerUp={end}
        onPointerLeave={end}
        onPointerCancel={end}
        onContextMenu={(e) => e.preventDefault()}
      >
        {state === 'recording' ? 'Listening… let go to send' : state === 'sending' ? 'Thinking…' : 'Hold to talk'}
      </button>
      {err && <p className="curio-error">{err}</p>}
    </div>
  )
}
