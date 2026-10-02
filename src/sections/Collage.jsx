import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import projects from '../data/projects.json'
import { gsap } from '../utils/gsapSetup'
import { useFeatures } from '../hooks/useFeatures'
import Picture from '../components/ui/Picture'
import Parallax from '../components/animations/Parallax'
import SplitTextReveal from '../components/animations/SplitTextReveal'
import { pad } from '../utils/formatDate'

/** Where each picture lands (percent of the section), how wide it is, how
 *  fast it drifts on scroll and how far it leans toward the pointer. */
const SPOTS = [
  { left: 6, top: 4, width: 15, aspect: 'aspect-[4/5]', speed: 0.5, depth: 0.5 },
  { left: 40, top: 1, width: 12, aspect: 'aspect-square', speed: -0.3, depth: 1 },
  { left: 71, top: 9, width: 19, aspect: 'aspect-[16/10]', speed: 0.8, depth: 0.3 },
  { left: 24, top: 27, width: 18, aspect: 'aspect-[16/10]', speed: -0.6, depth: 0.8 },
  { left: 82, top: 38, width: 12, aspect: 'aspect-[4/5]', speed: 0.4, depth: 1 },
  { left: 3, top: 52, width: 13, aspect: 'aspect-square', speed: -0.4, depth: 0.7 },
  { left: 55, top: 58, width: 17, aspect: 'aspect-[4/5]', speed: 0.7, depth: 0.4 },
  { left: 30, top: 74, width: 14, aspect: 'aspect-square', speed: -0.5, depth: 0.9 },
  { left: 76, top: 78, width: 16, aspect: 'aspect-[16/10]', speed: 0.3, depth: 0.6 },
]

const images = projects
  .flatMap((p) => [{ src: p.cover, alt: p.coverAlt, project: p }, ...(p.gallery || []).map((g) => ({ ...g, project: p }))])
  // Interleave so neighbours come from different projects
  .sort((a, b) => (a.src.length % 3) - (b.src.length % 3) || a.project.id - b.project.id)
  .slice(0, SPOTS.length)

/**
 * A wall of project pictures scattered at different depths around a pinned
 * heading. Each drifts at its own speed on scroll and leans toward the
 * pointer; they stay dim until hovered so the heading keeps the foreground.
 */
export default function Collage() {
  const root = useRef(null)
  const { reduced, touch } = useFeatures()

  useEffect(() => {
    if (reduced || touch) return undefined
    const section = root.current
    const layers = Array.from(section.querySelectorAll('[data-depth]'), (el) => ({
      depth: Number(el.dataset.depth),
      x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3.out' }),
      y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power3.out' }),
    }))
    const onMove = (e) => {
      const dx = e.clientX / window.innerWidth - 0.5
      const dy = e.clientY / window.innerHeight - 0.5
      layers.forEach((l) => {
        l.x(-dx * 70 * l.depth)
        l.y(-dy * 50 * l.depth)
      })
    }
    section.addEventListener('pointermove', onMove, { passive: true })
    return () => section.removeEventListener('pointermove', onMove)
  }, [reduced, touch])

  return (
    <section ref={root} className="relative h-[190vh] overflow-x-clip" aria-labelledby="collage-heading">
      <div className="pointer-events-none sticky top-0 z-10 flex h-screen flex-col items-center justify-center px-margin text-center">
        <p className="label mb-6">Index ({pad(projects.length)})</p>
        <SplitTextReveal id="collage-heading" className="display text-display-lg">
          Everything else
        </SplitTextReveal>
        <Link to="/projects" className="pill pill-lg pointer-events-auto mt-10">
          Full list
        </Link>
      </div>

      <ul className="absolute inset-0">
        {images.map((image, i) => {
          const spot = SPOTS[i]
          return (
            <li
              key={image.src}
              data-depth={spot.depth}
              className={`absolute min-w-[104px] will-change-transform ${i % 3 === 2 ? 'hidden md:block' : ''}`}
              style={{ left: `${spot.left}%`, top: `${spot.top}%`, width: `${spot.width}%` }}
            >
              <Parallax speed={spot.speed}>
                <Link
                  to={`/projects/${image.project.slug}`}
                  aria-label={`${image.project.title} — ${image.alt}`}
                  data-cursor="view"
                  data-cursor-label="View"
                  className="block opacity-60 transition-opacity duration-600 hover:opacity-100 focus-visible:opacity-100"
                >
                  <Picture src={image.src} alt="" sizes="20vw" className={spot.aspect} />
                </Link>
              </Parallax>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
