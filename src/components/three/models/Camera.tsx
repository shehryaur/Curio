'use client'
import * as THREE from 'three'
import { Part } from '../partContext'

/** Stylized antique bellows view camera: lens, bellows, body, back, tripod. */
export default function CameraModel() {
  return (
    <group position={[0, 0.1, 0]}>
      {/* 1. Lens */}
      <Part id="lens" dir={[0, 0, 0.25]} view={[0, 0.2, 1]}>
        <mesh position={[0, 0.1, 0.32]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.08, 0.1, 32]} />
          <meshStandardMaterial color="#c09853" metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.1, 0.38]}>
          <circleGeometry args={[0.06, 32]} />
          <meshStandardMaterial color="#1a2530" metalness={0.9} roughness={0.1} />
        </mesh>
      </Part>

      {/* 2. Bellows */}
      <Part id="bellows" dir={[0, 0, 0.1]} view={[0.5, 0.3, 0.8]}>
        <mesh position={[0, 0.1, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.19, 0.28, 4]} />
          <meshStandardMaterial color="#8b1e1e" roughness={0.7} />
        </mesh>
      </Part>

      {/* 3. Body */}
      <Part id="body" view={[0.4, 0.2, 1]}>
        <mesh position={[0, 0.1, -0.08]}>
          <boxGeometry args={[0.34, 0.32, 0.14]} />
          <meshStandardMaterial color="#5a2e12" roughness={0.5} />
        </mesh>
      </Part>

      {/* 4. Back / Ground glass */}
      <Part id="back" dir={[0, 0, -0.15]} view={[0, 0.2, -1]}>
        <mesh position={[0, 0.1, -0.16]}>
          <boxGeometry args={[0.26, 0.24, 0.02]} />
          <meshStandardMaterial color="#e8eff5" roughness={0.4} transparent opacity={0.8} />
        </mesh>
      </Part>

      {/* 5. Tripod */}
      <Part id="tripod" dir={[0, -0.3, 0]} view={[0.4, -0.5, 0.9]}>
        <mesh position={[-0.14, -0.35, 0.1]} rotation={[0.2, 0, 0.25]}>
          <cylinderGeometry args={[0.02, 0.015, 0.7, 16]} />
          <meshStandardMaterial color="#3d2110" roughness={0.6} />
        </mesh>
        <mesh position={[0.14, -0.35, 0.1]} rotation={[0.2, 0, -0.25]}>
          <cylinderGeometry args={[0.02, 0.015, 0.7, 16]} />
          <meshStandardMaterial color="#3d2110" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.35, -0.18]} rotation={[-0.3, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.015, 0.7, 16]} />
          <meshStandardMaterial color="#3d2110" roughness={0.6} />
        </mesh>
      </Part>
    </group>
  )
}
