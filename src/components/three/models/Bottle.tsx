'use client'
import { useMemo } from 'react'
import * as THREE from 'three'
import { Part } from '../partContext'

const v2 = (pts: [number, number][]) => pts.map(([x, y]) => new THREE.Vector2(x, y))

/** Plastic water bottle: cap, neck, body, base. ~1 unit tall, centered. */
export default function BottleModel() {
  const base = useMemo(() => v2([[0, -0.5], [0.12, -0.5], [0.165, -0.49], [0.19, -0.47], [0.2, -0.44], [0.2, -0.4]]), [])
  const body = useMemo(
    () => v2([[0.2, -0.4], [0.2, -0.31], [0.188, -0.29], [0.2, -0.27], [0.2, -0.05], [0.188, -0.03], [0.2, -0.01], [0.2, 0.1], [0.195, 0.14]]),
    [],
  )
  const neck = useMemo(() => v2([[0.195, 0.14], [0.18, 0.2], [0.14, 0.265], [0.1, 0.305], [0.08, 0.325], [0.078, 0.36]]), [])
  const water = useMemo(() => v2([[0, -0.47], [0.17, -0.47], [0.185, -0.45], [0.185, 0.06], [0, 0.06]]), [])
  const ridges = useMemo(() => Array.from({ length: 28 }, (_, i) => (i / 28) * Math.PI * 2), [])

  return (
    <group>
      <Part id="cap" dir={[0, 0.32, 0]} view={[0.3, 0.8, 1]}>
        <mesh position={[0, 0.405, 0]}>
          <cylinderGeometry args={[0.086, 0.088, 0.1, 40]} />
          <meshStandardMaterial color="#2f86d6" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.456, 0]}>
          <cylinderGeometry args={[0.08, 0.086, 0.006, 40]} />
          <meshStandardMaterial color="#3a93e0" roughness={0.4} />
        </mesh>
        {ridges.map((a) => (
          <mesh key={a} position={[Math.cos(a) * 0.088, 0.405, Math.sin(a) * 0.088]} rotation={[0, -a, 0]}>
            <boxGeometry args={[0.008, 0.085, 0.01]} />
            <meshStandardMaterial color="#2a7bc6" roughness={0.5} />
          </mesh>
        ))}
      </Part>
      <Part id="neck" dir={[0, 0.16, 0]} view={[0.4, 0.5, 1]}>
        <mesh>
          <latheGeometry args={[neck, 48]} />
          <meshStandardMaterial color="#cdeaf8" transparent opacity={0.55} roughness={0.08} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.335, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.085, 0.008, 10, 40]} />
          <meshStandardMaterial color="#bfe2f4" roughness={0.2} />
        </mesh>
      </Part>
      <Part id="body" view={[0, 0.2, 1]}>
        <mesh>
          <latheGeometry args={[body, 48]} />
          <meshStandardMaterial color="#cdeaf8" transparent opacity={0.5} roughness={0.08} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <mesh>
          <latheGeometry args={[water, 48]} />
          <meshStandardMaterial color="#7cc6ee" transparent opacity={0.45} roughness={0.1} depthWrite={false} />
        </mesh>
        <mesh position={[0, -0.16, 0]}>
          <cylinderGeometry args={[0.203, 0.203, 0.2, 48, 1, true]} />
          <meshStandardMaterial color="#2f9e6e" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.16, 0]}>
          <cylinderGeometry args={[0.204, 0.204, 0.05, 48, 1, true]} />
          <meshStandardMaterial color="#ffffff" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
      </Part>
      <Part id="base" dir={[0, -0.2, 0]} view={[0.3, -0.5, 1]}>
        <mesh>
          <latheGeometry args={[base, 48]} />
          <meshStandardMaterial color="#b9dff3" transparent opacity={0.65} roughness={0.1} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </Part>
    </group>
  )
}
