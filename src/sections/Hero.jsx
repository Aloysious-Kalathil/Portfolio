import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import siteConfig from '../config/siteConfig'
import { gsap, useGSAP } from '../utils/gsapSetup'
import { useFeatures } from '../hooks/useFeatures'
import { whenPageVisible } from '../hooks/useSiteReady'
import { scrollToElement } from '../hooks/useLenis'
import { liveColorCss } from '../utils/liveColor'
import SplitTextReveal from '../components/animations/SplitTextReveal'
import ScrambleText from '../components/animations/ScrambleText'

const ModelScene = lazy(() => import('../components/animations/ModelScene'))

const [firstName, ...rest] = siteConfig.name.split(' ')
const lastName = rest.join(' ')

const NAME_LINES = 'flex flex-col whitespace-nowrap md:flex-row md:gap-[0.2em]'

/**
 * Sizes the name so it runs edge to edge (one line on wide screens, two
 * stacked on phones) — unless that would push it below the fold on wide,
 * short screens, in which case the height left under the labels sets the
 * size instead.
 */
function useFitName(containerRef, measureRef) {
  useLayoutEffect(() => {
    const container = containerRef.current
    const measure = measureRef.current
    const nameBlock = container.closest('[data-hero-name]')
    const frame = nameBlock.parentElement
    const fit = () => {
      container.style.fontSize = '100px'
      const byWidth = (100 * container.clientWidth) / measure.offsetWidth

      // The labels sit centred in whatever height the name leaves them, so
      // budget for their natural height plus a little air
      const labels = frame.querySelector('[data-hero-labels]')
      const labelsBottom = labels.parentElement.offsetTop + labels.offsetHeight + 48
      const padBottom = parseFloat(getComputedStyle(frame).paddingBottom)
      const byHeight = (100 * (window.innerHeight - labelsBottom - padBottom)) / measure.offsetHeight

      container.style.fontSize = `${Math.floor(Math.min(byWidth * 0.985, byHeight) * 10) / 10}px`
    }
    fit()
    document.fonts?.ready.then(fit)
    const ro = new ResizeObserver(fit)
    ro.observe(frame)
    return () => ro.disconnect()
  }, [containerRef, measureRef])
}

// ── Coordinate markers ──────────────────────────────────────────────────────
const MARKER_STEP = 62 // px between rows
const MARKER_REACH = 280 // px: how far the pointer's influence carries
const COLUMNS = { wide: [1.2, 20.6, 38.4, 56, 71.6, 89.2], narrow: [4, 37, 70] }

/** Deterministic "is there a marker here": an irregular but stable rhythm. */
const hasMarker = (col, row) => ((col * 7 + row * 13 + ((col * row) % 5)) % 9) < 5

/**
 * A field of small markers on the column lines. Each one reads out its live
 * distance (px) to the pointer and warms to the live colour as it gets close;
 * with no pointer they show their page position instead.
 */
