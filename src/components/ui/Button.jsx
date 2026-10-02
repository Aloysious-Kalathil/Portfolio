import { Link } from 'react-router-dom'
import { ArrowUpRightIcon } from '@heroicons/react/20/solid'
import MagneticButton from '../animations/MagneticButton'

const VARIANTS = {
  solid: 'bg-fg text-bg hover:bg-accent hover:text-[rgb(var(--accent-contrast))]',
  outline: 'border border-fg/30 text-fg hover:border-fg',
  accent: 'bg-accent text-[rgb(var(--accent-contrast))] hover:bg-fg hover:text-bg',
}
const SIZES = {
  md: 'h-12 px-6 text-sm',
  lg: 'h-16 px-8 text-base',
}

/**
 * Button / link with a rolling label.
 *  to       → router <Link>
 *  href     → <a> (external links open in a new tab)
 *  otherwise → <button>
 * `loading` swaps the icon for a spinner and disables the button.
 */
export default function Button({
  to,
  href,
  variant = 'solid',
  size = 'md',
  icon = ArrowUpRightIcon,
  magnetic = true,
  loading = false,
  className = '',
  children,
  ...rest
}) {
  const Icon = icon
  const classes = `group relative inline-flex select-none items-center justify-center gap-3 rounded-full font-medium tracking-tight transition-colors duration-600 ease-out-expo disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`

  const content = (
    <span data-magnetic-label className="inline-flex items-center gap-3">
      <span className="roll">
        <span>{children}</span>
        <span aria-hidden="true">{children}</span>
      </span>
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
      ) : (
        Icon && (
          <Icon
            className="size-4 transition-transform duration-600 ease-out-expo group-hover:rotate-45"
            aria-hidden="true"
          />
        )
      )}
    </span>
  )

  let element
  if (to) {
    element = (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    )
  } else if (href) {
    const external = /^https?:/.test(href)
    element = (
      <a href={href} className={classes} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>
        {content}
      </a>
    )
  } else {
    element = (
      <button type="button" className={classes} disabled={loading || rest.disabled} aria-busy={loading || undefined} {...rest}>
        {content}
      </button>
    )
  }

  return magnetic ? <MagneticButton>{element}</MagneticButton> : element
}
