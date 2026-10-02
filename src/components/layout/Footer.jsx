import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { faGithub } from '@fortawesome/free-brands-svg-icons/faGithub'
import BrandIcon from '../ui/BrandIcon'
import { faLinkedinIn } from '@fortawesome/free-brands-svg-icons/faLinkedinIn'
import { faInstagram } from '@fortawesome/free-brands-svg-icons/faInstagram'
import { faBehance } from '@fortawesome/free-brands-svg-icons/faBehance'
import { faDribbble } from '@fortawesome/free-brands-svg-icons/faDribbble'
import { ArrowUpRightIcon, ArrowUpIcon } from '@heroicons/react/24/outline'
import siteConfig from '../../config/siteConfig'
import { navItems } from '../../config/routes'
import MagneticButton from '../animations/MagneticButton'
import { formatClock } from '../../utils/formatDate'
import { scrollToTop } from '../../hooks/useLenis'

const ICONS = {
  github: faGithub,
  linkedin: faLinkedinIn,
  instagram: faInstagram,
  behance: faBehance,
  dribbble: faDribbble,
}

export const activeSocials = siteConfig.socials.filter((s) => s.url)

/** Brand icons that pull toward the cursor. Networks without a URL are skipped. */
export function SocialLinks({ className = '', vertical = false, compact = false }) {
  if (!activeSocials.length) return null
  return (
    <ul className={`flex ${vertical ? 'flex-col' : 'flex-row'} items-center gap-1 ${className}`}>
      {activeSocials.map((s) => (
        <li key={s.network}>
          <MagneticButton strength={0.45}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${s.label} (opens in a new tab)`}
              className={`grid ${compact ? 'size-9' : 'size-11'} place-items-center rounded-full text-fg/70 transition-colors duration-400 hover:bg-fg hover:text-bg`}
            >
              <span data-magnetic-label>
                <BrandIcon icon={ICONS[s.network]} className="size-[18px]" />
              </span>
            </a>
          </MagneticButton>
        </li>
      ))}
    </ul>
  )
}

export function LocalTime({ className = '' }) {
  const tz = siteConfig.location.timezone
  const [time, setTime] = useState(() => formatClock(tz))
  useEffect(() => {
    const id = setInterval(() => setTime(formatClock(tz)), 15000)
    return () => clearInterval(id)
  }, [tz])
  return (
    <time className={`tabular ${className}`} aria-label={`Local time in ${siteConfig.location.city}: ${time}`}>
      {time}
    </time>
  )
}

const TEXT = 'text-[clamp(1.0625rem,1.45vw,1.375rem)] font-medium leading-[1.3] tracking-[-0.01em]'
const INDENTS = ['', 'pl-[2.4em]', 'pl-[0.9em]', 'pl-[1.7em]']

/** A two-word heading in the accent colour over a list whose lines step in
 *  and out, each led by an arrow. */
function Group({ title, className = '', children }) {
  const [first, second] = title
  const items = Array.isArray(children) ? children.flat().filter(Boolean) : [children]
  return (
    <div className={`${TEXT} ${className}`}>
      <p className="mb-2 text-accent-ink">
        {first}
        <span className="pl-[1.4em]">{second}</span>
      </p>
      <ul>
        {items.map((item, i) => (
          <li key={item.key ?? i} className={`flex items-baseline gap-2 ${INDENTS[i % INDENTS.length]}`}>
            <ArrowUpRightIcon aria-hidden="true" className="size-[0.62em] shrink-0 stroke-[2.5] text-accent-ink" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function CopyEmail() {
  const [status, setStatus] = useState('idle')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(siteConfig.email)
      setStatus('copied')
    } catch {
      setStatus('failed')
    }
    setTimeout(() => setStatus('idle'), 2200)
  }
  return (
    <button type="button" onClick={copy} className="link-draw text-left">
      <span aria-live="polite">{status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy failed' : 'Copy address'}</span>
    </button>
  )
}

export default function Footer() {
  const { pathname } = useLocation()
  const onContact = pathname === '/contact'
  const year = new Date().getFullYear()

  return (
    <footer className="relative z-[2] mt-section">
      <div className="frame flex min-h-[100svh] flex-col pb-margin pt-[calc(var(--margin)+6.5rem)]">
        <div className="grid-layout flex-1 content-center gap-y-12 py-10">
          <Group title={['Say', 'hello:']} className="col-span-4 md:col-span-4 md:col-start-4 lg:col-span-3 lg:col-start-5">
            <a key="mail" href={`mailto:${siteConfig.email}`} className="link-draw break-all">
              {siteConfig.email}
            </a>
            <CopyEmail key="copy" />
          </Group>

          <Group title={['Pages', 'here:']} className="col-span-2 md:col-span-3 md:col-start-1 md:mt-[9vh] lg:col-start-2">
            <Link key="home" to="/" className="link-draw">
              Home
            </Link>
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className="link-draw">
                {item.label}
              </Link>
            ))}
          </Group>

          <Group title={['Find me', 'elsewhere:']} className="col-span-2 md:col-span-3 md:col-start-5 md:mt-[4vh] lg:col-start-8">
            {activeSocials.map((s) => (
              <a key={s.network} href={s.url} target="_blank" rel="noopener noreferrer" className="link-draw">
                {s.label}
              </a>
            ))}
            {siteConfig.resume && (
              <a key="resume" href={siteConfig.resume} className="link-draw" download>
                Résumé (PDF)
              </a>
            )}
          </Group>
        </div>

        {!onContact && (
          <Link
            to="/contact"
            data-cursor="text"
            className="group relative mb-10 block w-fit display text-display-xl"
            aria-label="Start a project — go to the contact page"
          >
            <span className="flex items-start gap-[0.08em]">
              <ArrowUpRightIcon
                aria-hidden="true"
                className="mt-[0.1em] size-[0.42em] shrink-0 stroke-[1.5] text-accent-ink transition-transform duration-800 ease-out-expo group-hover:rotate-45"
              />
              <span className="relative block">
                <span>Let’s talk</span>
                {/* Accent copy wipes across on hover */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 text-accent-ink transition-[clip-path] duration-800 ease-out-expo [clip-path:inset(0_100%_0_0)] group-hover:[clip-path:inset(0_0%_0_0)] group-focus-visible:[clip-path:inset(0_0%_0_0)]"
                >
                  Let’s talk
                </span>
              </span>
            </span>
          </Link>
        )}

        <div className={`flex items-end justify-between gap-6 ${TEXT}`}>
          <p>
            {siteConfig.name}
            <span className="block pl-[3.2em] text-accent-ink">© {year}</span>
          </p>
          <p className="hidden text-right md:block">
            <LocalTime /> in {siteConfig.location.city}
            <span className="block text-accent-ink">{siteConfig.location.coordinates}</span>
          </p>
          <button type="button" onClick={() => scrollToTop({ immediate: false })} className="group inline-flex items-center gap-2">
            <ArrowUpIcon
              className="size-[0.7em] stroke-[2.5] text-accent-ink transition-transform duration-600 ease-out-expo group-hover:-translate-y-1"
              aria-hidden="true"
            />
            <span className="link-draw">Back to top</span>
          </button>
        </div>
      </div>
    </footer>
  )
}
