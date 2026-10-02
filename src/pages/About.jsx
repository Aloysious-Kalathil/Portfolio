import siteConfig from '../config/siteConfig'
import Seo from '../components/ui/Seo'
import Button from '../components/ui/Button'
import Picture from '../components/ui/Picture'
import SplitTextReveal from '../components/animations/SplitTextReveal'
import ScrollFade from '../components/animations/ScrollFade'
import Parallax from '../components/animations/Parallax'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { pad } from '../utils/formatDate'

function Timeline({ title, items }) {
  if (!items?.length) return null
  return (
    <div className="grid-layout gap-y-8">
      <p className="label col-span-4 md:col-span-2 lg:col-span-3">{title}</p>
      <ScrollFade as="ol" stagger={0.08} className="col-span-4 border-t border-line md:col-span-6 lg:col-span-9">
        {items.map((item) => (
          <li
            key={`${item.org}-${item.years}`}
            className="group grid grid-cols-1 gap-2 border-b border-line py-6 transition-colors duration-600 md:grid-cols-[10rem_1fr_1fr] md:gap-8 md:py-8"
          >
            <span className="label tabular pt-1 transition-colors group-hover:text-accent-ink">{item.years}</span>
            <span>
              <span className="block font-display text-2xl font-bold tracking-[-0.03em]">{item.role}</span>
              <span className="block text-muted">{item.org}</span>
            </span>
            <span className="text-muted md:pt-1">{item.note}</span>
          </li>
        ))}
      </ScrollFade>
    </div>
  )
}

export default function About() {
  const { about, skills } = siteConfig
  const [lead, ...paragraphs] = about.paragraphs

  return (
    <>
      <Seo title="About" description={`${siteConfig.name} — ${siteConfig.title} based in ${siteConfig.location.city}. ${siteConfig.tagline}`} />

      {/* Opener: statement left, portrait right */}
      <section className="frame pb-section pt-[calc(var(--header-h)+16vh)]">
        <div className="grid-layout items-end gap-y-12">
          <div className="col-span-4 md:col-span-8 lg:col-span-7">
            <p className="label mb-8">About</p>
            <SplitTextReveal as="h1" trigger="load" className="display text-display-lg text-balance">
              {about.heading}
            </SplitTextReveal>
          </div>
          <Parallax speed={-0.14} className="col-span-3 md:col-span-4 lg:col-span-4 lg:col-start-9">
            <ScrollFade variant="clip" trigger="load" delay={0.3}>
              <Picture
                src={about.portrait}
                alt={`Portrait of ${siteConfig.name}`}
                loading="eager"
                sizes="(min-width:1024px) 30vw, 70vw"
                width={1200}
                height={1500}
                className="aspect-[4/5]"
              />
            </ScrollFade>
          </Parallax>
        </div>
      </section>

      {/* Long read with a sticky label */}
      <section className="frame pb-section">
        <div className="grid-layout gap-y-10">
          <div className="col-span-4 md:col-span-2 lg:col-span-3">
            <p className="label lg:sticky lg:top-[calc(var(--header-h)+3rem)]">Background</p>
          </div>
          <div className="col-span-4 md:col-span-6 lg:col-span-7">
            <SplitTextReveal as="p" className="text-[clamp(1.5rem,2.6vw,2.5rem)] font-medium leading-[1.2] tracking-[-0.025em] text-pretty">
              {lead}
            </SplitTextReveal>
            <ScrollFade stagger={0.12} className="mt-12 max-w-prose space-y-6 text-lg text-muted md:ml-[16.6%]">
              {paragraphs.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </ScrollFade>
            {siteConfig.resume && (
              <ScrollFade className="mt-12 md:ml-[16.6%]">
                <Button href={siteConfig.resume} icon={ArrowDownTrayIcon} variant="outline" download>
                  Download résumé
                </Button>
              </ScrollFade>
            )}
          </div>
        </div>
      </section>

      {/* Principles: three columns of text, numbered large */}
      {about.principles?.length > 0 && (
        <section className="border-y border-line py-section">
          <div className="frame">
            <p className="label mb-12">How I work</p>
            <ScrollFade as="ol" stagger={0.12} className="grid gap-12 md:grid-cols-3 md:gap-gutter">
              {about.principles.map((item, i) => (
                <li key={item.title}>
                  <span className="display block text-display-md text-accent-ink tabular">{pad(i + 1)}</span>
                  <h2 className="mt-6 font-display text-2xl font-bold tracking-[-0.03em]">{item.title}</h2>
                  <p className="mt-3 max-w-xs text-muted">{item.body}</p>
                </li>
              ))}
            </ScrollFade>
          </div>
        </section>
      )}

      <section className="frame space-y-section py-section">
        <Timeline title="Experience" items={siteConfig.experience} />
        <Timeline title="Education" items={siteConfig.education} />

        <div className="grid-layout gap-y-8">
          <p className="label col-span-4 md:col-span-2 lg:col-span-3">Toolkit</p>
          <div className="col-span-4 md:col-span-6 lg:col-span-9">
            <SplitTextReveal as="p" type="words" stagger={0.02} className="display text-display-sm leading-[1.15]">
              {skills.primary.join(' · ')}
            </SplitTextReveal>
            <ScrollFade as="p" className="mt-6 text-lg text-muted">
              Also: {skills.secondary.join(', ')}.
            </ScrollFade>
          </div>
        </div>
      </section>
    </>
  )
}
