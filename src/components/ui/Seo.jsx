import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import siteConfig from '../../config/siteConfig'

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

/**
 * Per-page title, description, canonical and Open Graph tags. Updates the
 * tags index.html already ships with, so there are never duplicates.
 */
export default function Seo({ title, description, image, noindex = false }) {
  const { pathname } = useLocation()
  const { seo } = siteConfig

  useEffect(() => {
    const fullTitle = title ? seo.titleTemplate.replace('%s', title) : seo.defaultTitle
    const desc = description || seo.description
    const base = seo.siteUrl.replace(/\/$/, '')
    const url = `${base}${pathname}`
    const img = `${base}${image || seo.ogImage}`

    document.title = fullTitle
    setMeta('name', 'description', desc)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', desc)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', img)
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', desc)
    setMeta('name', 'robots', noindex ? 'noindex' : 'index, follow')
    setCanonical(url)
  }, [title, description, image, noindex, pathname, seo])

  return null
}
