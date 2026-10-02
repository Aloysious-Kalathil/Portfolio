import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Color, MathUtils, Matrix4, Plane, Raycaster, ShaderMaterial, Vector2, Vector3, Vector4 } from 'three'
import { useTheme } from '../../hooks/useTheme'
import { gsap } from '../../utils/gsapSetup'
import { setLiveColor } from '../../utils/liveColor'

const RIPPLES = 4
const SIZE = [26, 20]
const TILT = -0.72

const noise = /* glsl */ `
  // 2D simplex noise — Ashima Arts / Stefan Gustavson (MIT)
  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
`

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uHover;
  uniform float uScroll;
  uniform float uEnergy;
  uniform vec2 uMouse;
  uniform vec4 uRipples[${RIPPLES}]; // x, y, start time, strength

  varying vec2 vUv;
  varying float vGlow;
  varying float vHeight;
  varying float vDepth;

  ${noise}

  void main() {
    vec3 p = position;
    float t = uTime;

    // Slow drifting terrain; scrolling moves through it
    vec2 q = p.xy * 0.16 + vec2(0.0, uScroll * 0.35);
    float h = snoise(q + vec2(t * 0.03, -t * 0.05)) * 0.9 + snoise(q * 2.7 - t * 0.07) * 0.22;
    h *= 1.0 + uEnergy * 0.6;

    // The surface lifts toward the pointer
    float d = distance(p.xy, uMouse);
    float bump = exp(-d * d * 0.45) * uHover;
    h += bump * 1.2;
    float glow = bump;

    // Rings travelling out from each click / tap
    for (int i = 0; i < ${RIPPLES}; i++) {
      vec4 r = uRipples[i];
      float age = t - r.z;
      if (age < 0.0 || age > 4.0) continue;
      float front = distance(p.xy, r.xy) - age * 3.2;
      float w = exp(-front * front * 1.4) * exp(-age * 0.9) * r.w;
      h += sin(front * 3.0) * w * 0.5 + w * 0.4;
      glow += w;
    }

    p.z += h;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vUv = uv;
    vGlow = clamp(glow, 0.0, 1.0);
    vHeight = h;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uInk;
  uniform vec3 uAccent;
  uniform float uOpacity;
  uniform vec2 uGrid;

  varying vec2 vUv;
  varying float vGlow;
  varying float vHeight;
  varying float vDepth;

  void main() {
    // Anti-aliased grid lines, about 1.2px wide at any distance
    vec2 c = vUv * uGrid;
    vec2 g = abs(fract(c - 0.5) - 0.5) / fwidth(c);
    float line = 1.0 - min(min(g.x, g.y) / 1.2, 1.0);

    // (smoothstep needs edge0 < edge1, so fade-outs are written as 1 - x)
    float fade = (1.0 - smoothstep(8.0, 16.0, vDepth)) * smoothstep(1.0, 3.5, vDepth);
    fade *= smoothstep(0.0, 0.12, vUv.x) * (1.0 - smoothstep(0.88, 1.0, vUv.x));
    fade *= smoothstep(0.0, 0.1, vUv.y) * (1.0 - smoothstep(0.9, 1.0, vUv.y));

    float crest = smoothstep(-0.6, 0.9, vHeight);
    float alpha = line * (0.07 + 0.13 * crest + 0.55 * vGlow);
    vec3 color = mix(uInk, uAccent, smoothstep(0.05, 0.6, vGlow));

    gl_FragColor = vec4(color, alpha * fade * uOpacity);
    #include <colorspace_fragment>
  }
`

/** Pointer, touch and tap state, read every frame. Listens on window: the
 *  canvas sits behind the page and never receives events itself. */
function useInput() {
  const input = useRef({ ndc: new Vector2(0, -0.3), inside: false, touch: false, lastTouch: 0, taps: [] })

  useEffect(() => {
    const s = input.current
    const at = (x, y) => s.ndc.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1)
    const move = (e) => {
      at(e.clientX, e.clientY)
      s.touch = e.pointerType === 'touch'
      s.inside = true
      s.lastTouch = performance.now()
    }
    const down = (e) => {
      move(e)
      if (s.taps.length < RIPPLES) s.taps.push(s.ndc.clone())
    }
    // Pointer events stop once a touch turns into a scroll; touch events don't
    const touchMove = (e) => {
      const t = e.touches[0]
      if (!t) return
      at(t.clientX, t.clientY)
      s.touch = true
      s.lastTouch = performance.now()
    }
    const leave = (e) => {
      if (!e.relatedTarget) s.inside = false
    }

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down, { passive: true })
    window.addEventListener('touchmove', touchMove, { passive: true })
    document.addEventListener('pointerout', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('touchmove', touchMove)
      document.removeEventListener('pointerout', leave)
    }
  }, [])

  return input
}

function Terrain({ input, ink, theme, segments }) {
  const mesh = useRef(null)
  const ripple = useRef(0)
  const scroll = useRef({ y: window.scrollY, speed: 0 })

  // Built here rather than as <shaderMaterial uniforms>: R3F copies each
  // uniform into a new object, so later writes to number values would be lost
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uHover: { value: 0 },
          uScroll: { value: window.scrollY / window.innerHeight },
          uEnergy: { value: 0 },
          uMouse: { value: new Vector2(0, -2) },
          uRipples: { value: Array.from({ length: RIPPLES }, () => new Vector4(0, 0, -100, 0)) },
          uInk: { value: new Color() },
          uAccent: { value: new Color() },
          uOpacity: { value: 0 },
          uGrid: { value: new Vector2(SIZE[0] * 1.4, SIZE[1] * 1.4) },
        },
      }),
    [],
  )
  const { uniforms } = material
  useEffect(() => () => material.dispose(), [material])

  const pick = useMemo(() => {
    const ray = new Raycaster()
    const plane = new Plane(new Vector3(0, 0, 1), 0)
    const inverse = new Matrix4()
    const hit = new Vector3()
    // Screen point → the mesh's own (flat) coordinates
    return (ndc, camera) => {
      ray.setFromCamera(ndc, camera)
      ray.ray.applyMatrix4(inverse.copy(mesh.current.matrixWorld).invert())
      return ray.ray.intersectPlane(plane, hit)
    }
  }, [])

  useEffect(() => {
    uniforms.uInk.value.set(ink)
  }, [uniforms, ink])

  useEffect(() => {
    const tween = gsap.to(uniforms.uOpacity, { value: 1, duration: 2.4, delay: 0.2, ease: 'power2.out' })
    return () => tween.kill()
  }, [uniforms])

  useFrame((state, delta) => {
    const m = mesh.current
    const s = input.current
    const u = uniforms
    const dt = Math.min(delta, 0.1)
    u.uTime.value += dt
    setLiveColor(u.uAccent.value, theme)

    // Scroll: position moves the terrain, speed swells it
    const y = window.scrollY
    const viewports = y / window.innerHeight
    const speed = Math.abs(y - scroll.current.y) / window.innerHeight / Math.max(dt, 1e-3)
    scroll.current.y = y
    scroll.current.speed = MathUtils.damp(scroll.current.speed, Math.min(speed, 4), 4, dt)
    u.uEnergy.value = scroll.current.speed
    u.uScroll.value = MathUtils.damp(u.uScroll.value, viewports, 6, dt)
    m.rotation.x = MathUtils.damp(m.rotation.x, TILT - Math.min(viewports, 3) * 0.05, 4, dt)

    // Pointer: a mouse holds the bump while it's over the page; a finger's
    // bump settles back shortly after it lifts
    const active = s.touch ? performance.now() - s.lastTouch < 900 : s.inside
    u.uHover.value = MathUtils.damp(u.uHover.value, active ? 1 : 0, active ? 4 : 1.6, dt)
    const hit = pick(s.ndc, state.camera)
    if (hit) {
      u.uMouse.value.x = MathUtils.damp(u.uMouse.value.x, hit.x, 7, dt)
      u.uMouse.value.y = MathUtils.damp(u.uMouse.value.y, hit.y, 7, dt)
    }

    while (s.taps.length) {
      const tap = pick(s.taps.shift(), state.camera)
      if (!tap) continue
      u.uRipples.value[ripple.current].set(tap.x, tap.y, u.uTime.value, 1)
      ripple.current = (ripple.current + 1) % RIPPLES
    }

    // A little camera parallax toward the pointer
    state.camera.position.x = MathUtils.damp(state.camera.position.x, s.ndc.x * 0.35, 2, dt)
    state.camera.position.y = MathUtils.damp(state.camera.position.y, s.ndc.y * 0.2, 2, dt)
    state.camera.lookAt(0, 0, 0)
  })

  return (
    <mesh ref={mesh} rotation-x={TILT} position={[0, -0.6, -1]} frustumCulled={false}>
      <planeGeometry args={[SIZE[0], SIZE[1], segments[0], segments[1]]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

const cssColor = (name) => {
  const channels = getComputedStyle(document.documentElement).getPropertyValue(name).trim().split(/\s+/)
  return `rgb(${channels.join(',')})`
}

/**
 * Site-wide backdrop: a wire terrain that rises under the pointer or finger,
 * ripples out from clicks and taps, and drifts and swells as the page scrolls.
 */
export default function BackgroundMesh() {
  const input = useInput()
  const { theme } = useTheme()
  const ink = useMemo(() => cssColor('--fg'), [theme])
  const segments = useMemo(() => (window.matchMedia('(pointer: coarse)').matches ? [130, 100] : [208, 160]), [])

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 7], fov: 45, near: 0.1, far: 40 }}
      gl={{ antialias: false, alpha: true }}
      style={{ pointerEvents: 'none' }}
    >
      <Terrain input={input} ink={ink} theme={theme} segments={segments} />
    </Canvas>
  )
}
