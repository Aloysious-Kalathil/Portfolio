import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowUpRightIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline'
import { faGithub } from '@fortawesome/free-brands-svg-icons/faGithub'
import BrandIcon from '../components/ui/BrandIcon'
import projects from '../data/projects.json'
import { gsap, useGSAP } from '../utils/gsapSetup'
import { useReducedMotion } from '../hooks/useReducedMotion'
import Seo from '../components/ui/Seo'
import Picture from '../components/ui/Picture'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import SplitTextReveal from '../components/animations/SplitTextReveal'
import ScrollFade from '../components/animations/ScrollFade'
import Parallax from '../components/animations/Parallax'
import { notifyGridTargetReady } from '../components/animations/GridToFullscreen'
import { pad } from '../utils/formatDate'
import NotFound from './NotFound'

function Meta({ label, children }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-4 border-b border-line py-4">
      <dt className="label pt-1">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

/** Full-bleed hero. Its image is the landing spot of the grid's WebGL
 *  expansion, so it renders without a fade and reports when it's loaded. */
function ProjectHero({ project, index }) {
  const root = useRef(null)
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      if (reduced) return
      gsap.to('[data-hero-media]', {
        yPercent: 18,
        scale: 1.06,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
    },
    { scope: root, dependencies: [reduced] },
  )

  return (
    <section ref={root} className="relative h-[100svh] min-h-[560px] overflow-hidden bg-[#0B0D14] text-[#E8EAF2]">
      <div data-hero-media className="absolute inset-0 will-change-transform">
        <Picture
          src={project.cover}
          alt={project.coverAlt || ''}
          loading="eager"
          fetchPriority="high"
          fade={false}
          onLoad={notifyGridTargetReady}
          className="h-full w-full"
        />
      </div>
      {/* Legibility scrims for the header and the title */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/50 to-transparent" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[85%] bg-gradient-to-t from-black/85 via-black/50 to-transparent" />

      <div className="frame relative flex h-full flex-col justify-end pb-margin">
        <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="label !text-[#E8EAF2]/75">
            {pad(index + 1)} / {pad(projects.length)}
          </span>
          <span className="label !text-[#E8EAF2]/75">
            {project.category}, {project.year}
          </span>
          {project.placeholder && (
            <span className="border border-[#E8EAF2]/40 px-2 py-0.5 font-mono text-label uppercase text-[#E8EAF2]/80">
              Sample project
            </span>
          )}
        </div>
        <SplitTextReveal as="h1" trigger="load" type="lines" className="display text-display-xl">
          {project.title}
        </SplitTextReveal>
      </div>
    </section>
  )
}

function Gallery({ project }) {
  const [open, setOpen] = useState(null)
  if (!project.gallery?.length) return null
  const layouts = [
    'col-span-4 md:col-span-8 lg:col-span-12',
    'col-span-4 md:col-span-5 lg:col-span-7',
    'col-span-3 col-start-2 md:col-span-3 md:col-start-6 lg:col-span-4 lg:col-start-9 lg:mt-[30vh]',
  ]
  const aspects = ['aspect-[16/9]', 'aspect-[4/3]', 'aspect-[4/5]']

  return (
    <section className="frame py-section" aria-label="Gallery">
      <ul className="grid-layout gap-y-16">
        {project.gallery.map((image, i) => (
          <li key={image.src} className={layouts[i % layouts.length]}>
            <button
              type="button"
              onClick={() => setOpen(image)}
              className="group block w-full text-left"
              data-cursor="view"
              data-cursor-label="Expand"
              aria-label={`Enlarge image: ${image.alt}`}
            >
              <ScrollFade variant="clip">
                <Parallax media speed={0.16} className={aspects[i % aspects.length]}>
                  {/* alt lives on the button label + visible caption, not repeated here */}
                  <Picture src={image.src} alt="" sizes="(min-width:1024px) 60vw, 100vw" className="h-full w-full" />
                </Parallax>
              </ScrollFade>
              <span className="mt-3 flex items-center justify-between gap-4">
                <span className="text-sm text-muted">{image.alt}</span>
                <ArrowsPointingOutIcon className="size-4 text-muted transition-colors group-hover:text-fg" aria-hidden="true" />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Modal open={Boolean(open)} onClose={() => setOpen(null)} title={open?.alt || 'Image'} className="max-w-[min(92vw,1600px)]">
        {open && <Picture src={open.src} alt={open.alt} loading="eager" sizes="92vw" imgClassName="h-auto max-h-[80vh] w-full object-contain" />}
      </Modal>
    </section>
  )
}

function NextProject({ project }) {
  return (
    <section className="frame border-t border-line pt-16 md:pt-24">
      <Link to={`/projects/${project.slug}`} className="group grid-layout items-end gap-y-8" data-cursor="view" data-cursor-label="Next">
        <div className="col-span-4 md:col-span-5 lg:col-span-8">
          <p className="label mb-4">Next project</p>
          <p className="display flex items-start gap-[0.1em] text-display-lg">
            <span className="link-draw">{project.title}</span>
            <ArrowUpRightIcon
              className="mt-[0.1em] size-[0.45em] shrink-0 stroke-[1.5] transition-transform duration-800 ease-out-expo group-hover:rotate-45"
              aria-hidden="true"
            />
          </p>
        </div>
        <div className="zoom-media col-span-2 aspect-[4/3] md:col-span-3 lg:col-span-4">
          <Picture src={project.cover} alt="" sizes="30vw" className="h-full w-full" />
        </div>
      </Link>
    </section>
  )
}

export default function ProjectDetail() {
  const { slug } = useParams()
  const index = projects.findIndex((p) => p.slug === slug)
  if (index === -1) return <NotFound />

  const project = projects[index]
  const next = projects[(index + 1) % projects.length]
  const hasLinks = project.liveUrl || project.githubUrl

  return (
    <article>
      <Seo title={project.title} description={project.summary} image={`${project.cover}-1600.webp`} />
      <ProjectHero project={project} index={index} />

      <section className="frame py-section">
        <div className="grid-layout gap-y-16">
          <ScrollFade as="dl" className="col-span-4 border-t border-line md:col-span-8 lg:col-span-4">
            <Meta label="Year">{project.year}</Meta>
            <Meta label="Role">{project.role}</Meta>
            {project.client && <Meta label="Client">{project.client}</Meta>}
            <Meta label="Stack">
              <ul className="flex flex-wrap gap-x-3 gap-y-1">
                {project.tech.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </Meta>
            <Meta label="Links">
              {hasLinks ? (
                <span className="flex flex-col items-start gap-2">
                  {project.liveUrl && (
                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="link-draw inline-flex items-center gap-1">
                      Visit the live site <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
                    </a>
                  )}
                  {project.githubUrl && (
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="link-draw inline-flex items-center gap-2">
                      <BrandIcon icon={faGithub} className="size-3.5" /> Source on GitHub
                    </a>
                  )}
                </span>
              ) : (
                <span className="text-muted">Private — no public link</span>
              )}
            </Meta>
          </ScrollFade>

          <div className="col-span-4 md:col-span-8 lg:col-span-7 lg:col-start-6">
            <p className="label mb-6">Overview</p>
            <SplitTextReveal as="p" className="text-lede text-pretty md:text-[clamp(1.375rem,2.2vw,2rem)] md:leading-[1.3]">
              {project.description}
            </SplitTextReveal>

            {project.highlights?.length > 0 && (
              <>
                <p className="label mb-6 mt-16">What went into it</p>
                <ScrollFade as="ol" stagger={0.08} className="border-t border-line">
                  {project.highlights.map((h, i) => (
                    <li key={h} className="grid grid-cols-[3rem_1fr] border-b border-line py-5">
                      <span className="label tabular pt-1 text-accent-ink">{pad(i + 1)}</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ScrollFade>
              </>
            )}

            {project.liveUrl && (
              <div className="mt-12">
                <Button href={project.liveUrl}>Visit the live site</Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <Gallery project={project} />
      {next.slug !== project.slug && <NextProject project={next} />}
    </article>
  )
}
