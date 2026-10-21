// <model-viewer> + hotspots + Framer Motion owl/reticle/finger + subtitle bar. Owner: Sruthi
// Minimal version: model-viewer when the .glb exists, else a placeholder panel; same pins either way.
'use client'

import { useEffect, useRef, useState, type DetailedHTMLProps, type HTMLAttributes } from 'react'
import { PROP_PRESETS, type Hotspot } from '@/lib/propPresets'
import { getJson, postJson } from '@/lib/api'
import type { AgeMode, AnalyzeResponse, MeshyStatus, TourStep } from '@/lib/types'
import type { StepNumber } from '@/hooks/useCurioSession'

type ModelViewerAttrs = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  src?: string
  alt?: string
  'camera-controls'?: string
  'camera-orbit'?: string
  'camera-target'?: string
  'interpolation-decay'?: string
  'shadow-intensity'?: string
  'touch-action'?: string
}
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerAttrs
    }
  }
}

interface Props {
  analysis: AnalyzeResponse
  mode: AgeMode
  activeStep: StepNumber | null
  isStepLocked: (step: TourStep) => boolean
  onPin: (n: StepNumber) => void
  subtitle: string
  isSpeaking: boolean
  lastImage: string | null
}

type ModelState = 'checking' | 'ok' | 'missing'

/** Zoom in on one part (plain-words mode): target the hotspot and halve the orbit radius. */
function focusOrbit(orbit: string, hs: Hotspot | undefined): { orbit: string; target?: string } {
  if (!hs) return { orbit }
  const parts = orbit.split(/\s+/)
  const r = parseFloat(parts[2] ?? '')
  if (parts.length === 3 && Number.isFinite(r)) parts[2] = `${(r / 2).toFixed(3)}m`
  return { orbit: parts.join(' '), target: hs.position.split(/\s+/).map((v) => `${v}m`).join(' ') }
}

function MeshyGenerator({ imageBase64, onReady }: { imageBase64: string | null; onReady: (src: string) => void }) {
  const [status, setStatus] = useState<MeshyStatus | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  const start = async () => {
    if (!imageBase64) return
    setErr(null)
    const res = await postJson<MeshyStatus & { error?: string }>('/api/meshy', { imageBase64 })
    if (!res.ok) return setErr(res.error)
    if (res.data.status === 'UNAVAILABLE' || !res.data.taskId) return setErr(res.data.error ?? '3D generation unavailable')
    setStatus(res.data)
    const taskId = res.data.taskId
    timer.current = setInterval(async () => {
      const s = await getJson<MeshyStatus & { error?: string }>(`/api/meshy?taskId=${encodeURIComponent(taskId)}`)
      if (!s.ok) return setErr(s.error) // keep polling; transient errors happen
      setStatus(s.data)
      if (s.data.status === 'SUCCEEDED') {
        if (timer.current) clearInterval(timer.current)
        onReady(`/api/meshy?proxy=${encodeURIComponent(taskId)}`)
      } else if (s.data.status === 'FAILED' || s.data.status === 'UNAVAILABLE') {
        if (timer.current) clearInterval(timer.current)
        setErr(s.data.error ?? `3D generation ${s.data.status.toLowerCase()}`)
      }
    }, 5000)
  }

  if (!imageBase64) return null
  const busy = status && (status.status === 'PENDING' || status.status === 'IN_PROGRESS')
  return (
    <div className="curio-row curio-wrap">
      <button className="curio-btn ghost" disabled={!!busy} onClick={start}>
        {busy ? `Generating 3D… ${status?.progress ?? 0}%` : 'Generate 3D (Meshy)'}
      </button>
      {err && <span className="curio-error">{err}</span>}
    </div>
  )
}

