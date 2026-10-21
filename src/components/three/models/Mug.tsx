'use client'
import { useMemo } from 'react'
import * as THREE from 'three'
import { Part } from '../partContext'

const v2 = (pts: [number, number][]) => pts.map(([x, y]) => new THREE.Vector2(x, y))
const GLAZE = '#ef7d62'
const CREAM = '#fff8ef'

/** Ceramic coffee mug: handle, rim, body, base. */
export default function MugModel() {
  const outer = useMemo(() => v2([[0.36, -0.33], [0.366, -0.1], [0.364, 0.15], [0.36, 0.34]]), [])
  const inner = useMemo(() => v2([[0, -0.3], [0.29, -0.3], [0.318, -0.27], [0.325, 0.0], [0.325, 0.34]]), [])
  const rim = useMemo(
    () => v2([[0.36, 0.34], [0.362, 0.37], [0.354, 0.392], [0.34, 0.4], [0.33, 0.394], [0.325, 0.37], [0.325, 0.34]]),
    [],
  )
  const base = useMemo(
    () => v2([[0, -0.4], [0.3, -0.4], [0.33, -0.396], [0.35, -0.378], [0.36, -0.355], [0.36, -0.33]]),
    [],
  )
  return (
    <group rotation={[0.32, -0.5, 0]}>
      <Part id="body" view={[0.1, 0.25, 1]}>
        <mesh>
          <latheGeometry args={[outer, 64]} />
          <meshStandardMaterial color={GLAZE} roughness={0.3} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <latheGeometry args={[inner, 64]} />
          <meshStandardMaterial color={CREAM} roughness={0.25} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.323, 0.323, 0.01, 64]} />
          <meshStandardMaterial color="#6b3e26" roughness={0.25} />
        </mesh>
      </Part>
      <Part id="rim" dir={[0, 0.22, 0]} view={[0, 1, 0.8]}>
        <mesh>
          <latheGeometry args={[rim, 64]} />
          <meshStandardMaterial color={CREAM} roughness={0.25} side={THREE.DoubleSide} />
        </mesh>
      </Part>
      <Part id="base" dir={[0, -0.2, 0]} view={[0.2, -0.7, 1]}>
        <mesh>
          <latheGeometry args={[base, 64]} />
          <meshStandardMaterial color="#d8c7ae" roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
      </Part>
      <Part id="handle" dir={[0.28, 0, 0]} view={[1, 0.2, 0.6]}>
        <mesh position={[0.33, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <torusGeometry args={[0.16, 0.042, 18, 40, Math.PI]} />
          <meshStandardMaterial color={GLAZE} roughness={0.3} />
        </mesh>
      </Part>
    </group>
  )
}
