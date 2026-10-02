import { lazy } from 'react'

/**
 * Route table. Each page is code-split; `load` is kept so the page transition
 * can fetch the next chunk while the overlay covers the screen.
 */
const page = (load) => Object.assign(lazy(load), { load })

export const pages = {
  home: page(() => import('../pages/Home.jsx')),
  about: page(() => import('../pages/About.jsx')),
  projects: page(() => import('../pages/Projects.jsx')),
  projectDetail: page(() => import('../pages/ProjectDetail.jsx')),
  contact: page(() => import('../pages/Contact.jsx')),
  notFound: page(() => import('../pages/NotFound.jsx')),
}

export const routes = [
  { path: '/', component: pages.home },
  { path: '/about', component: pages.about },
  { path: '/projects', component: pages.projects },
  { path: '/projects/:slug', component: pages.projectDetail },
  { path: '/contact', component: pages.contact },
  { path: '*', component: pages.notFound },
]

/** Primary navigation, in order (Home is always first in the menu). */
export const navItems = [
  { label: 'Work', to: '/projects' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

/** Find the lazy page for a pathname, so it can be preloaded. */
export function pageForPath(pathname) {
  if (pathname === '/') return pages.home
  if (pathname === '/about') return pages.about
  if (pathname === '/projects') return pages.projects
  if (pathname.startsWith('/projects/')) return pages.projectDetail
  if (pathname === '/contact') return pages.contact
  return pages.notFound
}
