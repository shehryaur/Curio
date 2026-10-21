'use client'
import { RoundedBox } from '@react-three/drei'
import { Part } from '../partContext'

const COVER = '#2e7d5b'
const SPINE = '#24664a'
const GOLD = '#f2c14e'

/** Closed hardcover book standing up: cover, spine, pages, ribbon bookmark. */
export default function BookModel() {
  const lines = [-0.06, -0.035, -0.01, 0.015, 0.04, 0.062]
  return (
    <group rotation={[0.06, 0.5, 0]}>
      <Part id="cover" view={[0.2, 0.2, 1]}>
        <RoundedBox args={[0.72, 1.0, 0.022]} radius={0.008} smoothness={3} position={[0.005, 0, 0.089]}>
          <meshStandardMaterial color={COVER} roughness={0.7} />
        </RoundedBox>
        <RoundedBox args={[0.72, 1.0, 0.022]} radius={0.008} smoothness={3} position={[0.005, 0, -0.089]}>
          <meshStandardMaterial color={COVER} roughness={0.7} />
        </RoundedBox>
        <mesh position={[0.04, 0.22, 0.1005]}>
          <planeGeometry args={[0.42, 0.12]} />
          <meshStandardMaterial color={GOLD} roughness={0.5} />
        </mesh>
        <mesh position={[0.04, 0.1, 0.1005]}>
          <planeGeometry args={[0.3, 0.02]} />
          <meshStandardMaterial color={GOLD} roughness={0.5} />
        </mesh>
        <mesh position={[0.04, -0.28, 0.1005]}>
          <circleGeometry args={[0.07, 32]} />
          <meshStandardMaterial color="#f7e7b4" roughness={0.6} />
        </mesh>
      </Part>
      <Part id="spine" dir={[-0.28, 0, 0]} view={[-1, 0.2, 0.4]}>
        <RoundedBox args={[0.06, 1.0, 0.2]} radius={0.025} smoothness={4} position={[-0.345, 0, 0]}>
          <meshStandardMaterial color={SPINE} roughness={0.7} />
        </RoundedBox>
        {[0.38, 0.33, -0.38].map((y) => (
          <mesh key={y} position={[-0.376, y, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[0.16, 0.018]} />
            <meshStandardMaterial color={GOLD} roughness={0.5} />
          </mesh>
        ))}
      </Part>
      <Part id="pages" dir={[0.32, 0, 0]} view={[1, 0.25, 0.5]}>
        <mesh position={[0.02, 0, 0]}>
          <boxGeometry args={[0.66, 0.96, 0.156]} />
          <meshStandardMaterial color="#fbf3e0" roughness={0.9} />
        </mesh>
        {lines.map((z) => (
          <mesh key={z} position={[0.3515, 0, z]}>
            <boxGeometry args={[0.002, 0.95, 0.003]} />
            <meshStandardMaterial color="#e3d7bd" roughness={0.9} />
          </mesh>
        ))}
      </Part>
      <Part id="bookmark" dir={[0.3, -0.22, 0]} view={[0.3, -0.6, 1]}>
        <mesh position={[0.14, -0.585, 0.02]} rotation={[0, 0, 0.08]}>
          <boxGeometry args={[0.04, 0.2, 0.004]} />
          <meshStandardMaterial color="#e5484d" roughness={0.55} />
        </mesh>
        <mesh position={[0.148, -0.69, 0.02]} rotation={[0, 0, Math.PI / 4 + 0.08]}>
          <boxGeometry args={[0.028, 0.028, 0.004]} />
          <meshStandardMaterial color="#e5484d" roughness={0.55} />
        </mesh>
      </Part>
    </group>
  )
}
