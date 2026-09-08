import { Canvas, useFrame } from '@react-three/fiber'
import {
  ContactShadows,
  Environment,
  Float,
  Lightformer,
  SoftShadows,
  Sparkles,
} from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const isMobile =
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
const isReduced =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ------------------------------ geometry profiles ------------------------------ */

const BALLOON_PROFILE = [
  [0.0, 0.62], [0.10, 0.60], [0.30, 0.48], [0.44, 0.30], [0.48, 0.10],
  [0.46, -0.12], [0.38, -0.32], [0.26, -0.44], [0.12, -0.50], [0.05, -0.52], [0.0, -0.52],
]

const FLUTE_PROFILE = [
  [0.0, 0.0], [0.11, 0.0], [0.11, 0.012], [0.05, 0.03], [0.028, 0.05],
  [0.016, 0.08], [0.015, 0.30], [0.05, 0.33], [0.06, 0.39], [0.028, 0.47], [0.026, 0.51], [0.0, 0.51],
]

const GOBLET_PROFILE = [
  [0.0, 0.0], [0.12, 0.0], [0.12, 0.012], [0.05, 0.03], [0.02, 0.05], [0.014, 0.14],
  [0.10, 0.17], [0.13, 0.27], [0.09, 0.37], [0.07, 0.39], [0.0, 0.39],
]

const DECANTER_PROFILE = [
  [0.0, 0.0], [0.16, 0.0], [0.16, 0.015], [0.09, 0.04], [0.07, 0.10], [0.15, 0.14],
  [0.20, 0.26], [0.21, 0.40], [0.14, 0.52], [0.07, 0.58], [0.045, 0.62], [0.035, 0.70], [0.028, 0.74], [0.0, 0.74],
]

const VASE_PROFILE = [
  [0.0, 0.0], [0.13, 0.0], [0.13, 0.015], [0.06, 0.035], [0.05, 0.28], [0.14, 0.31],
  [0.17, 0.46], [0.10, 0.62], [0.105, 0.66], [0.075, 0.69], [0.0, 0.69],
]

function useLathe(profile, segments = 48) {
  return useMemo(
    () => new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), segments),
    [profile, segments],
  )
}

function usePleatedSkirt(radiusTop, radiusBottom, height, pleats = 30, depth = 0.05) {
  return useMemo(() => {
    const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 64, 22, true)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const z = pos.getZ(i)
      const angle = Math.atan2(z, x)
      const wave = 1 + Math.sin(angle * pleats + y * 2.6) * depth
      pos.setXYZ(i, x * wave, y, z * wave)
    }
    geo.computeVertexNormals()
    return geo
  }, [radiusTop, radiusBottom, height, pleats, depth])
}

/* ------------------------------ materials ------------------------------ */

const glassProps = isMobile
  ? { transmission: 0, transparent: true, opacity: 0.35, roughness: 0.06, metalness: 0.1, ior: 1.5 }
  : { transmission: 1, thickness: 0.45, roughness: 0.03, metalness: 0, ior: 1.5, attenuationColor: '#ffffff', attenuationDistance: 2.5 }

const goldProps = { color: '#d4af37', metalness: 0.95, roughness: 0.18, envMapIntensity: 1.25 }
const silverProps = { color: '#cfd6e4', metalness: 0.9, roughness: 0.25, envMapIntensity: 1.1 }
const ivoryProps = { color: '#fdfaf3', metalness: 0, roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.35 }

/* ------------------------------ pieces ------------------------------ */

function Balloon({ position, color, scale = 1, ribbon = true }) {
  const geo = useLathe(BALLOON_PROFILE, 40)
  const ribbonGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.55, 0),
      new THREE.Vector3(0.05, -0.85, 0.02),
      new THREE.Vector3(-0.04, -1.05, -0.02),
      new THREE.Vector3(0.06, -1.3, 0.03),
      new THREE.Vector3(-0.02, -1.5, -0.03),
    ])
    return new THREE.TubeGeometry(curve, 40, 0.011, 8)
  }, [])
  return (
    <Float speed={1.4} rotationIntensity={0.25} floatIntensity={1.2}>
      <group position={position} scale={scale}>
        <mesh geometry={geo} castShadow>
          <meshPhysicalMaterial color={color} metalness={0} roughness={0.05} clearcoat={1} clearcoatRoughness={0.12} ior={1.45} envMapIntensity={1.5} />
        </mesh>
        <mesh position={[0, -0.56, 0]}>
          <coneGeometry args={[0.05, 0.1, 12]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
        {ribbon && (
          <mesh geometry={ribbonGeo}>
            <meshStandardMaterial color="#f5efe0" roughness={0.6} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
    </Float>
  )
}

function GiftBox({ position, color = '#14274d', scale = 1, rotationY = 0 }) {
  return (
    <Float speed={1.1} rotationIntensity={0.3} floatIntensity={0.8}>
      <group position={position} scale={scale} rotation={[0, rotationY, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshPhysicalMaterial color={color} roughness={0.85} clearcoat={0.25} clearcoatRoughness={0.5} />
        </mesh>
        <mesh>
          <boxGeometry args={[1.05, 0.16, 0.16]} />
          <meshPhysicalMaterial {...goldProps} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.16, 1.05, 0.16]} />
          <meshPhysicalMaterial {...goldProps} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.44, 0.44, 0.14, 32]} />
          <meshPhysicalMaterial {...goldProps} />
        </mesh>
      </group>
    </Float>
  )
}

