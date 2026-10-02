import siteConfig from '../config/siteConfig'
import { useReducedMotion } from './useReducedMotion'
import { useIsTouch } from './useIsTouch'

let webglSupport
/**
 * True only for hardware-accelerated WebGL. Software renderers (SwiftShader,
 * llvmpipe…) draw on the CPU and would stall the page, so they count as "no
 * WebGL" and get the plain fallbacks — as do Save-Data users and devices
 * reporting under 2 GB of memory.
 */
export function supportsWebGL() {
  if (webglSupport !== undefined) return webglSupport
  webglSupport = false
  try {
    if (navigator.connection?.saveData || (navigator.deviceMemory && navigator.deviceMemory < 2)) return webglSupport
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) return webglSupport
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ''
    webglSupport = !/swiftshader|llvmpipe|softpipe|software|microsoft basic render/i.test(renderer)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webglSupport = false
  }
  return webglSupport
}

/**
 * The effective feature switches: what siteConfig asks for, minus what this
 * visitor's device or preferences rule out.
 */
export function useFeatures() {
  const reduced = useReducedMotion()
  const touch = useIsTouch()
  const f = siteConfig.settings.features
  const webgl = f.webgl && !reduced && supportsWebGL()
  return {
    reduced,
    touch,
    preloader: f.preloader,
    smoothScroll: f.smoothScroll && !reduced,
    cursor: f.cursor && !touch && !reduced,
    magnetic: f.magnetic && !touch && !reduced,
    webgl,
    backgroundMesh: webgl && f.backgroundMesh,
    pageTransitions: f.pageTransitions,
    layoutGrid: f.layoutGrid,
  }
}

export default useFeatures
