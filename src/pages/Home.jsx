import siteConfig from '../config/siteConfig'
import Seo from '../components/ui/Seo'
import Hero from '../sections/Hero'
import Manifesto from '../sections/Manifesto'
import Work from '../sections/Work'
import Features from '../sections/Features'
import Collage from '../sections/Collage'
import Testimonials from '../sections/Testimonials'

const SECTIONS = {
  hero: Hero,
  manifesto: Manifesto,
  work: Work,
  features: Features,
  collage: Collage,
  testimonials: Testimonials,
}

export default function Home() {
  return (
    <>
      <Seo description={siteConfig.seo.description} />
      {siteConfig.settings.homeSections.map((key) => {
        const Section = SECTIONS[key]
        return Section ? <Section key={key} /> : null
      })}
    </>
  )
}