function Flute({ position }) {
  const geo = useLathe(FLUTE_PROFILE, 36)
  return (
    <mesh geometry={geo} position={position} castShadow>
      <meshPhysicalMaterial {...glassProps} />
    </mesh>
  )
}

function Goblet({ position, scale = 1 }) {
  const geo = useLathe(GOBLET_PROFILE, 36)
  return (
    <mesh geometry={geo} position={position} scale={scale} castShadow>
      <meshPhysicalMaterial {...glassProps} />
    </mesh>
  )
}

function Decanter({ position }) {
  const geo = useLathe(DECANTER_PROFILE, 44)
  return (
    <mesh geometry={geo} position={position} castShadow>
      <meshPhysicalMaterial {...glassProps} />
    </mesh>
  )
}

function Centerpiece({ position }) {
  const vase = useLathe(VASE_PROFILE, 44)
  return (
    <group position={position}>
      <mesh geometry={vase} castShadow>
        <meshPhysicalMaterial {...glassProps} />
      </mesh>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i / 8) * Math.PI * 2
        const r = i % 2 === 0 ? 0.16 : 0.28
        return (
          <mesh key={i} position={[Math.cos(a) * r, 0.78 + (i % 3) * 0.05, Math.sin(a) * r]}>
            <sphereGeometry args={[0.075, 20, 20]} />
            <meshPhysicalMaterial color={i % 3 === 0 ? '#f0d47a' : '#fff8ee'} roughness={0.55} clearcoat={0.5} clearcoatRoughness={0.3} />
          </mesh>
        )
      })}
    </group>
  )
}

function ChiavariChair({ position, yaw }) {
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {/* seat */}
      <mesh position={[0, 0.47, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.46, 0.05, 0.46]} />
        <meshPhysicalMaterial {...ivoryProps} />
      </mesh>
      {/* legs */}
      {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.235, z]} castShadow>
          <cylinderGeometry args={[0.018, 0.028, 0.47, 12]} />
          <meshPhysicalMaterial {...goldProps} />
        </mesh>
      ))}
      {/* back side rails */}
      {[-0.2, 0.2].map((x) => (
        <mesh key={x} position={[x, 0.82, 0.22]} castShadow>
          <cylinderGeometry args={[0.02, 0.022, 0.72, 12]} />
          <meshPhysicalMaterial {...goldProps} />
        </mesh>
      ))}
      {/* top rail */}
      <mesh position={[0, 1.16, 0.22]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.42, 12]} />
        <meshPhysicalMaterial {...goldProps} />
      </mesh>
      {/* back slats */}
      {[-0.14, -0.045, 0.05, 0.145].map((x) => (
        <mesh key={x} position={[x, 0.83, 0.2]}>
          <boxGeometry args={[0.012, 0.6, 0.018]} />
          <meshPhysicalMaterial {...goldProps} />
        </mesh>
      ))}
      {/* stretchers */}
      <mesh position={[0, 0.16, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 0.4, 10]} />
        <meshPhysicalMaterial {...goldProps} />
      </mesh>
      <mesh position={[-0.2, 0.16, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.014, 0.014, 0.4, 10]} />
        <meshPhysicalMaterial {...goldProps} />
      </mesh>
      <mesh position={[0.2, 0.16, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.014, 0.014, 0.4, 10]} />
        <meshPhysicalMaterial {...goldProps} />
      </mesh>
    </group>
  )
}

function BanquetTable() {
  const skirt = usePleatedSkirt(1.56, 1.78, 1.05)
  const sway = useRef()
  useFrame((state) => {
    if (sway.current && !isReduced) {
      sway.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.06
    }
  })
  return (
    <group ref={sway} position={[0, 0, 0]}>
      {/* table top */}
      <mesh position={[0, 1.24, 0]} receiveShadow>
        <cylinderGeometry args={[1.6, 1.6, 0.07, 64]} />
        <meshPhysicalMaterial {...ivoryProps} />
      </mesh>
      {/* pleated floor-length skirt */}
      <mesh geometry={skirt} position={[0, 0.66, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#f8f4ec" metalness={0} roughness={0.72} />
      </mesh>
      {/* gold trim */}
      <mesh position={[0, 0.15, 0]}>
        <torusGeometry args={[1.79, 0.022, 12, 72]} />
        <meshPhysicalMaterial {...goldProps} />
      </mesh>
      {/* pedestal */}
      <mesh position={[0, 0.035, 0]} castShadow>
        <cylinderGeometry args={[0.52, 0.58, 0.07, 48]} />
        <meshPhysicalMaterial {...goldProps} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.86, 32]} />
        <meshPhysicalMaterial {...goldProps} />
      </mesh>
      <mesh position={[0, 0.97, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.06, 32]} />
        <meshPhysicalMaterial {...goldProps} />
      </mesh>
      <mesh position={[0, 1.13, 0]}>
        <cylinderGeometry args={[0.16, 0.62, 0.14, 48]} />
        <meshPhysicalMaterial {...goldProps} />
      </mesh>

      {/* crystal tableware */}
      <Centerpiece position={[0, 1.28, 0]} />
      <Goblet position={[-0.62, 1.28, -0.18]} />
      <Goblet position={[-0.42, 1.28, -0.42]} scale={0.92} />
      <Decanter position={[-0.85, 1.28, 0.5]} />
      {/* champagne tower */}
      <ChampagneTower position={[0.72, 1.28, 0.5]} />
    </group>
  )
}

