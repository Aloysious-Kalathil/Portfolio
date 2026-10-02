import { Link } from 'react-router-dom'
import Picture from './Picture'
import { pad } from '../../utils/formatDate'

/**
 * Project card: number, square thumbnail, title, category and year.
 * `onOpen` lets the WebGL transition take over the click (it prevents default
 * and runs its own expansion from the `[data-card-media]` box).
 * `decorative` marks a repeat of a card shown elsewhere: it stays clickable
 * with a mouse but is skipped by keyboards and screen readers.
 */
export default function Card({
  project,
  number,
  onOpen,
  decorative = false,
  sizes = '(min-width:1024px) 18vw, (min-width:768px) 30vw, 46vw',
  className = '',
}) {
  return (
    <Link
      to={`/projects/${project.slug}`}
      onClick={(event) => onOpen?.(event, project)}
      tabIndex={decorative ? -1 : undefined}
      data-cursor="view"
      data-cursor-label="Open"
      className={`group block text-[clamp(0.9375rem,1.2vw,1.125rem)] font-medium tracking-[-0.01em] text-accent-ink ${className}`}
    >
      <span className="tabular mb-2 block"># {pad(number, 3)}</span>
      <span data-card-media className="zoom-media relative block aspect-square">
        <Picture src={project.cover} alt={decorative ? '' : project.coverAlt || ''} sizes={sizes} className="h-full w-full" />
        {project.placeholder && (
          <span className="absolute left-2 top-2 bg-bg/90 px-2 py-1 font-mono text-label uppercase text-muted">Sample</span>
        )}
      </span>
      <span className="mt-3 block transition-colors duration-400 group-hover:text-fg">{project.title}</span>
      <span className="label mt-1 block">
        {project.category}, {project.year}
      </span>
    </Link>
  )
}
