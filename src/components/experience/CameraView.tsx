'use client'
// Live camera preview + shutter. The photo is kept on the device (JPEG, <= 768px long side, q 0.8).
import { useCallback, useEffect, useRef, useState } from 'react'
import Pet from '@/components/Pet'
import s from './experience.module.css'

interface Props {
  onCapture: (dataUrl: string) => void
  onCancel: () => void
}

const MAX_SIDE = 768

function drawScaled(source: CanvasImageSource, w: number, h: number): string | null {
  if (!w || !h) return null
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  try {
    return canvas.toDataURL('image/jpeg', 0.8)
  } catch {
    return null
  }
}

export default function CameraView({ onCapture, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [status, setStatus] = useState<'starting' | 'live' | 'denied' | 'nocamera' | 'error'>('starting')

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    let alive = true
    async function open() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('nocamera')
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        })
        if (!alive) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const v = videoRef.current
        if (v) {
          v.srcObject = stream
          await v.play().catch(() => undefined)
        }
        setStatus('live')
      } catch (e) {
        if (!alive) return
        const name = e instanceof Error ? e.name : ''
        setStatus(
          name === 'NotAllowedError' || name === 'SecurityError'
            ? 'denied'
            : name === 'NotFoundError' || name === 'OverconstrainedError'
              ? 'nocamera'
              : 'error',
        )
      }
    }
    void open()
    return () => {
      alive = false
      stopStream()
    }
  }, [stopStream])

  const snap = () => {
    const v = videoRef.current
    if (!v) return
    const url = drawScaled(v, v.videoWidth, v.videoHeight)
    if (!url) return
    stopStream()
    onCapture(url)
  }

  const onFile = (file: File | undefined) => {
    if (!file) return
    const objUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const url = drawScaled(img, img.naturalWidth, img.naturalHeight)
      URL.revokeObjectURL(objUrl)
      if (url) {
        stopStream()
        onCapture(url)
      }
    }
    img.onerror = () => URL.revokeObjectURL(objUrl)
    img.src = objUrl
  }

  const filePicker = (
    <input
      ref={fileRef}
      type="file"
      accept="image/*"
      capture="environment"
      hidden
      onChange={(e) => onFile(e.target.files?.[0])}
    />
  )

  if (status === 'denied' || status === 'nocamera' || status === 'error') {
    const msg =
      status === 'denied'
        ? "The camera is blocked. A grown-up can allow it in the browser's settings. Or pick a photo!"
        : status === 'nocamera'
          ? "I can't find a camera here. You can pick a photo instead!"
          : "The camera didn't start. Let's try a photo instead!"
    return (
      <div className={`${s.panel} ${s.center}`}>
        <Pet mood="oops" size="md" message={msg} />
        {filePicker}
        <div className={s.actions}>
          <button className="c-btn" onClick={() => fileRef.current?.click()}>
            🖼️ Pick a photo
          </button>
          <button className="c-btn secondary" onClick={onCancel}>
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={s.cameraWrap}>
      {/* Top Floating Bar (Page 6) */}
      <div className={s.cameraTopBar}>
        <button className={s.cameraCloseBtn} onClick={onCancel} aria-label="Cancel">
          ✕
        </button>
        <span className={s.cameraTargetPill}>Point at something!</span>
        <div style={{ width: 36 }} />
      </div>

      <div className={s.cameraViewfinder}>
        <video ref={videoRef} playsInline muted autoPlay />
        {status === 'starting' && (
          <div className={s.viewerLoading} style={{ color: '#fff' }}>
            Opening the camera…
          </div>
        )}

        {/* Reticle Brackets (Page 6) */}
        <div className={s.cameraReticle} aria-hidden>
          <span className={s.reticleTL} />
          <span className={s.reticleTR} />
          <span className={s.reticleBL} />
          <span className={s.reticleBR} />
        </div>

        {/* Center Target Pill */}
        <div className={s.cameraCenterPill}>
          <span>Ready to scan!</span>
        </div>
      </div>

      {filePicker}

      {/* Controls Row (Page 6) */}
      <div className={s.cameraControls}>
        <button className={s.cameraSubBtn} onClick={() => fileRef.current?.click()}>
          🖼️ Photo
        </button>
        <button
          className={s.shutterBtnLarge}
          onClick={snap}
          disabled={status !== 'live'}
          aria-label="Take photo"
        >
          <span className={s.shutterInnerRing} />
        </button>
        <button className={s.cameraSubBtn} onClick={onCancel}>
          Cancel
        </button>
      </div>

      {/* Privacy Footnote (Page 6) */}
      <p className={s.cameraPrivacyNote}>
        Your picture is only used to explain it. It&apos;s never saved.
      </p>
    </div>
  )
}
