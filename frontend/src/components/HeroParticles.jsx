import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const isMobile =
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
const isReduced =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function makeBokehTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.55)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function Bokeh({ count }) {
  const group = useRef()
  const texture = useMemo(() => makeBokehTexture(), [])
  const sprites = useMemo(() => {
    const colors = ['#f0d47a', '#ffffff', '#e6c35a', '#fdf6dd']
    return Array.from({ length: count }, (_, i) => ({
      position: [(Math.random() - 0.5) * 15, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 7],
      scale: 0.18 + Math.random() * 0.55,
      color: colors[i % colors.length],
      speed: 0.12 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
      opacity: 0.1 + Math.random() * 0.22,
    }))
  }, [count])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!group.current) return
    group.current.children.forEach((child, i) => {
      const s = sprites[i]
      child.position.y = s.position[1] + Math.sin(t * s.speed + s.phase) * 0.7
      child.position.x = s.position[0] + Math.cos(t * s.speed * 0.7 + s.phase) * 0.35
    })
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, state.pointer.x * 0.16, 0.04)
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -state.pointer.y * 0.09, 0.04)
  })

  return (
    <group ref={group}>
      {sprites.map((s, i) => (
        <sprite key={i} position={s.position} scale={[s.scale, s.scale, s.scale]}>
          <spriteMaterial
            map={texture}
            color={s.color}
            transparent
            opacity={s.opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
    </group>
  )
}

export default function HeroParticles() {
  if (isReduced) return null
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 45 }}
      dpr={isMobile ? [1, 1.25] : [1, 1.5]}
      gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Bokeh count={isMobile ? 20 : 44} />
    </Canvas>
  )
}
