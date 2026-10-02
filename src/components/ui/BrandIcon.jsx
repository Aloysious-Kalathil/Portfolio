/**
 * Renders a Font Awesome brand icon definition (e.g. faGithub from
 * @fortawesome/free-brands-svg-icons) as inline SVG. Skips the ~70 KB
 * fontawesome-svg-core runtime — the icon data is all we need.
 */
export default function BrandIcon({ icon, className = 'size-4', title }) {
  const [width, height, , , path] = icon.icon
  const paths = Array.isArray(path) ? path : [path]
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      fill="currentColor"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
      focusable="false"
    >
      {title && <title>{title}</title>}
      {paths.map((d) => (
        <path key={d.slice(0, 16)} d={d} />
      ))}
    </svg>
  )
}
