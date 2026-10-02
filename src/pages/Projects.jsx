import { useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import projects from '../data/projects.json'
import { gsap, useGSAP } from '../utils/gsapSetup'
import { useReducedMotion } from '../hooks/useReducedMotion'
import Seo from '../components/ui/Seo'
import Card from '../components/ui/Card'
import SplitTextReveal from '../components/animations/SplitTextReveal'
import ScrollFade from '../components/animations/ScrollFade'
import { openProject, usePreloadGridScene } from '../components/animations/GridToFullscreen'
import { pad } from '../utils/formatDate'

const categories = [...new Set(projects.map((p) => p.category))]
const numberOf = (project) => projects.indexOf(project) + 1

/** Per column: where it starts (vh down), how far it drifts over the scroll
 *  (in viewport heights; negative runs ahead of the page) and which project
 *  it opens with. */
const COLUMNS = [
  { offset: 0, drift: 0, shift: 0, show: '' },
  { offset: 16, drift: -0.55, shift: 2, show: '' },
  { offset: 6, drift: 0.22, shift: 4, show: 'hidden md:block' },
  { offset: 24, drift: -0.8, shift: 1, show: 'hidden lg:block' },
  { offset: 11, drift: -0.3, shift: 3, show: 'hidden lg:block' },
]
const MIN_ROWS = 4

/**
 * The index as drifting columns. Every column lists the projects from a
 * different starting point and slides at its own speed, so the wall keeps
 * rearranging as you scroll. Only the first column is exposed to keyboards
 * and screen readers — the rest repeat it.
 */
function Columns({ list }) {
  const root = useRef(null)
  const reduced = useReducedMotion()
  usePreloadGridScene()

  useGSAP(
    () => {
      if (reduced) return
      gsap.utils.toArray('[data-column]').forEach((column) => {
        const drift = Number(column.dataset.drift)
        if (!drift) return
        gsap.to(column, {
          y: () => drift * window.innerHeight,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
        })
      })
    },
    { scope: root, dependencies: [reduced] },
  )

  const rows = Math.max(list.length, MIN_ROWS)

  return (
    <div ref={root} className="grid grid-cols-2 gap-x-gutter pb-[30vh] md:grid-cols-3 lg:grid-cols-5">
      {COLUMNS.map((column, c) => (
        <ul
          key={c}
          data-column
          data-drift={column.drift}
          aria-hidden={c > 0 || undefined}
          className={`will-change-transform ${column.show}`}
          style={{ paddingTop: `${column.offset}vh` }}
        >
          {Array.from({ length: rows }, (_, row) => {
            const project = list[(row + column.shift) % list.length]
            const repeat = c > 0 || row >= list.length
            return (
              <li key={row} className="mb-[11vh]" aria-hidden={(c === 0 && repeat) || undefined}>
                <Card project={project} number={numberOf(project)} decorative={repeat} onOpen={openProject} />
              </li>
            )
          })}
        </ul>
      ))}
    </div>
  )
}

export default function Projects() {
  const [params, setParams] = useSearchParams()
  const active = params.get('category')
  const list = useMemo(() => (active ? projects.filter((p) => p.category === active) : projects), [active])

  const choose = (category) => {
    if (category) setParams({ category }, { preventScrollReset: true })
    else setParams({}, { preventScrollReset: true })
  }

  return (
    <>
      <Seo
        title={active ? `${active} work` : 'Work'}
        description={`Selected projects${active ? ` in ${active.toLowerCase()}` : ''}: interfaces, motion and WebGL built with care for detail and performance.`}
      />

      <section className="frame pb-[10vh] pt-[calc(var(--margin)+9rem)]">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-8">
          <div>
            <p className="label mb-4">Index ({pad(projects.length)})</p>
            <SplitTextReveal as="h1" trigger="load" className="display text-display-lg">
              Work
            </SplitTextReveal>
          </div>
          <ScrollFade trigger="load" delay={0.4} className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
            {[null, ...categories].map((category) => {
              const selected = (category ?? null) === (active ?? null)
              const count = category ? projects.filter((p) => p.category === category).length : projects.length
              return (
                <button
                  key={category ?? 'all'}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => choose(category)}
                  className={`pill ${selected ? '' : 'pill-ghost'}`}
                >
                  {category ?? 'All'}
                  <span className="tabular opacity-60">{pad(count)}</span>
                </button>
              )
            })}
          </ScrollFade>
        </div>
      </section>

      <section className="frame" aria-live="polite">
        {list.length ? (
          <Columns key={active ?? 'all'} list={list} />
        ) : (
          <div className="border-y border-line py-24 text-center">
            <p className="display text-display-sm">Nothing filed under “{active}” yet.</p>
            <p className="mt-4 text-muted">That category exists in a link somewhere, but no project uses it.</p>
            <button type="button" onClick={() => choose(null)} className="pill pill-lg mt-8">
              Show all work
            </button>
          </div>
        )}
      </section>
    </>
  )
}
