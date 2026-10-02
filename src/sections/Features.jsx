import { useRef } from 'react'
import siteConfig from '../config/siteConfig'
import { gsap, useGSAP } from '../utils/gsapSetup'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useChromeTone } from '../hooks/useScroll'
import SplitTextReveal from '../components/animations/SplitTextReveal'
import { pad } from '../utils/formatDate'

const FACE = 'absolute inset-0 flex items-center gap-[4vw] overflow-hidden border-y border-current bg-accent px-margin [backface-visibility:hidden]'
const BIG = 'display whitespace-nowrap leading-none tracking-[-0.045em] text-[min(calc(var(--h)*0.6),7vw)]'

/** One service as a four-sided roller: title, description, tools, title. */
function Roller({ service, index }) {
  const face = (k) => ({ transform: `rotateX(${k * 90}deg) translateZ(calc(var(--h) / 2))` })
  return (
    <li className="[perspective:3200px]">
      <div data-roller className="relative h-[var(--h)] [transform-style:preserve-3d] will-change-transform">
        <div className={FACE} style={face(0)}>
          <span className="tabular w-[3ch] shrink-0 font-mono text-sm">{pad(index + 1)}</span>
          <span className={BIG}>{service.title}</span>
        </div>
        <div className={FACE} style={face(1)}>
          <span className="tabular w-[3ch] shrink-0 font-mono text-sm">{pad(index + 1)}</span>
          <span className="max-w-[62ch] text-[clamp(0.9375rem,1.7vw,1.625rem)] font-medium leading-[1.2] tracking-[-0.015em]">{service.body}</span>
        </div>
        <div className={FACE} style={face(2)}>
          <span className="tabular w-[3ch] shrink-0 font-mono text-sm">{pad(index + 1)}</span>
          <span className={`${BIG} [-webkit-text-stroke:1px_currentColor] [color:transparent]`}>{service.tags.join(' / ')}</span>
        </div>
        <div className={`${FACE} justify-end`} style={face(3)}>
          <span className={BIG}>{service.title}</span>
          <span className="tabular w-[3ch] shrink-0 text-right font-mono text-sm">{pad(index + 1)}</span>
        </div>
      </div>
    </li>
  )
}

/**
 * "What I do" on a full-accent field. Each service is a 3D roller that turns
 * through its four faces as the section scrolls past, each row a beat behind
 * the one above. With reduced motion it is a plain list.
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
        const offset = -i * 38
        gsap.fromTo(
          roller,
          { rotateX: offset - 70 },
          {
            rotateX: offset + 290,
            ease: 'none',
            scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
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

      {reduced ? (
        <ol className="frame border-t border-current">
          {services.map((service, i) => (
            <li key={service.title} className="grid grid-cols-[3rem_1fr] gap-x-4 border-b border-current py-8">
              <span className="tabular pt-2 font-mono text-sm">{pad(i + 1)}</span>
              <div>
                <h3 className="display text-display-sm">{service.title}</h3>
                <p className="mt-3 max-w-prose">{service.body}</p>
                <p className="mt-3 font-mono text-label uppercase">{service.tags.join(' / ')}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <>
          <ol className="sr-only">
            {services.map((service) => (
              <li key={service.title}>
                <h3>{service.title}</h3>
                <p>{service.body}</p>
                <p>{service.tags.join(', ')}</p>
              </li>
            ))}
          </ol>
          <ul aria-hidden="true" className="space-y-[calc(var(--h)*0.34)] [--h:clamp(84px,13vw,190px)]">
            {services.map((service, i) => (
              <Roller key={service.title} service={service} index={i} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
