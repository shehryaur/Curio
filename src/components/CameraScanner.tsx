// Webcam feed + Snap & Explore button. Owner: Sruthi
'use client'

import { useEffect, useRef, useState } from 'react'
import { KidPermission } from '@k-id/core'
import type { PropType } from '@/lib/types'

const DEMO_PROPS: { type: PropType; label: string }[] = [
  { type: 'charger', label: 'Charger' },
  { type: 'phone', label: 'Phone' },
  { type: 'bottle', label: 'Water bottle' },
]

interface Props {
  busy: boolean
  error: string | null
  onAnalyze: (input: { imageBase64?: string; propHint?: PropType }) => void
}

function Camera({ busy, onSnap }: { busy: boolean; onSnap: (dataUrl: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [state, setState] = useState<'off' | 'starting' | 'on' | 'denied'>('off')
  const [err, setErr] = useState<string | null>(null)

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }
  useEffect(() => stopStream, [])

  const start = async () => {
    setErr(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('denied')
      setErr('This browser has no camera support (needs https or localhost).')
      return
    }
    setState('starting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => undefined)
      }
      setState('on')
    } catch (e) {
      setState('denied')
      setErr(e instanceof Error && e.name === 'NotAllowedError' ? 'Camera permission was denied.' : 'Could not start the camera.')
    }
  }

  const snap = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const scale = Math.min(1, 1024 / video.videoWidth)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    onSnap(canvas.toDataURL('image/jpeg', 0.8))
  }

  return (
    <div className="curio-camera">
      <video ref={videoRef} className="curio-video" playsInline muted hidden={state !== 'on'} />
      {state === 'on' ? (
        <div className="curio-row">
          <button className="curio-btn" disabled={busy} onClick={snap}>
            {busy ? 'Looking…' : 'Snap & Explore'}
          </button>
          <button className="curio-btn ghost" onClick={() => { stopStream(); setState('off') }}>
            Camera off
          </button>
        </div>
      ) : (
        <button className="curio-btn" disabled={state === 'starting'} onClick={start}>
          {state === 'starting' ? 'Starting camera…' : 'Turn on camera'}
        </button>
      )}
      {err && <p className="curio-error">{err} Pick a demo object instead.</p>}
    </div>
  )
}

export function CameraScanner({ busy, error, onAnalyze }: Props) {
  return (
    <section className="curio-card">
      <h2>Explore an object</h2>
      <KidPermission
        name="camera-access"
        fallback={<p className="curio-locked">Camera is off. A grown-up can turn it on in Settings.</p>}
      >
        <KidPermission
          name="ai-media-upload"
          fallback={<p className="curio-locked">Sending photos to Curio is off. A grown-up can turn it on in Settings.</p>}
        >
          <Camera busy={busy} onSnap={(imageBase64) => onAnalyze({ imageBase64 })} />
        </KidPermission>
      </KidPermission>
      <p>Or pick a demo object:</p>
      <div className="curio-props">
        {DEMO_PROPS.map((p) => (
          <button key={p.type} className="curio-btn ghost" disabled={busy} onClick={() => onAnalyze({ propHint: p.type })}>
            {p.label}
          </button>
        ))}
      </div>
      {busy && <p>Curio is looking…</p>}
      {error && <p className="curio-error">{error}</p>}
    </section>
  )
}
