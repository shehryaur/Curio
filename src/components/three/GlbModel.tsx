'use client'
// Meshy .glb model (already loaded by ObjectViewer via loadGlb): normalizes the model (center + fit to ~1.1 units) and adds numbered pin markers
// for each part at its `anchor` (each axis -1..1 mapped onto the bbox half-extents, pushed slightly outward).
import { useMemo, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'
import type { PartInfo } from '@/lib/types'
import { Part, defaultAnchor, useViewerCtx, type Vec3 } from './partContext'
import styles from './ObjectViewer.module.css'

const FIT = 1.1

function Pin({ id, n }: { id: string; n: number }) {
  const ctx = useViewerCtx()
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    const m = ref.current
    if (!m) return
    const L = ctx.live.current
    const t = state.clock.elapsedTime
    let s = 1
    if (L.hovered === id && ctx.interaction !== 'none') s = 1.2
    if (L.focus === id || L.highlight === id) s = 1.3 + 0.12 * Math.sin(t * 5)
    m.scale.setScalar(THREE.MathUtils.lerp(m.scale.x, s, 0.2))
  })
  return (
    <>
      <mesh ref={ref}>
        <sphereGeometry args={[0.045, 24, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.35} />
      </mesh>
      <Html portal={ctx.portal as RefObject<HTMLElement>} position={[0.05, 0.05, 0]} zIndexRange={[20, 0]} pointerEvents="none" style={{ pointerEvents: 'none' }}>
        <span className={styles.pinBadge}>{n}</span>
      </Html>
    </>
  )
}

/** Load a .glb outside React/Suspense so a failure never throws inside the Canvas. */
export function loadGlb(url: string): Promise<THREE.Group> {
  return new GLTFLoader().loadAsync(url).then((g) => g.scene)
}

/** Free GPU memory of a loaded scene (geometries, materials, textures). */
export function disposeScene(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    mesh.geometry?.dispose()
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const m of mats) {
      if (!m) continue
      for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose()
      m.dispose()
    }
  })
}

export default function GlbModel({ scene, parts }: { scene: THREE.Object3D; parts: PartInfo[] }) {
  const fit = useMemo(() => {
    const obj = scene
    obj.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(obj)
    const size = box.isEmpty() ? new THREE.Vector3(1, 1, 1) : box.getSize(new THREE.Vector3())
    const center = box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3())
    const k = FIT / (Math.max(size.x, size.y, size.z) || 1)
    const half = size.clone().multiplyScalar(k / 2)
    return { obj, center, k, half }
  }, [scene])

  const pins = useMemo(
    () =>
      parts.map((p, i) => {
        const a = p.anchor ?? defaultAnchor(i, parts.length)
        const pos = new THREE.Vector3(a[0] * fit.half.x, a[1] * fit.half.y, a[2] * fit.half.z)
        const out = pos.lengthSq() > 1e-6 ? pos.clone().normalize() : new THREE.Vector3(0, 0, 1)
        pos.addScaledVector(out, 0.06)
        const view = new THREE.Vector3(a[0], a[1], a[2] + 0.8).normalize()
        return {
          id: p.id,
          pos: [pos.x, pos.y, pos.z] as Vec3,
          view: [view.x, view.y, view.z] as Vec3,
        }
      }),
    [parts, fit],
  )

  return (
    <>
      <group scale={fit.k}>
        <primitive object={fit.obj} position={[-fit.center.x, -fit.center.y, -fit.center.z]} />
      </group>
      {pins.map((p, i) => (
        <Part key={p.id} id={p.id} position={p.pos} view={p.view} focusDistance={1.55}>
          <Pin id={p.id} n={i + 1} />
        </Part>
      ))}
    </>
  )
}