function ChampagneTower({ position }) {
  const tiers = [4, 3, 2, 1]
  const spacing = 0.15
  const flutes = []
  let y = 0.02
  tiers.forEach((n) => {
    const start = -((n - 1) * spacing) / 2
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (n === 4 && ((i === 0 || i === 3) && (j === 0 || j === 3))) continue
        flutes.push([start + i * spacing, y + 0.225, start + j * spacing])
      }
    }
    y += 0.45
  })
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.05, 48]} />
        <meshPhysicalMaterial {...glassProps} />
      </mesh>
      {flutes.map(([x, fy, z], i) => (
        <Flute key={i} position={[x, fy, z]} />
      ))}
    </group>
  )
}

function Scene() {
  const group = useRef()
  useFrame((state) => {
    if (!group.current || isReduced) return
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, state.pointer.x * 0.22, 0.04)
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -state.pointer.y * 0.08, 0.04)
  })

  const chairs = [
    [2.15, 1.55], [-2.15, 1.55], [2.15, -1.55], [-2.15, -1.55],
  ].map(([x, z]) => ({ position: [x, 0, z], yaw: Math.atan2(x, z) + Math.PI }))

  return (
    <group ref={group}>
      <BanquetTable />
      {chairs.map((c, i) => (
        <ChiavariChair key={i} position={c.position} yaw={c.yaw} />
      ))}

      {/* realistic balloon cluster */}
      <Balloon position={[3.1, 2.7, 0.7]} color="#d4af37" scale={1.25} />
      <Balloon position={[3.7, 2.1, 0.1]} color="#ffffff" scale={1.05} />
      <Balloon position={[3.3, 3.7, -0.5]} color="#14274d" scale={0.95} />
      <Balloon position={[4.3, 1.6, 1.3]} color="#c23b3b" scale={0.85} />
      <Balloon position={[-4.1, 2.3, 0.2]} color="#14274d" scale={1.1} />
      <Balloon position={[-3.4, 3.2, -0.7]} color="#d4af37" scale={0.9} />

      <GiftBox position={[-4.6, 0.15, 1.7]} color="#14274d" scale={0.8} rotationY={0.4} />
      <GiftBox position={[-4.1, 0.1, 2.3]} color="#d4af37" scale={0.6} rotationY={-0.5} />

      {!isReduced && (
        <>
          <Sparkles count={isMobile ? 70 : 150} scale={[12, 8, 7]} size={2.4} speed={0.35} color="#f0d47a" opacity={0.75} />
          <Sparkles count={isMobile ? 30 : 60} scale={[12, 8, 7]} size={1.6} speed={0.25} color="#ffffff" opacity={0.6} />
        </>
      )}
    </group>
  )
}

export default function Hero3D() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.2, 9.4], fov: 42 }}
      dpr={isMobile ? [1, 1.25] : [1, 1.5]}
      frameloop={isReduced ? 'demand' : 'always'}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[6, 9, 5]}
        intensity={1.4}
        color="#fff2df"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-6, 4, -4]} intensity={0.55} color="#cfe0ff" />
      <pointLight position={[0, 4.6, 2]} intensity={isMobile ? 12 : 20} color="#f0d47a" />

      {!isMobile && <SoftShadows size={22} samples={14} focus={0.45} />}

      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3.2} position={[0, 5, -9]} scale={[11, 11, 1]} color="#fff3dd" />
        <Lightformer form="rect" intensity={1.6} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 1.6, 1]} color="#dbe7ff" />
        <Lightformer form="rect" intensity={1.2} position={[7, 0, 1]} rotation-y={-Math.PI / 2} scale={[5, 1, 1]} color="#ffffff" />
        <Lightformer form="circle" intensity={1.4} position={[0, 2.5, 4]} scale={3} color="#f6e7c1" />
      </Environment>

      <ContactShadows position={[0, 0.01, 0]} scale={9.5} far={2.6} blur={2.6} opacity={0.5} frames={1} color="#0a1428" />

      <Scene />
    </Canvas>
  )
}
