import { lazy, Suspense, useEffect, useState } from 'react'
import { useFeatures } from './hooks/useFeatures'
import { useSmoothScroll } from './hooks/useLenis'
import { markSiteReady, whenPageVisible } from './hooks/useSiteReady'
import Navbar, { ScrollProgress } from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Sidebar from './components/layout/Sidebar'
import Cursor from './components/layout/Cursor'
import Preloader, { shouldShowPreloader } from './components/layout/Preloader'
import PageTransition from './components/layout/PageTransition'
import { GridTransitionHost } from './components/animations/GridToFullscreen'

/** Faint 12-column guides behind everything — the grid the layout sits on. */
function LayoutGrid() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-grid">
      <div className="frame grid-layout h-full">
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className={`h-full border-x border-fg/[0.035] ${i >= 4 ? 'hidden md:block' : ''} ${i >= 8 ? 'md:hidden lg:block' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}

const BackgroundMesh = lazy(() => import('./components/animations/BackgroundMesh'))

/** The 3D backdrop loads once the page is visible and the main thread is
 *  idle, so three.js never competes with first paint. */
function Backdrop() {
  const [load, setLoad] = useState(false)
  useEffect(() => {
    let cancelled = false
    let idleId
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 400))
    const cancelIdle = window.cancelIdleCallback || clearTimeout
    whenPageVisible().then(() => {
      if (!cancelled) idleId = idle(() => setLoad(true), { timeout: 2000 })
    })
    return () => {
      cancelled = true
      if (idleId) cancelIdle(idleId)
    }
  }, [])
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      {load && (
        <Suspense fallback={null}>
          <BackgroundMesh />
        </Suspense>
      )}
    </div>
  )
}

export default function App() {
  const features = useFeatures()
  const showPreloader = shouldShowPreloader()

  useSmoothScroll(features.smoothScroll)

  useEffect(() => {
    if (!showPreloader) markSiteReady()
  }, [showPreloader])

  useEffect(() => {
    document.documentElement.classList.toggle('has-cursor', features.cursor)
  }, [features.cursor])

  return (
    <>
      <a
        href="#main"
        className="fixed left-margin top-3 z-modal -translate-y-24 bg-fg px-4 py-3 font-mono text-label uppercase text-bg transition-transform duration-400 ease-out-expo focus-visible:translate-y-0"
      >
        Skip to content
      </a>

      {features.backgroundMesh && <Backdrop />}
      {features.layoutGrid && <LayoutGrid />}
      <ScrollProgress />
      <Navbar />
      <Sidebar />

      <main id="main" tabIndex={-1} className="relative z-[2] outline-none">
        <PageTransition />
      </main>

      <Footer />

      <GridTransitionHost />
      {features.cursor && <Cursor />}
      {showPreloader && <Preloader />}
    </>
  )
}
