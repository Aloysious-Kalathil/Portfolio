import { useRef } from 'react'
import { Link } from 'react-router-dom'
import projects from '../data/projects.json'
import { gsap, useGSAP } from '../utils/gsapSetup'
import { useReducedMotion } from '../hooks/useReducedMotion'
import Picture from '../components/ui/Picture'
import ScrambleText from '../components/animations/ScrambleText'
import { openProject, usePreloadGridScene } from '../components/animations/GridToFullscreen'
import { pad } from '../utils/formatDate'

const featured = projects.filter((p) => p.featured)
const list = featured.length ? featured : projects.slice(0, 3)

/** One project, one screen: the frame tilts up to full size as it arrives. */
function WorkFrame({ project, index }) {
  const root = useRef(null)
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      if (reduced) return
      gsap.fromTo(
        '[data-frame]',
        { scale: 0.68, rotate: index % 2 ? 4 : -4 },
        {
          scale: 1,
          rotate: 0,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'center center', scrub: true },
        },
      )
    },
    { scope: root, dependencies: [reduced] },
  )

  return (
    <article ref={root} className="frame flex min-h-[100svh] flex-col justify-center py-[8vh]">
      <Link
        to={`/projects/${project.slug}`}
        onClick={(event) => openProject(event, project)}
        data-cursor="view"
        data-cursor-label="Open"
        className="group mx-auto block w-full focus-visible:outline-offset-8 md:w-[68%]"
      >
        <div data-frame className="will-change-transform">
          <p className="mb-3 flex items-baseline justify-between gap-6 text-[clamp(1rem,1.3vw,1.25rem)] font-medium text-accent-ink">
            <span className="tabular"># {pad(index + 1, 3)}</span>
            <span>
              {project.category}, {project.year}
            </span>
          </p>
          <div data-card-media className="zoom-media relative aspect-[16/10]">
            <Picture src={project.cover} alt={project.coverAlt || ''} sizes="(min-width:768px) 68vw, 100vw" className="h-full w-full" />
            {project.placeholder && (
              <span className="absolute left-3 top-3 bg-bg/90 px-2 py-1 font-mono text-label uppercase text-muted">Sample</span>
            )}
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_22rem] md:items-start md:gap-10">
          <h3 className="display text-display-md">
            <ScrambleText trigger="scroll" hover>
              {project.title}
            </ScrambleText>
          </h3>
          <p className="text-muted md:pt-2">{project.summary}</p>
        </div>
      </Link>
    </article>
  )
}

/** Selected work: the featured projects, one full-height frame each. */
export default function Work() {
  usePreloadGridScene()
  return (
    <section aria-labelledby="work-label">
      <div className="frame flex items-baseline justify-between">
        <h2 id="work-label" className="label">
          Selected work
        </h2>
        <p className="label tabular">
          {pad(list.length)} / {pad(projects.length)}
        </p>
      </div>
      {list.map((project, i) => (
        <WorkFrame key={project.slug} project={project} index={i} />
      ))}
    </section>
  )
}
