/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SITE CONFIG — the one file to edit.
 *
 *  Settings (menu, theme, accent, feature switches, home section order) sit at
 *  the top; your content sits below. Anything marked  PLACEHOLDER  is sample
 *  copy written to show the design — replace it with your own.
 *  Projects live in src/data/projects.json, testimonials in
 *  src/data/testimonials.json.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const siteConfig = {
  // ── Settings ──────────────────────────────────────────────────────────────
  settings: {
    /** 'system' follows the OS, or force 'dark' / 'light' as the first-visit
     *  default. The visitor's toggle choice is saved and wins after that. */
    defaultTheme: 'dark',

    /** The single accent colour. `accentInk` is the same hue, darkened so
     *  accent-coloured TEXT keeps 4.5:1 contrast on the light background. */
    accent: '#C6F23A',
    accentInk: '#4B6600',

    /** Feature switches. Each is also turned off automatically where it would
     *  hurt: reduced-motion disables smoothScroll/cursor/webgl, touch disables
     *  cursor + magnetic. */
    features: {
      preloader: true, // shows once per browser session
      cursor: true,
      smoothScroll: true,
      webgl: true, // projects shader transition (and the background mesh below)
      backgroundMesh: true, // interactive 3D terrain behind every page (needs webgl)
      magnetic: true,
      pageTransitions: true,
      layoutGrid: false, // faint 12-column guides behind the page
    },

    /** Home page sections, top to bottom. Remove a key to hide a section.
     *  Available: hero, manifesto, work, features, collage, testimonials.
     *  (The footer is the contact call-to-action on every page.) */
    homeSections: ['hero', 'manifesto', 'work', 'features', 'collage'],
  },

  // ── Identity ──────────────────────────────────────────────────────────────
  name: 'George Aloysious',
  shortName: 'George',
  monogram: 'GA',
  title: 'Frontend developer', // PLACEHOLDER
  /** One line. Shown under the hero name and in meta descriptions. */
  tagline: 'I build interfaces that feel as considered as the products behind them.', // PLACEHOLDER
  /** 2–3 sentences for the home intro + about page opener. */
  bio: 'I write the layer people actually touch — layout, type, motion and the thousand small states between them. Most of my work sits where a design file stops being enough: interactions that have to be tuned by feel, performance budgets that shape what the design can be, and components other developers will live with for years.', // PLACEHOLDER
  location: {
    city: 'Kochi', // PLACEHOLDER
    country: 'India', // PLACEHOLDER
    timezone: 'Asia/Kolkata', // IANA name — drives the live clock in the footer
    coordinates: '9.93° N, 76.26° E', // PLACEHOLDER
  },
  email: 'contact@aloysious.dev',
  availability: 'Open to freelance and full-time roles from November 2026', // PLACEHOLDER
  resume: '/resume.pdf', // put your PDF at public/resume.pdf

  /** Leave a URL empty to hide that network everywhere. */
  socials: [
    { network: 'github', label: 'GitHub', url: 'https://github.com/Aloysious-Kalathil' },
    { network: 'linkedin', label: 'LinkedIn', url: '' },
    { network: 'instagram', label: 'Instagram', url: '' },
    { network: 'behance', label: 'Behance', url: '' },
    { network: 'dribbble', label: 'Dribbble', url: '' },
  ],

  // ── Home: the long statement + "What I do" ────────────────────────────────
  /** One paragraph, revealed word by word on scroll. Wrap a phrase in
   *  *asterisks* to set it in the display face. */
  manifesto:
    'I’m George Aloysious, a *frontend developer* who builds the layer people actually touch: layout, type, motion and the thousand small states between them. I started out rebuilding sites I admired, one inspect-element at a time, and never really stopped. Most of my work sits where a design file stops being enough — *interactions tuned by feel*, performance budgets that shape what the design can be, and components other developers will live with for years. I care about the part nobody screenshots: the hover state that tells you a thing is clickable before you’ve decided to click it, the form that remembers what you typed when the network drops, *the animation that finishes before you notice it started*. Design gets a site to look right. I make sure it still feels right on a four-year-old phone, a slow connection and the fortieth visit. I’d rather *ship one thing properly* than five things roughly — and I work best with designers and small teams who want the build to be as deliberate as the design.', // PLACEHOLDER

  /** "What I do" — numbered capability rows on Home (sections/Features.jsx). */
  services: [
    {
      title: 'Interface engineering',
      body: 'Design systems, component APIs and the layout logic that keeps them honest across 320px to 2560px.', // PLACEHOLDER
      tags: ['React', 'TypeScript', 'Design tokens'],
    },
    {
      title: 'Motion & interaction',
      body: 'Scroll choreography, transitions and micro-states — tuned in the browser, budgeted to hold 60fps.', // PLACEHOLDER
      tags: ['GSAP', 'ScrollTrigger', 'Lenis'],
    },
    {
      title: 'WebGL & creative code',
      body: 'Shaders and 3D where they earn their weight, with a plain fallback for every device that can’t afford them.', // PLACEHOLDER
      tags: ['Three.js', 'GLSL', 'R3F'],
    },
    {
      title: 'Performance & access',
      body: 'Lighthouse in the 90s, keyboard paths that make sense, and reduced-motion versions that are designed, not deleted.', // PLACEHOLDER
      tags: ['Core Web Vitals', 'WCAG 2.2', 'Vite'],
    },
  ],

  // ── Skills (marquee rows + about page) ────────────────────────────────────
  skills: {
    primary: ['React', 'JavaScript', 'TypeScript', 'GSAP', 'Three.js', 'Tailwind CSS', 'Next.js', 'Vite'], // PLACEHOLDER
    secondary: ['GLSL', 'Node.js', 'Figma', 'Web Audio', 'Accessibility', 'Performance', 'Git', 'Design systems'], // PLACEHOLDER
  },

  // ── About page ────────────────────────────────────────────────────────────
  about: {
    heading: 'I care about the part of the work nobody screenshots.', // PLACEHOLDER
    paragraphs: [
      'The hover state that tells you a thing is clickable before you’ve decided to click it. The form that remembers what you typed when the network drops. The animation that finishes before you notice it started.', // PLACEHOLDER
      'I started out rebuilding sites I admired, one inspect-element at a time, and never really stopped. Today I work with designers and small product teams who want the build to be as deliberate as the design — and who’d rather ship one thing properly than five things roughly.', // PLACEHOLDER
      'Away from the editor I shoot film, read about typography more than is reasonable, and keep a list of websites that made me stop scrolling.', // PLACEHOLDER
    ],
    portrait: '/images/portrait', // extension-less: .avif + .webp are looked up
    principles: [
      { title: 'Build it, then decide', body: 'Prototypes in the browser settle arguments that mockups start.' }, // PLACEHOLDER
      { title: 'Motion is information', body: 'If an animation doesn’t explain where something came from or went, it goes.' }, // PLACEHOLDER
      { title: 'Fast is a feature', body: 'Every kilobyte has to justify itself to someone on a train.' }, // PLACEHOLDER
    ],
  },

  experience: [
    { org: 'Independent', role: 'Frontend developer', years: '2024 — Now', note: 'Sites and product UI for studios and early-stage teams.' }, // PLACEHOLDER
    { org: 'Studio name', role: 'Frontend developer', years: '2022 — 2024', note: 'Built campaign sites and a shared component library.' }, // PLACEHOLDER
    { org: 'Company name', role: 'Frontend intern', years: '2021 — 2022', note: 'Shipped dashboard features and fixed a lot of CSS.' }, // PLACEHOLDER
  ],

  education: [
    { org: 'College name', role: 'B.Tech, Computer Science', years: '2018 — 2022', note: 'Final project: real-time collaborative whiteboard.' }, // PLACEHOLDER
  ],

  // ── Contact page ──────────────────────────────────────────────────────────
  contact: {
    heading: 'Got a project with an unreasonable level of detail?', // PLACEHOLDER
    /** Pill choices on the contact form. The topic becomes the email subject. */
    topics: ['A project', 'A full-time role', 'A collaboration', 'Just saying hello'],
    timelines: ['As soon as possible', 'In 1–3 months', 'No rush'],
    lede: 'Tell me what you’re making, when it needs to exist, and what would make it a success. I reply within two working days.', // PLACEHOLDER
  },

  // ── SEO defaults (pages override title + description) ─────────────────────
  seo: {
    siteUrl: 'https://your-domain.com', // PLACEHOLDER — used for canonical + OG URLs
    titleTemplate: '%s — George Aloysious',
    defaultTitle: 'George Aloysious — Frontend developer',
    description: 'Portfolio of George Aloysious, a frontend developer building fast, carefully animated interfaces with React, GSAP and WebGL.', // PLACEHOLDER
    ogImage: '/images/og.jpg',
  },
}

export default siteConfig
