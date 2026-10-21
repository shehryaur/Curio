'use client'
// Shared plumbing for the 3D viewer: a context that every <Part> reads, plus the <Part> wrapper that
// handles hover/click events, emissive glow (hover / focus / highlight) and exploded-view offsets.
import { createContext, useContext, useLayoutEffect, useRef, type MutableRefObject, type ReactNode, type RefObject } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'

export type Vec3 = [number, number, number]
export type Interaction = 'none' | 'click' | 'hover'

export interface PartMeta {
  /** The moving group (includes explode offset) — used for focus framing and label placement. */
  obj: THREE.Object3D
  /** Explode offset at explode = 1, in the part's parent (model) space. */
  dir: Vec3
  /** Preferred camera direction (model space) when this part is focused. */
  view?: Vec3
  /** Fixed camera distance when focused (pins use this). */
  focusDistance?: number
}

export interface LiveState {
  hovered: string | null
  focus: string | null
  highlight: string | null
  explode: number
}

export interface ViewerCtxValue {
  interaction: Interaction
  live: MutableRefObject<LiveState>
  registry: MutableRefObject<Map<string, PartMeta>>
  setHovered: (fn: (cur: string | null) => string | null) => void
  onPartClick?: (id: string) => void
  /** Stable DOM element that drei <Html> portals into (avoids re-mounting Html roots). */
  portal: RefObject<HTMLDivElement | null>
}

export const ViewerCtx = createContext<ViewerCtxValue | null>(null)

export function useViewerCtx(): ViewerCtxValue {
  const v = useContext(ViewerCtx)
  if (!v) throw new Error('Part must be rendered inside ObjectViewer')
  return v
}

export const GLOW_COLOR = new THREE.Color('#58cc02')

interface MatEntry {
  m: THREE.MeshStandardMaterial
  base: THREE.Color
  baseI: number
}

/** Target glow 0..1 for a part id given the live state. */
export function glowTarget(id: string, live: LiveState, interaction: Interaction, t: number): number {
  let g = 0
  if (live.hovered === id && interaction !== 'none') g = 0.3
  if (live.focus === id) g = Math.max(g, 0.48)
  if (live.highlight === id) g = 0.8 + 0.15 * Math.sin(t * 5)
  return g
}

interface PartProps {
  id: string
  dir?: Vec3
  view?: Vec3
  focusDistance?: number
  position?: Vec3
  children: ReactNode
}

export function Part({ id, dir = [0, 0, 0], view, focusDistance, position, children }: PartProps) {
  const ctx = useViewerCtx()
  const inner = useRef<THREE.Group>(null)
  const mats = useRef<MatEntry[]>([])
  const glow = useRef(0)
  const target = useRef(new THREE.Vector3())
  const dirKey = dir.join(',')
  const viewKey = view ? view.join(',') : ''

  useLayoutEffect(() => {
    const g = inner.current
    if (!g) return
    const list: MatEntry[] = []
    g.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const arr = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const m of arr) {
        const sm = m as THREE.MeshStandardMaterial
        if (sm && sm.isMeshStandardMaterial) list.push({ m: sm, base: sm.emissive.clone(), baseI: sm.emissiveIntensity })
      }
    })
    mats.current = list
    const reg = ctx.registry.current
    reg.set(id, { obj: g, dir, view, focusDistance })
    return () => {
      if (reg.get(id)?.obj === g) reg.delete(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, dirKey, viewKey, focusDistance, ctx.registry])

  useFrame((state, dt) => {
    const live = ctx.live.current
    const k = 1 - Math.exp(-Math.min(dt, 0.1) * 9)
    const tg = glowTarget(id, live, ctx.interaction, state.clock.elapsedTime)
    glow.current += (tg - glow.current) * k
    const gl = glow.current
    for (const e of mats.current) {
      e.m.emissive.copy(e.base).lerp(GLOW_COLOR, gl)
      e.m.emissiveIntensity = e.baseI + (Math.max(e.baseI, 1) - e.baseI) * gl
    }
    const g = inner.current
    if (g) {
      const ex = Math.max(0, Math.min(1, live.explode))
      target.current.set(dir[0] * ex, dir[1] * ex, dir[2] * ex)
      g.position.lerp(target.current, 1 - Math.exp(-Math.min(dt, 0.1) * 6))
    }
  })

  const active = ctx.interaction !== 'none'
  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    ctx.setHovered(() => id)
  }
  const out = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    ctx.setHovered((cur) => (cur === id ? null : cur))
  }
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (e.delta > 8) return // it was a drag-to-rotate, not a tap
    if (ctx.interaction === 'hover') ctx.setHovered(() => id) // touch: a tap shows the label
    ctx.onPartClick?.(id)
  }

  return (
    <group
      name={id}
      userData={{ partId: id }}
      position={position}
      onPointerOver={active ? over : undefined}
      onPointerOut={active ? out : undefined}
      onClick={active ? click : undefined}
    >
      <group ref={inner}>{children}</group>
    </group>
  )
}

/** Centers its children and scales them so the largest dimension equals `size` (measured once, explode = 0). */
export function Normalize({ children, size = 1.1 }: { children: ReactNode; size?: number }) {
  const outer = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  useLayoutEffect(() => {
    const o = outer.current
    const i = inner.current
    if (!o || !i) return
    o.scale.setScalar(1)
    i.position.set(0, 0, 0)
    o.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(i)
    if (box.isEmpty()) return
    const s = box.getSize(new THREE.Vector3())
    const c = box.getCenter(new THREE.Vector3())
    // box is in world space; outer sits at the scene root with identity transform here
    i.position.set(-c.x, -c.y, -c.z)
    const max = Math.max(s.x, s.y, s.z) || 1
    o.scale.setScalar(size / max)
    o.updateWorldMatrix(true, true)
  }, [size])
  return (
    <group ref={outer}>
      <group ref={inner}>{children}</group>
    </group>
  )
}

/** Spread fallback anchors on a ring when a photo part has none. */
export function defaultAnchor(i: number, n: number): Vec3 {
  const a = -Math.PI / 2 + (i * Math.PI * 2) / Math.max(1, n)
  return [Math.round(Math.cos(a) * 55) / 100, Math.round(-Math.sin(a) * 55) / 100, 0.4]
}
