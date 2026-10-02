import { lazy, Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap, EASE } from '../../utils/gsapSetup'
import { useFeatures } from '../../hooks/useFeatures'
import { useScrollLock } from '../../hooks/useLenis'
import { endPageTransition } from '../../hooks/useSiteReady'
import { pictureUrl } from '../ui/Picture'

// ── Transition store ────────────────────────────────────────────────────────
// Lives outside the pages so the overlay survives the route change and
// only lifts once the project page's hero image is on screen.
let transition = null
let targetReady = false
const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn())
const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
const getTransition = () => transition

function startGridTransition(next) {
  if (transition) return
  targetReady = false
  transition = next
  emit()
}

/** Called by ProjectDetail once its full-bleed hero image has loaded. */
export function notifyGridTargetReady() {
  targetReady = true
  emit()
}

const loadScene = () => import('./GridTransitionScene.jsx')
const GridTransitionScene = lazy(loadScene)
export const preloadGridScene = () => loadScene()

// ── Overlay host (mounted once in App) ──────────────────────────────────────
function Overlay({ t }) {
  const navigate = useNavigate()
  const { webgl, reduced } = useFeatures()
  const root = useRef(null)
  const backdrop = useRef(null)
  const fallbackImg = useRef(null)
  const navigated = useRef(false)
  const [hasNavigated, setHasNavigated] = useState(false)
  const ready = useSyncExternalStore(subscribe, () => targetReady)

  useScrollLock(true)

  const goToProject = useCallback(() => {
    if (navigated.current) return
    navigated.current = true
    setHasNavigated(true)
    navigate(t.href, { state: { transition: 'none' } })
  }, [navigate, t.href])

  // Backdrop hides the rest of the grid while the image grows
  useEffect(() => {
    const tween = gsap.fromTo(backdrop.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: reduced ? 0.3 : 0.7, ease: 'power2.out' })
    return () => tween.kill()
  }, [reduced])

  // Non-WebGL paths: a plain image scales from the card to the viewport
  useEffect(() => {
    if (webgl && !reduced) return undefined
    const img = fallbackImg.current
    const tl = gsap.timeline({ onComplete: goToProject })
    if (reduced) tl.to({}, { duration: 0.3 })
    else
      tl.to(img, {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        duration: 1.1,
        ease: EASE.inOut,
      })
    return () => tl.kill()
  }, [webgl, reduced, goToProject])

  // Lift the overlay once the destination is ready (or give up waiting)
  useEffect(() => {
    if (!hasNavigated) return undefined
    let lifted = false
    const lift = () => {
      if (lifted) return
      lifted = true
      gsap.to(root.current, {
        autoAlpha: 0,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: () => {
          transition = null
          emit()
          endPageTransition()
        },
      })
    }
    if (ready) {
      const id = setTimeout(lift, 60)
      return () => clearTimeout(id)
    }
    const timeout = setTimeout(lift, 2500)
    return () => clearTimeout(timeout)
  }, [ready, hasNavigated])

  const { rect, src } = t
  const staticImage = (
    <img
      ref={fallbackImg}
      src={src}
      alt=""
      className="fixed object-cover"
      style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
    />
  )

  return (
    <div ref={root} className="fixed inset-0 z-transition" aria-hidden="true">
      <div ref={backdrop} className="absolute inset-0 bg-bg" />
      {webgl && !reduced ? (
        <Suspense fallback={staticImage}>
          <GridTransitionScene src={src} rect={rect} onComplete={goToProject} />
        </Suspense>
      ) : (
        !reduced && staticImage
      )}
    </div>
  )
}

export function GridTransitionHost() {
  const t = useSyncExternalStore(subscribe, getTransition, () => null)
  return t ? <Overlay key={t.href} t={t} /> : null
}

/**
 * Click handler for any project link that contains a `[data-card-media]`
 * element: expands that image to full screen, then routes to the project.
 * Modifier-clicks (new tab etc.) fall through to the normal link.
 */
export function openProject(event, project) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const media = event.currentTarget.querySelector('[data-card-media]')
  if (!media) return
  event.preventDefault()
  const r = media.getBoundingClientRect()
  startGridTransition({
    href: `/projects/${project.slug}`,
    src: pictureUrl(project.cover),
    rect: { top: r.top, left: r.left, width: r.width, height: r.height },
  })
}

/** Warm up the WebGL transition scene while the browser is idle. */
export function usePreloadGridScene() {
  const { webgl } = useFeatures()
  useEffect(() => {
    if (!webgl) return undefined
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 800))
    const cancel = window.cancelIdleCallback || clearTimeout
    const id = idle(() => preloadGridScene())
    return () => cancel(id)
  }, [webgl])
}