export function Curio3DStage({ analysis, mode, activeStep, isStepLocked, onPin, subtitle, isSpeaking, lastImage }: Props) {
  const type = analysis.detectedPropType
  const preset = type === 'wildcard' ? null : PROP_PRESETS[type]
  const [meshySrc, setMeshySrc] = useState<string | null>(null)
  const src = preset?.modelUrl ?? meshySrc
  const [modelState, setModelState] = useState<ModelState>('checking')
  const mvRef = useRef<HTMLElement | null>(null)

  // Register the custom element (browser only).
  useEffect(() => {
    void import('@google/model-viewer').catch(() => setModelState('missing'))
  }, [])

  useEffect(() => setMeshySrc(null), [analysis])

  // Does the .glb exist? (HEAD for static files; Meshy proxy relies on the error event.)
  useEffect(() => {
    if (!src) return setModelState('missing')
    if (src.startsWith('/api/')) return setModelState('ok')
    let alive = true
    setModelState('checking')
    fetch(src, { method: 'HEAD' })
      .then((r) => {
        const ct = r.headers.get('content-type') ?? ''
        if (alive) setModelState(r.ok && !ct.includes('text/html') ? 'ok' : 'missing')
      })
      .catch(() => alive && setModelState('missing'))
    return () => { alive = false }
  }, [src])

  useEffect(() => {
    const el = mvRef.current
    if (!el || modelState !== 'ok') return
    const onError = () => setModelState('missing')
    el.addEventListener('error', onError)
    return () => el.removeEventListener('error', onError)
  }, [modelState, src])

  const plain = mode === 'plainWords'
  const visibleSteps = plain && activeStep ? analysis.steps.filter((s) => s.stepNumber === activeStep) : analysis.steps
  const activeHs = preset?.hotspots.find((h) => h.stepNumber === activeStep)
  const cam = preset ? (plain ? focusOrbit(preset.cameraOrbit, activeHs) : { orbit: preset.cameraOrbit }) : { orbit: 'auto auto auto' }

  const pinClass = (s: TourStep) =>
    `curio-pin${s.stepNumber === activeStep ? ' active' : ''}${isStepLocked(s) ? ' locked' : ''}${plain ? ' big' : ''}`

  return (
    <div className="curio-stage">
      <div className="curio-stage-view">
        {modelState === 'ok' && src ? (
          <model-viewer
            ref={mvRef}
            className="curio-model"
            src={src}
            alt={analysis.objectTitle}
            camera-controls=""
            touch-action="pan-y"
            camera-orbit={cam.orbit}
            camera-target={cam.target}
            interpolation-decay="120"
            shadow-intensity="1"
          >
            {preset &&
              visibleSteps.map((s) => {
                const hs = preset.hotspots.find((h) => h.stepNumber === s.stepNumber)
                if (!hs) return null
                return (
                  <button
                    key={s.stepNumber}
                    slot={`hotspot-${s.stepNumber}`}
                    data-position={hs.position}
                    data-normal={hs.normal}
                    className={`curio-hotspot ${pinClass(s)}`}
                    onClick={() => onPin(s.stepNumber)}
                    aria-label={`Part ${s.stepNumber}: ${s.partName}`}
                  >
                    {isStepLocked(s) ? '🔒' : s.stepNumber}
                  </button>
                )
              })}
          </model-viewer>
        ) : (
          <div className="curio-placeholder">
            <div className="curio-placeholder-title">{analysis.objectTitle}</div>
            <p>{modelState === 'checking' ? 'Loading 3D model…' : '3D model not available - tap a numbered part below.'}</p>
          </div>
        )}
        <div className={`curio-subtitle${isSpeaking ? ' speaking' : ''}`} aria-live="polite">
          {subtitle || 'Tap ▶ Play guided tour or a numbered part.'}
        </div>
      </div>

      <div className="curio-pins">
        {visibleSteps.map((s) => (
          <button key={s.stepNumber} className={pinClass(s)} onClick={() => onPin(s.stepNumber)}>
            {isStepLocked(s) ? '🔒' : s.stepNumber} · {s.partName}
          </button>
        ))}
      </div>

      {type === 'wildcard' && !meshySrc && <MeshyGenerator imageBase64={lastImage} onReady={setMeshySrc} />}
    </div>
  )
}
