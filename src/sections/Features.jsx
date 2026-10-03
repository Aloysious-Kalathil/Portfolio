import { useRef } from 'react'
import siteConfig from '../config/siteConfig'
import { gsap, useGSAP } from '../utils/gsapSetup'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useChromeTone } from '../hooks/useScroll'
import SplitTextReveal from '../components/animations/SplitTextReveal'
import { pad } from '../utils/formatDate'

const FACE =
  'absolute inset-0 flex items-center gap-[4vw] overflow-hidden border-y border-[rgb(var(--accent-contrast)/0.3)] bg-accent px-margin [backface-visibility:hidden]'
const BIG = 'display whitespace-nowrap leading-none tracking-[-0.045em] text-[min(calc(var(--h)*0.6),7vw)]'

/** Face k sits k quarter-turns back, so rolling forward reveals them in order. */
const face = (k) => ({ transform: `rotateX(${-k * 90}deg) translateZ(calc(var(--h) / 2))` })

/** One service as a roller: title, then description, then tools. The fourth
 *  side is left blank so the block stays solid while it turns. */
function Roller({ service, index }) {
  const number = <span className="tabular w-[3ch] shrink-0 font-mono text-sm">{pad(index + 1)}</span>
  return (
    <li className="[perspective:3200px]">
      <div data-roller className="relative h-[var(--h)] [transform-style:preserve-3d] will-change-transform">
        <div className={FACE} style={face(0)}>
          {number}
          <span className={BIG}>{service.title}</span>
        </div>
        <div className={FACE} style={face(1)}>
          {number}
          <span className="max-w-[62ch] text-[clamp(0.9375rem,1.5vw,1.4rem)] font-medium leading-[1.25] tracking-[-0.01em]">{service.body}</span>
        </div>
        <div className={FACE} style={face(2)}>
          {number}
          <span className={`${BIG} [-webkit-text-stroke:1px_currentColor] [color:transparent]`}>{service.tags.join(' / ')}</span>
        </div>
        <div className={FACE} style={face(3)} />
      </div>
    </li>
  )
}

/**
 * "What I do" on a full-accent field. On wider screens each service is a 3D
 * roller that turns from title to description to tools as the section
 * scrolls past, each row a beat behind the one above. Phones and reduced
 * motion get the plain list (which screen readers always read).
 */
export default function Features() {
  const root = useRef(null)
  const reduced = useReducedMotion()
  const { services } = siteConfig
  useChromeTone(root)

  useGSAP(
    () => {
      if (reduced) return
      gsap.utils.toArray('[data-roller]').forEach((roller, i) => {
        const offset = -i * 22
        gsap.fromTo(
          roller,
          { rotateX: offset - 45 },
          {
            rotateX: offset + 175,
            ease: 'none',
            scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
          },
        )
      })
    },
    { scope: root, dependencies: [reduced] },
  )

  if (!services?.length) return null

  return (
    <section
      ref={root}
      data-tone="accent"
      className="relative overflow-hidden bg-accent py-section text-[rgb(var(--accent-contrast))]"
      aria-labelledby="features-heading"
    >
      <div className="frame mb-[10vh] grid-layout items-end gap-y-6">
        <p className="col-span-4 font-mono text-label uppercase md:col-span-2">What I do</p>
        <SplitTextReveal id="features-heading" className="display col-span-4 text-display-lg md:col-span-6 lg:col-span-9">
          Four things, done properly.
        </SplitTextReveal>
      </div>

      <ol className={`frame border-t border-[rgb(var(--accent-contrast)/0.3)] ${reduced ? '' : 'md:sr-only'}`}>
        {services.map((service, i) => (
          <li key={service.title} className="grid grid-cols-[3rem_1fr] gap-x-4 border-b border-[rgb(var(--accent-contrast)/0.3)] py-8">
            <span className="tabular pt-2 font-mono text-sm">{pad(i + 1)}</span>
            <div>
              <h3 className="display text-display-sm">{service.title}</h3>
              <p className="mt-3 max-w-prose">{service.body}</p>
              <p className="mt-3 font-mono text-label uppercase">{service.tags.join(' / ')}</p>
            </div>
          </li>
        ))}
      </ol>
      {!reduced && (
        <ul aria-hidden="true" className="hidden space-y-[calc(var(--h)*0.34)] [--h:clamp(84px,13vw,190px)] md:block">
          {services.map((service, i) => (
            <Roller key={service.title} service={service} index={i} />
          ))}
        </ul>
      )}
    </section>
  )
}
