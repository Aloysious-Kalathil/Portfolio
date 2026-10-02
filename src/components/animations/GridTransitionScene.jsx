import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { NoColorSpace, LinearFilter } from 'three'
import { gsap } from '../../utils/gsapSetup'

/**
 * The shader behind the grid → fullscreen transition.
 * A subdivided plane starts exactly over the clicked thumbnail (pixel units,
 * orthographic camera) and each vertex travels to fill the viewport with its
 * own delay — bottom-centre first — so the image peels up and outward. The
 * texture stays "object-fit: cover" the whole way by blending the cover UVs
 * of the start rect and of the viewport.
 */
const vertexShader = /* glsl */ `
  uniform float uProgress;
  uniform vec2 uViewport;
  uniform vec4 uRect; // x, y (top-left, px), width, height
  varying vec2 vUv;
  varying float vProgress;

  const float PI = 3.141592653589793;
  const float LATEST_START = 0.42;

  void main() {
    vUv = uv;

    vec2 startCenter = vec2(
      uRect.x + uRect.z * 0.5 - uViewport.x * 0.5,
      -(uRect.y + uRect.w * 0.5 - uViewport.y * 0.5)
    );
    vec2 startPos = startCenter + position.xy * uRect.zw;
    vec2 endPos = position.xy * uViewport;

    // Vertices near the bottom-centre of the image set off first
    float activation = clamp(distance(uv, vec2(0.5, 0.0)) / 1.118, 0.0, 1.0);
    float startAt = activation * LATEST_START;
    float p = smoothstep(startAt, startAt + (1.0 - LATEST_START), uProgress);

    vec2 pos = mix(startPos, endPos, p);
    // A soft bulge mid-flight, gone by the time the vertex lands
    float bulge = sin(p * PI);
    pos.x += (uv.x - 0.5) * bulge * uViewport.x * 0.06;
    pos.y += bulge * uViewport.y * 0.025;

    vProgress = p;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 0.0, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec2 uImage;
  uniform vec2 uViewport;
  uniform vec4 uRect;
  varying vec2 vUv;
  varying float vProgress;

  vec2 cover(vec2 uv, vec2 box, vec2 image) {
    float rb = box.x / box.y;
    float ri = image.x / image.y;
    vec2 scale = rb < ri ? vec2(rb / ri, 1.0) : vec2(1.0, ri / rb);
    return (uv - 0.5) * scale + 0.5;
  }

  void main() {
    vec2 uv = mix(cover(vUv, uRect.zw, uImage), cover(vUv, uViewport, uImage), vProgress);
    gl_FragColor = texture2D(uTexture, uv);
  }
`

function ExpandingPlane({ src, rect, duration, onComplete }) {
  const texture = useTexture(src)
  const size = useThree((s) => s.size)
  // Always drive the uniforms the committed material actually holds — a
  // memoised object can differ after Suspense/StrictMode re-renders.
  const material = useRef(null)

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uTexture: { value: texture },
      uImage: { value: [texture.image.width, texture.image.height] },
      uViewport: { value: [size.width, size.height] },
      uRect: { value: [rect.left, rect.top, rect.width, rect.height] },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [texture],
  )

  useEffect(() => {
    texture.colorSpace = NoColorSpace // Canvas is `flat linear`: pixels pass through untouched
    texture.minFilter = LinearFilter
    texture.generateMipmaps = false
    texture.needsUpdate = true
  }, [texture])

  useEffect(() => {
    if (material.current) material.current.uniforms.uViewport.value = [size.width, size.height]
  }, [size])

  useEffect(() => {
    const tween = gsap.to(material.current.uniforms.uProgress, { value: 1, duration, ease: 'power3.inOut', onComplete })
    return () => tween.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[1, 1, 48, 48]} />
      <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </mesh>
  )
}

export default function GridTransitionScene({ src, rect, duration = 1.25, onComplete }) {
  return (
    <Canvas
      orthographic
      flat
      linear
      dpr={[1, 2]}
      camera={{ position: [0, 0, 10], zoom: 1, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <ExpandingPlane src={src} rect={rect} duration={duration} onComplete={onComplete} />
    </Canvas>
  )
}