function Markers({ animate }) {
  const root = useRef(null)
  const [grid, setGrid] = useState({ columns: COLUMNS.wide, rows: 0 })

  useLayoutEffect(() => {
    const el = root.current
    const measure = () =>
      setGrid({
        columns: window.innerWidth < 768 ? COLUMNS.narrow : COLUMNS.wide,
        rows: Math.max(0, Math.floor((el.clientHeight - 140) / MARKER_STEP)),
      })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = root.current
    const items = Array.from(el.querySelectorAll('[data-marker]'), (node) => ({ node, value: node.lastElementChild, x: 0, y: 0 }))
    if (!items.length) return undefined

    // Positions are cached; a marker that would sit under a text block steps aside
    const place = () => {
      const top = el.getBoundingClientRect().top + window.scrollY
      const blocks = Array.from(el.parentElement.querySelectorAll('[data-avoid]'), (node) => node.getBoundingClientRect())
      items.forEach((m) => {
        m.x = m.node.offsetLeft
        m.y = top + m.node.offsetTop
        const r = m.node.getBoundingClientRect()
        const hit = blocks.some((b) => r.left < b.right + 8 && r.right > b.left - 8 && r.top < b.bottom + 6 && r.bottom > b.top - 6)
        m.node.style.visibility = hit ? 'hidden' : ''
      })
    }
    const pointer = { x: 0, y: 0, active: false }
    let dirty = true

    const draw = () => {
      if (!dirty) return
      dirty = false
      const scrollY = window.scrollY
      if (scrollY > el.clientHeight) return
      const color = pointer.active ? liveColorCss() : ''
      items.forEach((m) => {
        const screenY = m.y - scrollY
        if (!pointer.active) {
          m.value.textContent = String(Math.round(Math.abs(screenY)) % 1000).padStart(3, '0')
          m.node.style.opacity = ''
          m.node.style.color = ''
          return
        }
        const distance = Math.hypot(pointer.x - m.x, pointer.y - screenY)
        const near = Math.max(0, 1 - distance / MARKER_REACH)
        m.value.textContent = String(Math.min(999, Math.round(distance))).padStart(3, '0')
        m.node.style.opacity = (0.3 + near * 0.7).toFixed(2)
        m.node.style.color = near > 0.02 ? color : ''
      })
    }

    const onMove = (e) => {
      if (e.pointerType === 'touch') return
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.active = true
      dirty = true
    }
    const onLeave = () => {
      pointer.active = false
      dirty = true
    }
    const onScroll = () => (dirty = true)
    const onResize = () => {
      place()
      dirty = true
    }

    place()
    draw()
    document.fonts?.ready.then(place)
    if (!animate) return undefined
    dirty = true
    gsap.ticker.add(draw)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      gsap.ticker.remove(draw)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [grid, animate])

  return (
    <div ref={root} aria-hidden="true" className="pointer-events-none absolute inset-0">
      {grid.columns.map((left, col) =>
        Array.from({ length: grid.rows }, (_, row) =>
          hasMarker(col, row) ? (
            <span
              key={`${col}-${row}`}
              data-marker
              className="tabular absolute flex items-center gap-1.5 font-mono text-[11px] leading-none text-fg opacity-30 transition-colors duration-400"
              style={{ left: `${left}%`, top: 120 + row * MARKER_STEP }}
            >
              <span>+</span>
              <span>000</span>
            </span>
          ) : null,
        ),
      )}
    </div>
  )
}

/** Two-line label whose second line steps in, in the accent colour. */
function Label({ lines, delay = 0, className = '' }) {
  return (
    <p data-avoid className={`text-[clamp(1rem,1.3vw,1.25rem)] font-medium leading-[1.2] tracking-[-0.01em] text-accent-ink ${className}`}>
      {lines.map((line, i) => (
        <ScrambleText key={line} delay={delay + i * 0.12} className={`block ${i % 2 ? 'pl-[2.2em]' : ''}`}>
          {line}
        </ScrambleText>
      ))}
    </p>
  )
}

export default function Hero() {
  const root = useRef(null)
  const nameBox = useRef(null)
  const measure = useRef(null)
  const fill = useRef(null)
  const { webgl, reduced, touch } = useFeatures()
  const spotlight = !reduced && !touch

  useFitName(nameBox, measure)

  // The 3D scene is the heaviest thing on the page: fetch it only once the
  // page is visible and the main thread is idle, so it never delays first paint
  const [loadScene, setLoadScene] = useState(false)
  useEffect(() => {
    if (!webgl) return undefined
    let cancelled = false
    let idleId
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 400))
    const cancelIdle = window.cancelIdleCallback || clearTimeout
    whenPageVisible().then(() => {
      if (!cancelled) idleId = idle(() => setLoadScene(true), { timeout: 1500 })
    })
    return () => {
      cancelled = true
      if (idleId) cancelIdle(idleId)
    }
  }, [webgl])

  // Spotlight: the outlined name fills in under the pointer
  useEffect(() => {
    if (!spotlight) return undefined
    const section = root.current
    const layer = fill.current
    const radius = { r: 0 }
    const setRadius = (r) =>
      gsap.to(radius, { r, duration: 0.9, ease: 'expo.out', overwrite: true, onUpdate: () => layer.style.setProperty('--r', `${radius.r}px`) })
    const onMove = (e) => {
      const rect = layer.getBoundingClientRect()
      layer.style.setProperty('--mx', `${e.clientX - rect.left}px`)
      layer.style.setProperty('--my', `${e.clientY - rect.top}px`)
    }
    const onEnter = () => setRadius(Math.max(180, window.innerWidth * 0.16))
    const onLeave = () => setRadius(0)
    section.addEventListener('pointermove', onMove, { passive: true })
    section.addEventListener('pointerenter', onEnter)
    section.addEventListener('pointerleave', onLeave)
    return () => {
      gsap.killTweensOf(radius)
      section.removeEventListener('pointermove', onMove)
      section.removeEventListener('pointerenter', onEnter)
      section.removeEventListener('pointerleave', onLeave)
    }
  }, [spotlight])

  useGSAP(
    () => {
      if (reduced) return
      // Leaving the hero: the name lags behind the scroll (parallax) and the
      // 3D piece recedes. Both start from rest at the top of the page.
      gsap.to('[data-hero-name]', {
        yPercent: 40,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
      if (!webgl) return
      gsap.to('[data-hero-model]', {
        autoAlpha: 0,
        scale: 0.85,
        yPercent: -12,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
    },
    { scope: root, dependencies: [reduced, webgl], revertOnUpdate: true },
  )

  const year = new Date().getFullYear()
  const availability = siteConfig.availability ? siteConfig.availability.match(/(\S+\s*){1,3}/g).map((s) => s.trim()) : []

  return (
    <section ref={root} className="relative flex min-h-[100svh] flex-col overflow-hidden" aria-labelledby="hero-name">
      <Markers animate={!reduced} />

      {webgl && (
        <div data-hero-model className="absolute right-[2%] top-[9%] h-[30%] w-[58%] md:right-[5%] md:top-[3%] md:h-[40%] md:w-[30%]">
          {loadScene && (
            <Suspense fallback={null}>
              <ModelScene className="h-full w-full" />
            </Suspense>
          )}
        </div>
      )}

      <div className="frame relative flex flex-1 flex-col pb-margin pt-[calc(var(--margin)+6.5rem)]">
        <div className="flex flex-1 items-center pb-10">
          <div data-hero-labels className="grid-layout w-full gap-y-10 md:gap-y-0">
            <SplitTextReveal
              as="p"
              data-avoid
              trigger="load"
              delay={0.35}
              className="col-span-3 text-lede text-balance md:col-span-4 md:row-start-1 lg:col-span-3"
            >
              {siteConfig.tagline}
            </SplitTextReveal>

            <Label
              lines={[siteConfig.title, `${siteConfig.location.city}, ${siteConfig.location.country}`]}
              delay={0.5}
              className="col-span-4 md:col-span-3 md:col-start-3 md:row-start-2 md:mt-[9vh] lg:col-start-3"
            />
            {availability.length > 0 && (
              <Label
                lines={availability}
                delay={0.7}
                className="col-span-4 md:col-span-3 md:col-start-6 md:row-start-3 md:mt-[5vh] lg:col-start-8"
              />
            )}
            <p data-avoid className="label col-span-2 md:col-start-1 md:row-start-3 md:self-end">
              Portfolio © {year}
            </p>
          </div>
        </div>

        <div data-hero-name className="will-change-transform">
          <h1 id="hero-name" className="relative">
            <span className="sr-only">
              {siteConfig.name}, {siteConfig.title}
            </span>
            <span ref={nameBox} aria-hidden="true" className="display relative block leading-[0.88] tracking-[-0.055em]">
              {/* invisible copy used to measure the name at a known size */}
              <span ref={measure} className={`pointer-events-none invisible absolute left-0 top-0 ${NAME_LINES}`}>
                <span>{firstName}</span>
                <span>{lastName}</span>
              </span>

              <span className={`${NAME_LINES} ${spotlight ? 'text-outline' : ''}`}>
                <SplitTextReveal as="span" type="chars" trigger="load" stagger={0.035} duration={1.3} className="block">
                  {firstName}
                </SplitTextReveal>
                <SplitTextReveal
                  as="span"
                  type="chars"
                  trigger="load"
                  delay={0.15}
                  stagger={0.035}
                  duration={1.3}
                  className="block self-end md:self-auto"
                >
                  {lastName}
                </SplitTextReveal>
              </span>

              {spotlight && (
                <span
                  ref={fill}
                  className={`pointer-events-none absolute inset-0 ${NAME_LINES}`}
                  style={{
                    WebkitMaskImage: 'radial-gradient(circle var(--r, 0px) at var(--mx, 50%) var(--my, 50%), #000 55%, transparent 100%)',
                    maskImage: 'radial-gradient(circle var(--r, 0px) at var(--mx, 50%) var(--my, 50%), #000 55%, transparent 100%)',
                  }}
                >
                  <span>{firstName}</span>
                  <span className="self-end md:self-auto">{lastName}</span>
                </span>
              )}
            </span>
          </h1>
        </div>
      </div>

      <button
        type="button"
        onClick={() => scrollToElement('#after-hero')}
        className="group absolute right-margin top-[58%] hidden text-left text-[clamp(1rem,1.3vw,1.25rem)] font-medium leading-[1.2] tracking-[-0.01em] text-accent-ink md:block"
      >
        <ScrambleText delay={0.9} hover className="block">
          Scroll
        </ScrambleText>
        <ScrambleText delay={1} hover className="block pl-[1.4em]">
          Down
        </ScrambleText>
      </button>
      <span id="after-hero" className="absolute bottom-0" aria-hidden="true" />
    </section>
  )
}
