'use client'
import { Part } from '../partContext'

/** Classic hexagonal pencil lying along x: eraser, ferrule, wood, tip. */
export default function PencilModel() {
  return (
    <group rotation={[0.35, 0.35, 0.3]}>
      <Part id="eraser" dir={[-0.22, 0, 0]} view={[-1, 0.3, 0.7]}>
        <mesh position={[-0.522, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.048, 0.048, 0.07, 32]} />
          <meshStandardMaterial color="#f29bb0" roughness={0.9} />
        </mesh>
        <mesh position={[-0.557, 0, 0]} scale={[0.4, 1, 1]}>
          <sphereGeometry args={[0.048, 24, 16]} />
          <meshStandardMaterial color="#f29bb0" roughness={0.9} />
        </mesh>
      </Part>
      <Part id="ferrule" dir={[-0.11, 0, 0]} view={[-0.6, 0.4, 1]}>
        <mesh position={[-0.445, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.053, 0.053, 0.09, 32]} />
          <meshStandardMaterial color="#c3c7cd" metalness={0.85} roughness={0.3} />
        </mesh>
        {[-0.425, -0.465].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.053, 0.005, 8, 32]} />
            <meshStandardMaterial color="#a9aeb5" metalness={0.85} roughness={0.3} />
          </mesh>
        ))}
      </Part>
      <Part id="wood" view={[0, 0.4, 1]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.8, 6]} />
          <meshStandardMaterial color="#f6c33b" roughness={0.55} flatShading />
        </mesh>
      </Part>
      <Part id="tip" dir={[0.2, 0, 0]} view={[1, 0.3, 0.7]}>
        <mesh position={[0.465, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <cylinderGeometry args={[0.016, 0.05, 0.13, 6]} />
          <meshStandardMaterial color="#e9c896" roughness={0.85} flatShading />
        </mesh>
        <mesh position={[0.555, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <cylinderGeometry args={[0.002, 0.016, 0.05, 24]} />
          <meshStandardMaterial color="#3b3b3f" metalness={0.3} roughness={0.4} />
        </mesh>
      </Part>
    </group>
  )
}
