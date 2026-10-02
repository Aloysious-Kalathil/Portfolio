import { useRef } from 'react'
import { Link } from 'react-router-dom'
import siteConfig from '../config/siteConfig'
import { gsap, useGSAP } from '../utils/gsapSetup'
import { useReducedMotion } from '../hooks/useReducedMotion'

/** "plain *highlighted* plain" → [{ text, strong }] */
const parse = (text) =>
  text
    .split(/(\*[^*]+\*)/)
    .filter(Boolean)
    .map((part) => (part.startsWith('*') ? { text: part.slice(1, -1), strong: true } : { text: part, strong: false }))

/**
 * The about statement: one long paragraph in the accent colour with the key
 * phrases set in the display face. Words light up one by one as you scroll
 * through it. The copy (and its *highlights*) lives in siteConfig.manifesto.
 */
export default function Manifesto() {
  const root = useRef(null)
  const reduced = useReducedMotion()
  const parts = parse(siteConfig.manifesto)

  useGSAP(
    () => {
      if (reduced) return
      gsap.fromTo(
        '[data-word]',
        { opacity: 0.16 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.05,
          scrollTrigger: { trigger: root.current, start: 'top 78%', end: 'bottom 62%', scrub: 0.4 },
        },
      )
    },
    { scope: root, dependencies: [reduced] },
  )

  return (
    <section className="frame py-section" aria-labelledby="manifesto-label">
      <h2 id="manifesto-label" className="label mb-8">
        About
      </h2>
      <p
        ref={root}
        className="text-[clamp(1.25rem,2.25vw,2.25rem)] font-medium leading-[1.2] tracking-[-0.02em] text-accent-ink md:indent-[16.6%]"
      >
        {parts.map((part, i) =>
          part.text.split(/(\s+)/).map((word, j) =>
            word.trim() ? (
              <span
                key={`${i}-${j}`}
                data-word
                className={part.strong ? 'font-display font-extrabold tracking-[-0.035em] text-fg' : undefined}
              >
                {word}
              </span>
            ) : (
              word && ' '
            ),
          ),
        )}
      </p>
      <div className="mt-12 flex justify-end">
        <Link to="/about" className="pill pill-lg">
          More about me
        </Link>
      </div>
    </section>
  )
}
