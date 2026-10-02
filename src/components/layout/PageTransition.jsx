import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Route, Routes, useLocation } from 'react-router-dom'
import { gsap, ScrollTrigger, EASE } from '../../utils/gsapSetup'
import { routes, navItems, pageForPath } from '../../config/routes'
import { scrollToTop } from '../../hooks/useLenis'
import { beginPageTransition, endPageTransition } from '../../hooks/useSiteReady'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import siteConfig from '../../config/siteConfig'

/** Name shown on the overlay while it covers the screen. */
function labelFor(pathname) {
  if (pathname === '/') return 'Index'
  if (pathname.startsWith('/projects/')) return 'Project'
  return navItems.find((item) => item.to === pathname)?.label ?? '404'
}

/**
 * Route transitions without a routing library swap:
 *  1. the URL changes, but the OLD page stays rendered (displayLocation)
 *  2. the overlay wipes up over it while the old page drifts out, and the
 *     next page's code loads in parallel
 *  3. behind the overlay: swap pages, scroll to top, refresh ScrollTrigger
 *  4. the overlay wipes off the top and the new page rises in
 * Navigations can opt out with `state: { transition: 'none' }` (the WebGL
 * project grid runs its own).
 */
export default function PageTransition() {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const overlay = useRef(null)
  const label = useRef(null)
  const page = useRef(null)
  const firstRender = useRef(true)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return undefined
    }
    // Same page, different hash/query: no transition
    if (location.pathname === displayLocation.pathname) {
      setDisplayLocation(location)
      return undefined
    }

    let cancelled = false
    const next = pageForPath(location.pathname)
    const skip = !siteConfig.settings.features.pageTransitions || location.state?.transition === 'none'

    const swap = () => {
      flushSync(() => setDisplayLocation(location))
      scrollToTop()
      ScrollTrigger.refresh()
      document.getElementById('main')?.focus({ preventScroll: true })
    }

    if (skip) {
      // The initiator (e.g. the WebGL grid) already covered the screen and
      // will call endPageTransition() when it has faded out.
      beginPageTransition()
      Promise.resolve(next.load()).then(() => !cancelled && swap())
      return () => {
        cancelled = true
      }
    }

    beginPageTransition()
    label.current.textContent = labelFor(location.pathname)
    const tl = gsap.timeline()

    if (reduced) {
      tl.set(overlay.current, { clipPath: 'inset(0% 0% 0% 0%)', autoAlpha: 0 }).to(overlay.current, {
        autoAlpha: 1,
        duration: 0.25,
        ease: 'power1.out',
      })
    } else {
      tl.set(overlay.current, { autoAlpha: 1, clipPath: 'inset(100% 0% 0% 0%)' })
        .to(overlay.current, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.85, ease: EASE.inOut })
        .to(page.current, { y: -window.innerHeight * 0.08, autoAlpha: 0.4, duration: 0.85, ease: EASE.inOut }, 0)
        .fromTo(label.current, { yPercent: 100 }, { yPercent: 0, duration: 0.7, ease: EASE.out }, 0.35)
    }

    Promise.all([tl.then(), Promise.resolve(next.load()).catch(() => {})]).then(() => {
      if (cancelled) return
      swap()
      const out = gsap.timeline({ onComplete: () => !cancelled && gsap.set(overlay.current, { autoAlpha: 0 }) })
      if (reduced) {
        out.set(page.current, { clearProps: 'all' }).call(endPageTransition).to(overlay.current, { autoAlpha: 0, duration: 0.3 })
        return
      }
      out
        .to(label.current, { yPercent: -100, duration: 0.5, ease: EASE.in })
        .to(overlay.current, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: EASE.inOut }, 0.15)
        .fromTo(
          page.current,
          { y: window.innerHeight * 0.1, autoAlpha: 1 },
          { y: 0, duration: 1.1, ease: EASE.out, clearProps: 'transform' },
          0.25,
        )
        .call(endPageTransition, null, 0.45)
    })

    return () => {
      cancelled = true
      tl.kill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

  // Keep ScrollTrigger positions honest as lazy images/fonts change layout
  useLayoutEffect(() => {
    let timer
    const refresh = () => {
      clearTimeout(timer)
      timer = setTimeout(() => ScrollTrigger.refresh(), 200)
    }
    const onLoad = (e) => e.target instanceof HTMLImageElement && refresh()
    document.addEventListener('load', onLoad, true)
    const ro = new ResizeObserver(refresh)
    ro.observe(page.current)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('load', onLoad, true)
      ro.disconnect()
    }
  }, [])

  return (
    <>
      <div ref={page}>
        {/* Keyed so every page (incl. project → project) mounts fresh */}
        <div key={displayLocation.pathname}>
          <Suspense fallback={<div className="min-h-[100svh]" aria-busy="true" />}>
            <Routes location={displayLocation}>
              {routes.map(({ path, component: Page }) => (
                <Route key={path} path={path} element={<Page />} />
              ))}
            </Routes>
          </Suspense>
        </div>
      </div>

      <div
        ref={overlay}
        aria-hidden="true"
        className="invisible fixed inset-0 z-transition flex items-end bg-fg text-bg"
      >
        <div className="frame overflow-hidden pb-margin">
          <span ref={label} className="display block text-display-lg">
            &nbsp;
          </span>
        </div>
      </div>
    </>
  )
}
