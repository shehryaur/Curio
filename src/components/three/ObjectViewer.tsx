'use client'
// Curio 3D object viewer (default export, implements ObjectViewerProps).
// Load with next/dynamic(() => import('@/components/three/ObjectViewer'), { ssr: false, loading: () => <ViewerLoading /> }).
//
// Render order of preference:
//   1. glbUrl (Meshy)            -> GlbModel with numbered anchor pins
//   2. lesson.templateId         -> hand-made procedural model (models/*)
//   3. photoUrl                  -> PhotoPins (2D photo + pins)
//   4. nothing                   -> PhotoPins with the lesson emoji
// The .glb is fetched with GLTFLoader outside the Canvas; a load error falls through to 2/3/4.
// While it loads: photo + pins with a "Building your 3D model…" chip (or the template / loading card).
// A WebGL failure falls through to 3/4.
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
} from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { CameraControls, CameraControlsImpl, ContactShadows, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { AgeMode, ObjectViewerProps, PartInfo } from '@/lib/types'
import { TEMPLATE_MODELS } from './models'
import GlbModel, { disposeScene, loadGlb } from './GlbModel'
import ViewerLoading from './ViewerLoading'
import PhotoPins from './PhotoPins'
import { Normalize, ViewerCtx, type Interaction, type LiveState, type PartMeta, type ViewerCtxValue } from './partContext'
import styles from './ObjectViewer.module.css'

const DEFAULT_POS: [number, number, number] = [0, 0.35, 2.55]
const BG = '#fbfaf8'

// ---------- error boundaries ----------

class Boundary extends Component<{ onError: (e: unknown) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown, _info: ErrorInfo) {
    this.props.onError(error)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

// ---------- camera ----------

function CameraRig({
  controls,
  registry,
  focusId,
  explode,
  autoRotate,
}: {
  controls: MutableRefObject<CameraControlsImpl | null>
  registry: MutableRefObject<Map<string, PartMeta>>
  focusId: string | null
  explode: number
  autoRotate: boolean
}) {
  const camera = useThree((s) => s.camera)
  const first = useRef(true)

  useEffect(() => {
    let tries = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    const box = new THREE.Box3()
    const run = () => {
      const c = controls.current
      if (!c) {
        if (tries++ < 20) timer = setTimeout(run, 150)
        return
      }
      const animate = !first.current
      first.current = false
      if (!focusId) {
        void c.setLookAt(DEFAULT_POS[0], DEFAULT_POS[1], DEFAULT_POS[2], 0, 0, 0, animate)
        return
      }
      const meta = registry.current.get(focusId)
      if (!meta) {
        // model may still be loading (GLB Suspense) — retry for a few seconds
        if (tries++ < 30) timer = setTimeout(run, 200)
        return
      }
      meta.obj.updateWorldMatrix(true, true)
      box.setFromObject(meta.obj)
      if (box.isEmpty()) return
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      const local = meta.view
        ? new THREE.Vector3(...meta.view)
        : new THREE.Vector3(...meta.dir).normalize().multiplyScalar(0.9).add(new THREE.Vector3(0, 0.3, 0.7))
      if (local.lengthSq() < 1e-6) local.set(0, 0.3, 1)
      const parent = meta.obj.parent
      const world = parent ? local.transformDirection(parent.matrixWorld) : local.normalize()
      const camDir = camera.position.clone().sub(center).normalize()
      const dir = world.multiplyScalar(0.8).add(camDir.multiplyScalar(0.2)).normalize()
      const maxDim = Math.max(size.x, size.y, size.z)
      const dist = meta.focusDistance ?? THREE.MathUtils.clamp(maxDim * 2.6 + 0.55, 0.75, 2.6)
      void c.setLookAt(
        center.x + dir.x * dist,
        center.y + dir.y * dist,
        center.z + dir.z * dist,
        center.x,
        center.y,
        center.z,
        animate,
      )
    }
    // when explode changes while focused, wait for the parts to settle first
    timer = setTimeout(run, focusId && !first.current ? 60 : 0)
    return () => {
      if (timer) clearTimeout(timer)
    }
    // explode only matters while focused
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, focusId ? explode : 0])

  // re-frame once more after an explode animation finishes
  useEffect(() => {
    if (!focusId) return
    const t = setTimeout(() => {
      const c = controls.current
      const meta = registry.current.get(focusId)
      if (!c || !meta) return
      const box = new THREE.Box3().setFromObject(meta.obj)
      if (box.isEmpty()) return
      const center = box.getCenter(new THREE.Vector3())
      void c.moveTo(center.x, center.y, center.z, true)
    }, 700)
    return () => clearTimeout(t)
  }, [focusId, explode, controls, registry])

  // exploded view needs more room: back the camera off (keeps the user's rotation)
  const exploded = useRef(false)
  useEffect(() => {
    const c = controls.current
    if (!c || focusId) return
    const base = Math.hypot(DEFAULT_POS[0], DEFAULT_POS[1], DEFAULT_POS[2])
    if (explode <= 0.01 && !exploded.current) return
    exploded.current = explode > 0.01
    const t = setTimeout(() => void c.dollyTo(base * (1 + 0.45 * Math.min(1, Math.max(0, explode))), true), 40)
    return () => clearTimeout(t)
  }, [explode, focusId, controls])

  useFrame((_, dt) => {
    const c = controls.current
    if (!c || !autoRotate || focusId) return
    void c.rotate(Math.min(dt, 0.05) * 0.3, 0, false)
  })
  return null
}

// ---------- hover label ----------

function HoverLabel({
  hovered,
  parts,
  mode,
  registry,
  portal,
}: {
  hovered: string
  parts: PartInfo[]
  mode: AgeMode
  registry: MutableRefObject<Map<string, PartMeta>>
  portal: RefObject<HTMLDivElement | null>
}) {
  const group = useRef<THREE.Group>(null)
  const box = useMemo(() => new THREE.Box3(), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])
  const place = useCallback(() => {
    const g = group.current
    const meta = registry.current.get(hovered)
    if (!g || !meta) return
    box.setFromObject(meta.obj)
    if (box.isEmpty()) return
    box.getCenter(tmp)
    g.position.set(tmp.x, box.max.y + 0.02, tmp.z)
  }, [box, tmp, hovered, registry])
  useLayoutEffect(place, [place])
  useFrame(place)
  const part = parts.find((p) => p.id === hovered)
  if (!part) return null
  return (
    <group ref={group}>
      <Html portal={portal as RefObject<HTMLElement>} zIndexRange={[40, 0]} pointerEvents="none" style={{ pointerEvents: 'none' }}>
        <div className={styles.label} role="tooltip">
          <strong>{part.name[mode]}</strong>
          <span>{part.short[mode]}</span>
        </div>
      </Html>
    </group>
  )
}

// ---------- 3D stage ----------

interface StageProps extends ObjectViewerProps {
  kind: 'glb' | 'template'
  glbScene: THREE.Object3D | null
}

function Stage3D(props: StageProps) {
  const {
    kind,
    lesson,
    mode,
    focusPartId = null,
    highlightPartId = null,
    interaction,
    showLabels = false,
    explode = 0,
    onPartHover,
    onPartClick,
    glbScene,
  } = props
  const [hovered, setHoveredState] = useState<string | null>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const controls = useRef<CameraControlsImpl | null>(null)
  const registry = useRef(new Map<string, PartMeta>())
  const live = useRef<LiveState>({ hovered: null, focus: null, highlight: null, explode: 0 })
  live.current.hovered = interaction === 'none' ? null : hovered
  live.current.focus = focusPartId
  live.current.highlight = highlightPartId
  live.current.explode = kind === 'template' ? explode : 0

  const clickRef = useRef(onPartClick)
  clickRef.current = onPartClick
  const hoverRef = useRef(onPartHover)
  hoverRef.current = onPartHover
  const lastHover = useRef<string | null>(null)

  const setHovered = useCallback((fn: (cur: string | null) => string | null) => setHoveredState(fn), [])
  const handleClick = useCallback((id: string) => clickRef.current?.(id), [])

  useEffect(() => {
    if (interaction === 'none') setHoveredState(null)
  }, [interaction])

  useEffect(() => {
    if (lastHover.current === hovered) return
    lastHover.current = hovered
    hoverRef.current?.(hovered)
  }, [hovered])

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    el.style.cursor = interaction === 'none' ? 'grab' : hovered ? 'pointer' : 'grab'
  }, [hovered, interaction])

  const ctx = useMemo<ViewerCtxValue>(
    () => ({ interaction: interaction as Interaction, live, registry, setHovered, onPartClick: handleClick, portal: wrap }),
    [interaction, setHovered, handleClick],
  )

  const onControlsRef = useCallback((c: CameraControlsImpl | null) => {
    controls.current = c
    if (!c) return
    const A = CameraControlsImpl.ACTION
    c.mouseButtons.right = A.NONE
    c.mouseButtons.middle = A.NONE
    c.mouseButtons.wheel = A.DOLLY
    c.touches.two = A.TOUCH_DOLLY
    c.touches.three = A.NONE
    c.smoothTime = 0.45
    c.dollySpeed = 0.5
  }, [])

  const Model = lesson.templateId ? TEMPLATE_MODELS[lesson.templateId] : null

  return (
    <div ref={wrap} className={styles.root}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: DEFAULT_POS, fov: 38, near: 0.05, far: 50 }}
        gl={{ antialias: true }}
        onPointerMissed={() => setHoveredState(null)}
        className={styles.canvas}
      >
        <color attach="background" args={[BG]} />
        <ambientLight intensity={0.55} />
        <hemisphereLight args={['#ffffff', '#e9e2d6', 0.65]} />
        <directionalLight position={[2.5, 4, 3]} intensity={1.5} />
        <directionalLight position={[-3, 1.5, -2]} intensity={0.45} color="#f3f0ff" />
        <ViewerCtx.Provider value={ctx}>
          <Suspense fallback={null}>
            {kind === 'glb' && glbScene ? (
              <GlbModel scene={glbScene} parts={lesson.parts} />
            ) : Model ? (
              <Normalize key={lesson.templateId}>
                <Model />
              </Normalize>
            ) : null}
          </Suspense>
          {showLabels && hovered && interaction !== 'none' && (
            <HoverLabel hovered={hovered} parts={lesson.parts} mode={mode} registry={registry} portal={wrap} />
          )}
        </ViewerCtx.Provider>
        <ContactShadows position={[0, -0.64, 0]} opacity={0.32} scale={3} blur={2.6} far={1.3} resolution={512} color="#5b5346" />
        <CameraControls ref={onControlsRef} makeDefault minDistance={0.45} maxDistance={4.5} />
        <CameraRig
          controls={controls}
          registry={registry}
          focusId={focusPartId}
          explode={kind === 'template' ? explode : 0}
          autoRotate={interaction === 'none'}
        />
      </Canvas>
      {interaction !== 'none' && (
        <div className={styles.srOnly}>
          {lesson.parts.map((p) => (
            <button
              key={p.id}
              type="button"
              onFocus={() => setHoveredState(p.id)}
              onBlur={() => setHoveredState((c) => (c === p.id ? null : c))}
              onClick={() => clickRef.current?.(p.id)}
            >
              {p.name[mode]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- public component ----------

type GlbState = { url: string; scene: THREE.Group | null; failed: boolean }

export default function ObjectViewer(props: ObjectViewerProps) {
  const { lesson, mode, glbUrl, photoUrl } = props
  const [glb, setGlb] = useState<GlbState | null>(null)
  const [webglFailed, setWebglFailed] = useState(false)

  // Load the Meshy model outside the Canvas: errors become state, never exceptions in the 3D tree.
  useEffect(() => {
    if (!glbUrl) {
      setGlb(null)
      return
    }
    let alive = true
    let loaded: THREE.Group | null = null
    setGlb({ url: glbUrl, scene: null, failed: false })
    loadGlb(glbUrl).then(
      (scene) => {
        if (!alive) {
          disposeScene(scene)
          return
        }
        loaded = scene
        setGlb({ url: glbUrl, scene, failed: false })
      },
      (err: unknown) => {
        if (!alive) return
        console.warn('[ObjectViewer] .glb failed to load, falling back', err)
        setGlb({ url: glbUrl, scene: null, failed: true })
      },
    )
    return () => {
      alive = false
      // let the Canvas unmount first, then free GPU memory
      if (loaded) {
        const s = loaded
        setTimeout(() => disposeScene(s), 0)
      }
    }
  }, [glbUrl])

  const current = glb && glb.url === glbUrl ? glb : null
  const glbReady = !!current?.scene
  const glbLoading = !!glbUrl && (!current || (!current.scene && !current.failed))
  const hasTemplate = !!lesson.templateId && !!TEMPLATE_MODELS[lesson.templateId]

  const pins = (
    <PhotoPins
      parts={lesson.parts}
      mode={mode}
      photoUrl={photoUrl}
      emoji={lesson.emoji}
      focusPartId={props.focusPartId}
      highlightPartId={props.highlightPartId}
      interaction={props.interaction}
      showLabels={props.showLabels}
      onPartHover={props.onPartHover}
      onPartClick={props.onPartClick}
    />
  )

  if (glbLoading && !webglFailed) {
    // show the photo with pins while the model downloads (if we have one), else the loading card
    if (photoUrl) {
      return (
        <div className={styles.stack}>
          {pins}
          <div className={styles.loadingChip}>
            <span className={styles.spinner} aria-hidden />
            Building your 3D model…
          </div>
        </div>
      )
    }
    if (!hasTemplate) return <ViewerLoading />
  }

  const kind: 'glb' | 'template' | null = glbReady ? 'glb' : hasTemplate ? 'template' : null
  if (webglFailed || !kind) return pins

  return (
    <Boundary
      onError={(e) => {
        console.warn('[ObjectViewer] 3D unavailable, showing 2D pins', e)
        setWebglFailed(true)
      }}
    >
      <Stage3D
        key={kind === 'glb' ? `glb:${glbUrl}` : `tpl:${lesson.templateId}`}
        {...props}
        kind={kind}
        glbScene={kind === 'glb' ? (current?.scene ?? null) : null}
      />
    </Boundary>
  )
}
