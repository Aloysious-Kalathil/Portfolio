import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Center, Environment, Lightformer, MeshDistortMaterial } from '@react-three/drei'
import { MathUtils } from 'three'
import siteConfig from '../../config/siteConfig'
import { useTheme } from '../../hooks/useTheme'
import { gsap } from '../../utils/gsapSetup'
import { setLiveColor } from '../../utils/liveColor'

const { model } = siteConfig.settings

/** Vite serves index.html for missing files, so a 200 alone proves nothing:
 *  the file exists only if it isn't HTML. */
async function modelExists(src) {
  try {
    const res = await fetch(src, { method: 'HEAD' })
    const type = res.headers.get('content-type') || ''
    return res.ok && !type.includes('text/html')
  } catch {
    return false
  }
}

/** Turns the group toward the pointer with damped easing. */
function useMouseFollow(ref, strength = 0.4) {
  useFrame((state, delta) => {
    const g = ref.current
    if (!g) return
    g.rotation.y = MathUtils.damp(g.rotation.y, state.pointer.x * strength, 3.2, delta)
    g.rotation.x = MathUtils.damp(g.rotation.x, -state.pointer.y * strength * 0.6, 3.2, delta)
  })
}

function UserModel({ src }) {
  const { scene } = useGLTF(src)
  const group = useRef(null)
  useMouseFollow(group, 0.5)
  useFrame((_, delta) => {
    if (group.current) group.current.children[0].rotation.y += delta * 0.12
  })
  return (
    <group ref={group}>
      <Center scale={model.scale}>
        <primitive object={scene} />
      </Center>
    </group>
  )
}

/** Pointer position relative to the scene (−1…1 across it, beyond when
 *  outside), how fast it's moving, and click pulses. Read from window so the
 *  page text on top of the canvas doesn't block it. */
function usePagePointer(wrapper) {
  const pointer = useRef({ x: 0, y: 0, speed: 0, pulses: 0 })
  useEffect(() => {
    const p = pointer.current
    let last = null
    const move = (e) => {
      const rect = wrapper.current?.getBoundingClientRect()
      if (!rect?.width) return
      p.x = MathUtils.clamp(((e.clientX - rect.left) / rect.width) * 2 - 1, -1.6, 1.6)
      p.y = MathUtils.clamp(-(((e.clientY - rect.top) / rect.height) * 2 - 1), -1.6, 1.6)
      if (last) p.speed = Math.min(p.speed + Math.hypot(e.clientX - last.x, e.clientY - last.y) / window.innerWidth, 1.5)
      last = { x: e.clientX, y: e.clientY }
    }
    const down = () => {
      p.pulses += 1
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down, { passive: true })
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
    }
  }, [wrapper])
  return pointer
}

/**
 * Placeholder sculpture: a liquid-chrome blob. It wobbles harder the faster
 * the pointer moves, leans and drifts toward it, pulses on each click, and is
 * lit by a light in the live colour (utils/liveColor.js). Replace it by
 * dropping public/models/avatar.glb in place.
 */
function Blob({ ink, theme, pointer }) {
  const group = useRef(null)
  const mesh = useRef(null)
  const material = useRef(null)
  const light = useRef(null)
  const pulse = useRef({ v: 0, seen: 0 })

  useFrame((_, delta) => {
    const p = pointer.current
    const dt = Math.min(delta, 0.1)
    const g = group.current

    if (p.pulses !== pulse.current.seen) {
      pulse.current.seen = p.pulses
      gsap.fromTo(pulse.current, { v: 1 }, { v: 0, duration: 1.4, ease: 'expo.out', overwrite: true })
    }
    p.speed = MathUtils.damp(p.speed, 0, 2.2, dt)

    g.rotation.y = MathUtils.damp(g.rotation.y, p.x * 0.6, 3, dt)
    g.rotation.x = MathUtils.damp(g.rotation.x, -p.y * 0.4, 3, dt)
    g.position.x = MathUtils.damp(g.position.x, MathUtils.clamp(p.x, -1, 1) * 0.25, 2, dt)
    g.position.y = MathUtils.damp(g.position.y, MathUtils.clamp(p.y, -1, 1) * 0.2, 2, dt)
    mesh.current.rotation.z += dt * 0.12
    mesh.current.scale.setScalar(1 + pulse.current.v * 0.1)

    const target = 0.3 + Math.min(p.speed, 1) * 0.28 + pulse.current.v * 0.35
    material.current.distort = MathUtils.damp(material.current.distort, target, 4, dt)

    setLiveColor(light.current.color, theme)
    light.current.position.set(p.x * 2.4, p.y * 1.8, 2.6)
  })

  return (
    <group ref={group}>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[0.98, 48]} />
        <MeshDistortMaterial ref={material} color={ink} metalness={0.85} roughness={0.12} distort={0.3} speed={1.6} />
      </mesh>
      <pointLight ref={light} intensity={28} distance={9} />
    </group>
  )
}

/** Local light rig — no HDR download, so the scene stays light. */
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} />
      <Environment resolution={128} frames={1} environmentIntensity={1.7}>
        <Lightformer form="rect" intensity={3} position={[0, 3, 4]} scale={[6, 1.5, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[-4, 0, 2]} rotation-y={Math.PI / 2} scale={[4, 6, 1]} />
        <Lightformer form="ring" intensity={1.5} position={[4, -1, -2]} scale={2.5} />
      </Environment>
    </>
  )
}

export default function ModelScene({ className = '' }) {
  const wrapper = useRef(null)
  const [hasModel, setHasModel] = useState(null)
  const [inView, setInView] = useState(true)
  const { theme } = useTheme()
  // Near-black chrome reflects almost nothing, so the light theme gets silver
  const ink = theme === 'dark' ? '#E8EAF2' : '#AEB4C4'
  const pointer = usePagePointer(wrapper)

  useEffect(() => {
    let alive = true
    modelExists(model.src).then((exists) => alive && setHasModel(exists))
    return () => {
      alive = false
    }
  }, [])

  // Stop rendering when the hero is off screen
  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: '100px' })
    io.observe(wrapper.current)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={wrapper} className={className} aria-hidden="true">
      {hasModel !== null && (
        <Canvas
          dpr={[1, 1.75]}
          frameloop={inView ? 'always' : 'never'}
          camera={{ position: [0, 0, 6], fov: 32 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => gsap.fromTo(gl.domElement, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 1.6, delay: 0.3, ease: 'expo.out' })}
        >
          <Lighting />
          <Suspense fallback={null}>
            {hasModel ? <UserModel src={model.src} /> : <Blob ink={ink} theme={theme} pointer={pointer} />}
          </Suspense>
        </Canvas>
      )}
    </div>
  )
}
