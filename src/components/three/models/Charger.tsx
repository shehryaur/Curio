'use client'
import { RoundedBox } from '@react-three/drei'
import { Part } from '../partContext'

/** USB-C wall charger: prongs, casing, usbc-port, led. */
export default function ChargerModel() {
  return (
    <group rotation={[0.18, 1.0, 0]}>
      <Part id="casing" view={[0.4, 0.4, 1]}>
        <RoundedBox args={[0.56, 0.56, 0.46]} radius={0.09} smoothness={5}>
          <meshStandardMaterial color="#f7f7f5" roughness={0.45} />
        </RoundedBox>
        <RoundedBox args={[0.566, 0.566, 0.012]} radius={0.005} smoothness={3} position={[0, 0, -0.13]}>
          <meshStandardMaterial color="#e2e2dd" roughness={0.5} />
        </RoundedBox>
      </Part>
      <Part id="prongs" dir={[0, 0, -0.3]} view={[-0.7, 0.35, -1]}>
        {[-0.09, 0.09].map((x) => (
          <group key={x}>
            <mesh position={[x, 0, -0.33]}>
              <boxGeometry args={[0.022, 0.11, 0.2]} />
              <meshStandardMaterial color="#c9ccd1" metalness={0.9} roughness={0.25} />
            </mesh>
            <mesh position={[x, 0, -0.395]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.018, 0.018, 0.024, 20]} />
              <meshStandardMaterial color="#8d9097" metalness={0.9} roughness={0.3} />
            </mesh>
            <RoundedBox args={[0.06, 0.15, 0.02]} radius={0.008} smoothness={2} position={[x, 0, -0.232]}>
              <meshStandardMaterial color="#e9e9e6" roughness={0.5} />
            </RoundedBox>
          </group>
        ))}
      </Part>
      <Part id="usbc-port" dir={[0, 0, 0.28]} view={[0.15, 0.05, 1]}>
        <RoundedBox args={[0.17, 0.062, 0.03]} radius={0.014} smoothness={3} position={[0, -0.06, 0.222]}>
          <meshStandardMaterial color="#1b1c1f" roughness={0.4} />
        </RoundedBox>
        <mesh position={[0, -0.06, 0.234]}>
          <boxGeometry args={[0.11, 0.016, 0.01]} />
          <meshStandardMaterial color="#6d7178" metalness={0.6} roughness={0.35} />
        </mesh>
      </Part>
      <Part id="led" dir={[0, 0.12, 0.25]} view={[0, 0.3, 1]}>
        <mesh position={[0, 0.14, 0.232]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.006, 32]} />
          <meshStandardMaterial color="#d9dbd6" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.14, 0.236]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.008, 32]} />
          <meshStandardMaterial color="#58cc02" emissive="#58cc02" emissiveIntensity={1.3} roughness={0.2} />
        </mesh>
      </Part>
    </group>
  )
}
