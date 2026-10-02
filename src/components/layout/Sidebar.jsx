import siteConfig from '../../config/siteConfig'
import { SocialLinks, LocalTime } from './Footer'

/**
 * Fixed rails in the page margins on wide screens: place + local time on the
 * left, social links on the right. Hidden where the margins are too narrow to
 * hold them (below 1280px / 1600px).
 */
export default function Sidebar() {
  return (
    <aside aria-label="Location and social links" className="hidden xl:block">
      {/* Difference blend keeps the rail readable over any section colour */}
      <div className="fixed bottom-8 left-[calc(var(--margin)/2)] z-rail -translate-x-1/2 mix-blend-difference">
        <p className="label whitespace-nowrap !text-white/60 [writing-mode:vertical-rl] rotate-180">
          {siteConfig.location.city}, {siteConfig.location.country} — <LocalTime />
        </p>
      </div>
      <div className="fixed bottom-6 right-[calc(var(--margin)/2)] z-rail hidden translate-x-1/2 2xl:block">
        <SocialLinks vertical compact />
      </div>
    </aside>
  )
}
