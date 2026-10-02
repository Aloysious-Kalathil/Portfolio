import { Link } from 'react-router-dom'
import projects from '../data/projects.json'
import Seo from '../components/ui/Seo'
import Button from '../components/ui/Button'
import SplitTextReveal from '../components/animations/SplitTextReveal'
import ScrollFade from '../components/animations/ScrollFade'

export default function NotFound() {
  return (
    <section className="frame flex min-h-[100svh] flex-col justify-end pb-margin pt-[calc(var(--header-h)+4rem)]">
      <Seo title="Page not found" description="There is no page at this address." noindex />
      <p className="label mb-6">Error 404</p>
      <SplitTextReveal as="h1" trigger="load" className="display text-display-xl">
        Nothing here.
      </SplitTextReveal>

      <ScrollFade trigger="load" delay={0.5} className="mt-12 grid-layout gap-y-10 border-t border-line pt-8">
        <div className="col-span-4 md:col-span-4 lg:col-span-5">
          <p className="text-lede text-pretty">The link may be old, or mistyped. The work is still where it always was.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/">Back to the index</Button>
            <Button to="/projects" variant="outline">
              See the work
            </Button>
          </div>
        </div>
        <nav aria-label="Projects" className="col-span-4 md:col-span-4 lg:col-span-4 lg:col-start-9">
          <p className="label mb-4">Or jump straight to</p>
          <ul className="space-y-2">
            {projects.slice(0, 4).map((p) => (
              <li key={p.slug}>
                <Link to={`/projects/${p.slug}`} className="link-draw text-lg font-medium tracking-tight">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </ScrollFade>
    </section>
  )
}
