import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Sparkles } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

function Balloon({ position, color, scale = 1 }) {
  return (
    <Float speed={1.6} rotationIntensity={0.4} floatIntensity={1.4}>
      <group position={position} scale={scale}>
        <mesh>
          <sphereGeometry args={[0.42, 32, 32]} />
          <meshStandardMaterial color={color} roughness={0.25} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.42, 0]}>
          <coneGeometry args={[0.07, 0.14, 12]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.62, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.55, 6]} />
          <meshStandardMaterial color="#ffffff" roughness={0.6} />
        </mesh>
      </group>
    </Float>
  )
}

function GiftBox({ position, color = '#d4af37', scale = 1 }) {
  return (
    <Float speed={1.2} rotationIntensity={0.5} floatIntensity={1.1}>
      <group position={position} scale={scale} rotation={[0, 0.5, 0]}>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={color} roughness={0.35} />
        </mesh>
        <mesh>
          <boxGeometry args={[1.06, 0.18, 0.18]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.18, 1.06, 0.18]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.16, 24]} />
          <meshStandardMaterial color="#14274d" roughness={0.3} />
        </mesh>
      </group>
    </Float>
  )
}

function PartyTable() {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.45
  })
  return (
    <group ref={ref} position={[0, -0.25, 0]}>
      {/* Table top */}
      <mesh position={[0, 1.02, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.09, 48]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      {/* Table cloth */}
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[1.56, 1.75, 0.72, 48]} />
        <meshStandardMaterial color="#14274d" roughness={0.35} />
      </mesh>
      {/* Gold trim */}
      <mesh position={[0, 0.24, 0]}>
        <torusGeometry args={[1.7, 0.03, 12, 48]} />
        <meshStandardMaterial color="#d4af37" roughness={0.2} metalness={0.6} />
      </mesh>
      {/* Leg */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 1.5, 16]} />
        <meshStandardMaterial color="#d4af37" roughness={0.25} metalness={0.6} />
      </mesh>
      {/* Vase with flowers */}
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.16, 0.22, 0.5, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.18, 1.75, Math.sin(a) * 0.18]}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshStandardMaterial color={['#d4af37', '#ffffff', '#e05a5a'][i % 3]} roughness={0.4} />
          </mesh>
        )
      })}
      {/* Chairs around the table */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + 0.4
        const r = 2.5
        return (
          <group key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} rotation={[0, -a + Math.PI / 2, 0]}>
            <mesh position={[0, 0.62, 0]}>
              <boxGeometry args={[0.6, 0.08, 0.6]} />
              <meshStandardMaterial color="#d4af37" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.34, 0]}>
              <boxGeometry args={[0.6, 0.5, 0.08]} />
              <meshStandardMaterial color="#14274d" roughness={0.35} />
            </mesh>
            {[[-0.27, 0, 0.27], [0.27, 0, 0.27], [-0.27, 0, -0.27], [0.27, 0, -0.27]].map((p, j) => (
              <mesh key={j} position={p}>
                <cylinderGeometry args={[0.03, 0.03, 0.75, 8]} />
                <meshStandardMaterial color="#d4af37" roughness={0.3} />
              </mesh>
            ))}
          </group>
        )
      })}
    </group>
  )
}

function Scene() {
  const group = useRef()
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        state.pointer.x * 0.35,
        0.04,
      )
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        -state.pointer.y * 0.12,
        0.04,
      )
    }
  })
  return (
    <group ref={group}>
      <PartyTable />
      <Balloon position={[3.2, 2.2, 0.5]} color="#d4af37" scale={1.15} />
      <Balloon position={[-3.4, 1.6, 0.8]} color="#ffffff" />
      <Balloon position={[2.6, 3.6, -1.2]} color="#14274d" scale={0.9} />
      <Balloon position={[-2.8, 3.2, -1.4]} color="#e05a5a" />
      <Balloon position={[0.4, 4.1, 1.4]} color="#d4af37" scale={0.85} />
      <Balloon position={[-0.9, 4.6, -2]} color="#ffffff" scale={0.75} />
      <GiftBox position={[3.6, 0.3, -1.6]} color="#d4af37" scale={0.85} />
      <GiftBox position={[-3.7, 0.2, -1.2]} color="#14274d" scale={0.7} />
      <GiftBox position={[4.1, 0.1, 1.6]} color="#e05a5a" scale={0.55} />
      <Sparkles count={140} scale={[11, 7, 6]} size={3.2} speed={0.45} color="#f0d47a" opacity={0.85} />
      <Sparkles count={60} scale={[11, 7, 6]} size={2} speed={0.3} color="#ffffff" opacity={0.7} />
    </group>
  )
}

export default function Hero3D() {
  return (
    <Canvas
      camera={{ position: [0, 1.1, 9.2], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 5]} intensity={1.6} color="#fff6e0" />
      <directionalLight position={[-6, 3, -4]} intensity={0.7} color="#cfe0ff" />
      <pointLight position={[0, 5, 3]} intensity={40} color="#f0d47a" />
      <Scene />
    </Canvas>
  )
}
