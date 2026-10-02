import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { gsap, ScrollTrigger, useGSAP, EASE } from '../../utils/gsapSetup'
import { useTheme } from '../../hooks/useTheme'
import { navItems } from '../../config/routes'
import siteConfig from '../../config/siteConfig'

/** Thin reading-progress line pinned to the very top of the viewport. */
export function ScrollProgress() {
  const bar = useRef(null)
  useGSAP(() => {
    gsap.set(bar.current, { scaleX: 0 })
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => gsap.set(bar.current, { scaleX: self.progress }),
    })
  })
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[55] h-[2px]">
      <div ref={bar} className="h-full origin-left bg-accent" />
    </div>
  )
}

const [firstName, ...restName] = siteConfig.name.toLowerCase().split(' ')

/**
 * Site chrome: two stacked pills top-left (Menu, Let's talk) and the name set
 * vertically top-right. Menu opens in place into a row of page pills plus the
 * theme switch. Over a full-accent section the whole chrome flips to the
 * contrast pair (see `html[data-chrome]` in globals.css).
 */
export default function Navbar() {
  const root = useRef(null)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { theme, toggleTheme } = useTheme()
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    const onPointer = (e) => !root.current?.contains(e.target) && setOpen(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  useGSAP(
    () => {
      if (!open) return
      gsap.fromTo(
        '[data-menu-item]',
        { autoAlpha: 0, x: -14 },
        { autoAlpha: 1, x: 0, duration: 0.7, stagger: 0.05, ease: EASE.out, clearProps: 'transform' },
      )
    },
    { scope: root, dependencies: [open] },
  )

  return (
    <>
      <header ref={root} className="chrome pointer-events-none fixed left-margin right-16 top-margin z-header">
        <nav aria-label="Primary" className="flex flex-col items-start gap-1.5">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-1.5">
            <button
              type="button"
              className="pill pointer-events-auto"
              aria-expanded={open}
              aria-controls="primary-menu"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? 'Close' : 'Menu'}
            </button>
            <ul id="primary-menu" className={`pointer-events-auto flex-wrap items-center gap-1.5 ${open ? 'flex' : 'hidden'}`}>
              <li data-menu-item>
                <NavLink to="/" end className="pill pill-paper">
                  Home
                </NavLink>
              </li>
              {navItems.map((item) => (
                <li key={item.to} data-menu-item>
                  <NavLink to={item.to} className="pill pill-paper">
                    {item.label}
                  </NavLink>
                </li>
              ))}
              <li data-menu-item>
                <button type="button" className="pill pill-ghost" onClick={toggleTheme} aria-label={`Switch to ${nextTheme} theme`}>
                  {nextTheme} mode
                </button>
              </li>
            </ul>
          </div>
          <Link to="/contact" className="pill pointer-events-auto">
            Let’s talk
          </Link>
        </nav>
      </header>

      <Link
        to="/"
        aria-label={`${siteConfig.name} — home`}
        data-cursor="link"
        className="chrome fixed right-margin top-margin z-header font-display text-[22px] font-extrabold leading-none tracking-[-0.05em] [writing-mode:vertical-rl]"
        style={{ color: 'rgb(var(--chrome-ink, var(--accent)))' }}
      >
        <span className="inline-block rotate-180 transition-colors duration-400">
          {firstName}
          <span className="text-[rgb(var(--chrome-ink,var(--fg)))]">.</span>
          {restName.join('')}
        </span>
      </Link>
    </>
  )
}
