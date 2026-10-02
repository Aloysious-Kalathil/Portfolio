import { useLocation } from 'react-router-dom'
import { gsap, useGSAP, EASE } from '../../utils/gsapSetup'
import { markSiteReady } from '../../hooks/useSiteReady'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { pageForPath } from '../../config/routes'
import siteConfig from '../../config/siteConfig'

const SESSION_KEY = 'preloaded'

// Decided once, by the inline script in index.html (first visit this session)
const firstVisit =
  typeof document !== 'undefined' && document.documentElement.classList.contains('is-preloading')

export const shouldShowPreloader = () => firstVisit && siteConfig.settings.features.preloader

const MIN_DURATION = 1.4 // seconds — long enough to read, short enough not to annoy

/** Resolve after `ms`, or when the promise settles, whichever comes first. */
const settleWithin = (promise, ms) =>
  Promise.race([Promise.resolve(promise).catch(() => {}), new Promise((r) => setTimeout(r, ms))])

function finish(boot) {
  document.documentElement.classList.remove('is-preloading')
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    // ignore
  }
  boot?.remove()
}

/**
 * First-visit preloader. Its markup is static HTML in index.html (#boot), so
 * it paints before any JavaScript arrives; this component only drives it.
 * The counter follows real work — fonts, the current route's code,
 * above-the-fold images, window load — then the screen splits open (top half
 * up, bottom half down) to reveal the site.
 */
export default function Preloader() {
  const { pathname } = useLocation()
  const reduced = useReducedMotion()

  useGSAP((context, contextSafe) => {
    const boot = document.getElementById('boot')
    if (!boot) {
      finish(null)
      markSiteReady()
      return undefined
    }
    const q = (sel) => boot.querySelector(sel)
    const count = q('[data-count]')
    const bar = q('[data-bar]')
    const counter = { value: 0 }
    const started = performance.now()
    let done = 0
    let finished = false
    let alive = true // StrictMode mounts twice in dev; ignore the discarded run

    const render = () => {
      count.textContent = String(Math.round(counter.value)).padStart(3, '0')
      gsap.set(bar, { scaleX: counter.value / 100 })
    }

    const exit = contextSafe(() => {
      const tl = gsap.timeline({ onComplete: () => finish(boot) })
      if (reduced) {
        tl.call(markSiteReady).to(boot, { autoAlpha: 0, duration: 0.4 })
        return
      }
      tl.to(q('[data-preloader-content]'), { yPercent: -40, autoAlpha: 0, duration: 0.6, ease: EASE.in })
        .call(markSiteReady, null, '+=0.05')
        .to(q('[data-panel="top"]'), { yPercent: -100, duration: 1.1, ease: EASE.inOut }, '<')
        .to(q('[data-panel="bottom"]'), { yPercent: 100, duration: 1.1, ease: EASE.inOut }, '<')
    })

    const advance = contextSafe((target) => {
      gsap.to(counter, {
        value: target,
        duration: reduced ? 0.2 : 0.9,
        ease: 'power2.out',
        overwrite: true,
        onUpdate: render,
        onComplete: () => {
          if (target === 100 && !finished) {
            finished = true
            const elapsed = (performance.now() - started) / 1000
            gsap.delayedCall(reduced ? 0 : Math.max(0, MIN_DURATION - elapsed), exit)
          }
        },
      })
    })

    const aboveFoldImages = () =>
      Promise.all(
        Array.from(document.querySelectorAll('main img'))
          .filter((img) => img.getBoundingClientRect().top < window.innerHeight && !img.complete)
          .map(
            (img) =>
              new Promise((r) => {
                img.addEventListener('load', r, { once: true })
                img.addEventListener('error', r, { once: true })
              }),
          ),
      )

    const tasks = [
      document.fonts?.ready,
      pageForPath(pathname).load?.(),
      new Promise((r) => (document.readyState === 'complete' ? r() : window.addEventListener('load', r, { once: true }))),
      // Images exist only after the route renders, so look a moment later
      new Promise((r) => setTimeout(r, 350)).then(aboveFoldImages),
    ]

    tasks.forEach((task) =>
      settleWithin(task, 6000).then(() => {
        if (!alive) return
        done += 1
        advance(Math.round((done / tasks.length) * 100))
      }),
    )

    return () => {
      alive = false
    }
  })

  return null
}
