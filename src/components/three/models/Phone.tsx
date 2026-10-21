'use client'
import { useEffect, useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { Part } from '../partContext'

/** Friendly home-screen wallpaper drawn on a canvas (no network, no fonts). */
function makeScreenTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 512
  const g = c.getContext('2d')
  if (!g) return null
  const grad = g.createLinearGradient(0, 0, 256, 512)
  grad.addColorStop(0, '#c8f0a8')
  grad.addColorStop(0.55, '#8fd7f2')
  grad.addColorStop(1, '#5aa9e6')
  g.fillStyle = grad
  g.fillRect(0, 0, 256, 512)
  // clock bar
  g.fillStyle = 'rgba(255,255,255,0.85)'
  g.fillRect(78, 70, 100, 26)
  const colors = ['#58cc02', '#ff9600', '#1cb0f6', '#ff4b4b', '#ffffff', '#ce82ff', '#ffc800', '#2b70c9']
  for (let r = 0; r < 4; r++) {
    for (let col = 0; col < 4; col++) {
      g.fillStyle = colors[(r * 4 + col) % colors.length]
      const x = 26 + col * 56
      const y = 150 + r * 66
      g.beginPath()
      g.roundRect(x, y, 40, 40, 10)
      g.fill()
    }
  }
  // dock
  g.fillStyle = 'rgba(255,255,255,0.4)'
  g.beginPath()
  g.roundRect(16, 430, 224, 60, 18)
  g.fill()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Smartphone: screen, camera, side-button, charging-port, battery (visible through a tinted back). */
export default function PhoneModel() {
  const tex = useMemo(makeScreenTexture, [])
  useEffect(() => () => tex?.dispose(), [tex])
  const grille = [-0.12, -0.105, -0.09, 0.09, 0.105, 0.12]

  return (
    <group rotation={[0.05, -0.38, 0]}>
      {/* mid frame (not a part) */}
      <RoundedBox args={[0.5, 1.0, 0.045]} radius={0.05} smoothness={4} position={[0, 0, 0.0075]}>
        <meshStandardMaterial color="#3a3d44" metalness={0.6} roughness={0.35} />
      </RoundedBox>
      {grille.map((x) => (
        <mesh key={x} position={[x, -0.5, 0.0075]}>
          <sphereGeometry args={[0.005, 8, 8]} />
          <meshStandardMaterial color="#0b0c0e" />
        </mesh>
      ))}
      {/* tinted, slightly translucent back cover (not a part, not interactive) */}
      <RoundedBox args={[0.5, 1.0, 0.018]} radius={0.008} smoothness={3} position={[0, 0, -0.024]} renderOrder={2}>
        <meshStandardMaterial color="#b9c7d6" transparent opacity={0.32} roughness={0.15} depthWrite={false} />
      </RoundedBox>

      <Part id="screen" dir={[0, 0, 0.22]} view={[0, 0.1, 1]}>
        <RoundedBox args={[0.49, 0.99, 0.006]} radius={0.0029} smoothness={2} position={[0, 0, 0.031]}>
          <meshStandardMaterial color="#0d0f12" roughness={0.12} />
        </RoundedBox>
        <mesh position={[0, 0, 0.0345]}>
          <planeGeometry args={[0.45, 0.94]} />
          <meshStandardMaterial
            map={tex ?? undefined}
            emissiveMap={tex ?? undefined}
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.55}
            roughness={0.2}
          />
        </mesh>
      </Part>

      <Part id="camera" dir={[0, 0.2, -0.05]} view={[-0.25, 0.35, -1]}>
        {/* front camera pill */}
        <RoundedBox args={[0.11, 0.028, 0.002]} radius={0.0009} smoothness={2} position={[0, 0.44, 0.0352]}>
          <meshStandardMaterial color="#000000" roughness={0.2} />
        </RoundedBox>
        {/* rear camera bump */}
        <RoundedBox args={[0.17, 0.17, 0.012]} radius={0.005} smoothness={3} position={[-0.13, 0.37, -0.038]}>
          <meshStandardMaterial color="#2a2d33" roughness={0.25} metalness={0.3} />
        </RoundedBox>
        {(
          [
            [-0.17, 0.41],
            [-0.17, 0.33],
            [-0.09, 0.37],
          ] as const
        ).map(([x, y]) => (
          <group key={`${x}${y}`} position={[x, y, -0.046]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh>
              <cylinderGeometry args={[0.03, 0.03, 0.008, 32]} />
              <meshStandardMaterial color="#9aa0a8" metalness={0.85} roughness={0.25} />
            </mesh>
            <mesh position={[0, -0.003, 0]}>
              <cylinderGeometry args={[0.021, 0.021, 0.006, 32]} />
              <meshStandardMaterial color="#05070a" roughness={0.05} metalness={0.2} />
            </mesh>
          </group>
        ))}
        <mesh position={[-0.09, 0.425, -0.045]}>
          <sphereGeometry args={[0.009, 12, 12]} />
          <meshStandardMaterial color="#fff6d8" emissive="#fff3c4" emissiveIntensity={0.2} />
        </mesh>
      </Part>

      <Part id="side-button" dir={[0.2, 0, 0]} view={[1, 0.1, 0.35]}>
        <RoundedBox args={[0.014, 0.13, 0.018]} radius={0.006} smoothness={2} position={[0.252, 0.2, 0.0075]}>
          <meshStandardMaterial color="#6b707a" metalness={0.75} roughness={0.3} />
        </RoundedBox>
      </Part>

      <Part id="charging-port" dir={[0, -0.2, 0]} view={[0, -0.75, 0.7]}>
        <RoundedBox args={[0.085, 0.014, 0.022]} radius={0.0065} smoothness={2} position={[0, -0.4985, 0.0075]}>
          <meshStandardMaterial color="#0a0a0a" roughness={0.4} />
        </RoundedBox>
      </Part>

      <Part id="battery" dir={[0, 0, -0.32]} view={[0.1, 0.15, -1]}>
        <RoundedBox args={[0.36, 0.56, 0.012]} radius={0.004} smoothness={2} position={[0, -0.06, -0.024]}>
          <meshStandardMaterial color="#2c3138" roughness={0.5} metalness={0.2} />
        </RoundedBox>
        <mesh position={[0, -0.04, -0.0305]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.28, 0.2]} />
          <meshStandardMaterial color="#f5a524" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.04, -0.031]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.18, 0.03]} />
          <meshStandardMaterial color="#ffffff" roughness={0.6} />
        </mesh>
        <RoundedBox args={[0.08, 0.03, 0.008]} radius={0.003} smoothness={2} position={[0, 0.235, -0.024]}>
          <meshStandardMaterial color="#b08d57" metalness={0.6} roughness={0.35} />
        </RoundedBox>
      </Part>
    </group>
  )
}
