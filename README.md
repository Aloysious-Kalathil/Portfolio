# George Aloysious — Portfolio

A dark editorial portfolio built with **React + Vite + Tailwind CSS**, animated with **GSAP + ScrollTrigger + SplitText**, smoothed by **Lenis**, with **Three.js (React Three Fiber)** for the background mesh and the project shader transition.

**Design direction:** a type specimen more than a template. Bricolage Grotesque (display, 800, tight tracking) with Geist and Geist Mono, one ink-navy background (`#0B0D14`), one text colour and one lime accent (`#C6F23A`, deepened to olive `#4B6600` on the light theme), over an interactive 3D wire terrain. Navigation is a stack of pills top-left and the name set vertically top-right. Motion uses `expo.out` and `power4.inOut` easing throughout: masked line reveals, text that resolves out of scrambled letters, scroll-scrubbed parallax and 3D rollers. Nothing bounces.

**Home, top to bottom:** a hero of live coordinate markers around a giant outlined name that fills in under the pointer → one long about paragraph that lights up word by word → the featured projects, one tilting frame per screen → "What I do" as 3D rollers on a full-accent field → a scattered wall of project pictures → a staggered contact footer.

---

## Contents

1. [Quick start](#quick-start)
2. [Where to edit content](#where-to-edit-content)
3. [Images, logos, résumé](#images-logos-résumé)
4. [Environment variables and reCAPTCHA](#environment-variables-and-recaptcha)
5. [Deploying for free (Vercel or Netlify)](#deploying-for-free)
6. [How the pieces fit](#how-the-pieces-fit)
7. [Accessibility, reduced motion and performance](#accessibility-reduced-motion-and-performance)
8. [Placeholder checklist](#placeholder-checklist)

---

## Quick start

Requires **Node 20+**.

```bash
npm install
cp .env.example .env    # then fill in keys (optional for local browsing)
npm run dev             # http://localhost:5173
npm run build           # production build → dist/
npm run preview         # serve dist/ locally
```

The contact endpoint (`/api/verify-and-send`) also runs inside `npm run dev` through a small Vite middleware, so you can test the whole form locally once your keys are in `.env`.

---

## Where to edit content

Almost everything lives in three files.

### `src/config/siteConfig.js`: settings and your content

| Setting | What it does |
| --- | --- |
| `settings.defaultTheme` | `'dark'`, `'light'` or `'system'`. A visitor's own toggle choice is saved and wins. |
| `settings.accent` / `accentInk` | The accent colour, plus a darker shade of it used for accent **text** on the light theme (to keep 4.5:1 contrast). |
| `settings.features.*` | Switches for `preloader`, `cursor`, `smoothScroll`, `webgl`, `backgroundMesh`, `magnetic`, `pageTransitions` and `layoutGrid`. |
| `settings.homeSections` | Order of Home sections. Remove a key to hide it. Keys: `hero`, `manifesto`, `work`, `features`, `collage`, `testimonials` (testimonials is off by default; add the key to show it). |

Below the settings sit your name, title, tagline, bio, the `manifesto` paragraph (wrap a phrase in `*asterisks*` to set it in the display face), location/timezone (drives the live clock), email, availability, résumé path, social links (an empty `url` hides that network), services ("What I do"), skills (the marquee rows), the About page copy, experience/education, contact copy (including the pill choices on the contact form: `contact.topics` and `contact.timelines`) and SEO defaults.

> `index.html` has your name, theme default and accent baked in at build time (so they're correct before any JavaScript runs). After editing `siteConfig.js`, **restart `npm run dev`** to see those values change in the page shell.

### `src/data/projects.json`

```jsonc
{
  "id": 1,
  "slug": "tidewell",               // URL: /projects/tidewell
  "placeholder": true,              // shows a "Sample" tag — delete this line for real projects
  "title": "Tidewell",
  "year": 2026,
  "category": "Product",            // used by the filter pills on /projects (?category=)
  "role": "Design & frontend",
  "client": "Personal project",
  "summary": "One line shown under the project on Home.",
  "description": "The paragraph on the project page.",
  "highlights": ["Optional", "numbered", "bullet points"],
  "tech": ["React", "Canvas 2D"],
  "cover": "/images/projects/tidewell/cover",       // no extension (see Images)
  "coverAlt": "Describe the image",
  "gallery": [{ "src": "/images/projects/tidewell/01", "alt": "…" }],
  "liveUrl": "",                    // empty = hidden
  "githubUrl": "",
  "featured": true                  // featured projects get a full-screen frame on Home
}
```

### `src/data/testimonials.json`

Three placeholders, each marked `"placeholder": true`, which shows a visible **Placeholder** tag. Replace them with real quotes and remove that flag, or delete the file's entries to hide the section.

---

## Images, logos, résumé

### Images (modern formats, lazy-loaded)

Images are referenced **without an extension**. For each image, add four files:

```
public/images/projects/<slug>/cover-800.avif
public/images/projects/<slug>/cover-800.webp
public/images/projects/<slug>/cover-1600.avif
public/images/projects/<slug>/cover-1600.webp
```

The same applies to gallery images (`01`, `02`, …) and the portrait (`public/images/portrait-*`). An easy way to make them is [Squoosh](https://squoosh.app): resize to 800 px and 1600 px wide, then export as AVIF (quality ~60) and WebP (quality ~80). Covers work best around **10:7**, because cards crop them to 4:3, 4:5 and 16:10, and project pages show them full-screen.

The current artwork is generated placeholder art. Replace it before launch.

### Logos and icons

The site's own mark is the name set vertically in the top-right corner (text, from `siteConfig.name`), so there is no logo image to maintain in the layout. `public/images/logos/logo-dark.svg` (light ink) and `logo-light.svg` (dark ink) are the "GA." monogram outlined from Bricolage Grotesque, kept for use elsewhere (email signature, README, social profiles). Their accent square is hard-coded (`#C6F23A` in `logo-dark.svg` and `icon.svg`, `#4B6600` in `logo-light.svg`), so change it there if you change the accent.

Favicon files: `public/favicon.ico`, `public/images/icons/icon.svg` and `apple-touch-icon.png`. The social share image is `public/images/og.jpg` (1200×630).

### Résumé

Replace `public/resume.pdf` (currently a placeholder page), or point `resume` in `siteConfig.js` elsewhere.

---

## Environment variables and reCAPTCHA

`.env` is git-ignored. `.env.example` lists every key:

| Variable | Where it's used | Exposed to the browser? |
| --- | --- | --- |
| `VITE_RECAPTCHA_SITE_KEY` | Contact page (gets the token) | Yes (public by design) |
| `RECAPTCHA_SECRET_KEY` | `api/verify-and-send.js` | **No** |
| `RECAPTCHA_MIN_SCORE` | Minimum accepted score, default `0.5` | No |
| `RESEND_API_KEY` | Sends the email | **No** |
| `CONTACT_TO_EMAIL` | Where messages arrive (comma-separate several) | No |
| `CONTACT_FROM_EMAIL` | Sender, e.g. `Portfolio <onboarding@resend.dev>` | No |

Only variables prefixed with `VITE_` ever reach the browser bundle. Never put a secret behind that prefix.

### Getting reCAPTCHA v3 keys

1. Go to <https://www.google.com/recaptcha/admin/create>.
2. Choose **reCAPTCHA v3** (score-based).
3. Add your domains: `localhost`, your production domain, and your `*.vercel.app` / `*.netlify.app` domain.
4. Copy the **site key** to `VITE_RECAPTCHA_SITE_KEY` and the **secret key** to `RECAPTCHA_SECRET_KEY`.

The reCAPTCHA script loads **only on the Contact page**. Google's floating badge is hidden and replaced by the required text notice under the form.

### Getting a Resend key

1. Sign up at <https://resend.com> and create an API key → `RESEND_API_KEY`.
2. While testing, `onboarding@resend.dev` can only send **to the email you signed up with**, so set that as `CONTACT_TO_EMAIL`.
3. For production, verify your own domain in Resend and set `CONTACT_FROM_EMAIL` to something like `Portfolio <hello@your-domain.com>`.

### What the function does

`api/verify-and-send.js`:
1. Validates the fields with the same rules the form uses. A filled honeypot field is silently accepted and dropped.
2. Posts the token to Google's `siteverify`, and rejects failures, the wrong `action`, or a score below `RECAPTCHA_MIN_SCORE`.
3. Sends a plain-text and HTML-escaped email through Resend, with `reply_to` set to the sender.

Every failure returns a clear message that the form shows inline. No `alert()` popups anywhere.

---

## Deploying for free

### Vercel (recommended)

1. Push this repo to GitHub.
2. In Vercel: **Add New… → Project → import the repo**. The framework is detected as **Vite**, the build command is `npm run build` and the output directory is `dist`.
3. **Settings → Environment Variables**: add every variable from `.env.example` (both `VITE_…` and server keys).
4. Deploy. `api/verify-and-send.js` becomes a serverless function at `/api/verify-and-send` automatically, and `vercel.json` rewrites every other route to the SPA.
5. Add your domain, then update `seo.siteUrl` in `siteConfig.js` and the reCAPTCHA domain list.

### Netlify

1. **Add new site → Import an existing project → pick the repo.** `netlify.toml` already sets the build command, the `dist` publish folder and the functions folder.
2. **Site configuration → Environment variables**: add everything from `.env.example`.
3. Deploy. `netlify/functions/verify-and-send.mjs` wraps the same handler, and `netlify.toml` routes `/api/verify-and-send` to it and sends all other routes to the SPA.

---

## How the pieces fit

```
public/
├── images/        logos/, icons/, backgrounds/, projects/<slug>/, portrait-*, og.jpg
├── models/        3D models (glb, gltf) if you add any
├── videos/
├── fonts/
└── favicon.ico
src/
├── assets/        images/, icons/, fonts/ (for assets imported from code)
├── components/
│   ├── ui/        Button, Card, Modal, Picture, Seo, BrandIcon
│   ├── layout/    Navbar (pills, wordmark, progress bar), Footer, Sidebar, Cursor,
│   │              Preloader, PageTransition
│   └── animations/SplitTextReveal, ScrambleText, ScrollFade, Parallax, MagneticButton,
│                  BackgroundMesh, GridToFullscreen (+ GridTransitionScene shader)
├── pages/         Home, About, Projects, ProjectDetail, Contact, NotFound
├── sections/      Hero, Manifesto, Work, Features, Collage, Testimonials
├── hooks/         useLenis (smooth scroll + scroll lock), useScroll (+ useChromeTone),
│                  useTheme, useReducedMotion, useIsTouch, useFeatures (effective
│                  switches), useSiteReady (preloader / transition gates)
├── utils/         gsapSetup.js (plugins, easing), liveColor.js, api.js (form +
│                  reCAPTCHA), formatDate.js
├── styles/        globals.css, variables.css
├── config/        siteConfig.js (all settings + content), routes.js (lazy pages, nav)
├── data/          projects.json, testimonials.json
├── App.jsx
└── main.jsx
api/               verify-and-send.js          (contact form serverless function)
netlify/functions/ verify-and-send.mjs         (Netlify adapter for the same function)
```

- **Navigation:** `Navbar.jsx` renders two fixed pills (Menu, Let's talk) and the vertical name. Menu opens in place into a row of page pills plus the theme switch; Escape or a click outside closes it. A section can call `useChromeTone(ref)` to flip the pills and name to a readable colour pair while it sits underneath them (the accent "What I do" section does).
- **Hero:** `Markers` lays small "+ 000" markers on the column lines; each shows its distance in pixels to the pointer and warms to the live colour as it gets close (page position when there is no pointer). The name is sized to run edge to edge, drawn as an outline, and a radial mask following the pointer fills it in. On touch screens and with reduced motion it is simply solid.
- **Scrambled text:** `ScrambleText` resolves a label out of random letters on load, on scroll or on hover. Screen readers get the plain text.
- **What I do:** each service in `sections/Features.jsx` is a four-sided CSS 3D roller (title, description, tools, title) turned by scroll. With reduced motion it renders as a plain list.
- **Work page:** five columns (three on tablets, two on phones) list the projects from different starting points and drift at different speeds. Only the first column is exposed to keyboards and screen readers; the others repeat it.
- **Smooth scroll:** a single Lenis instance is driven by `gsap.ticker` and calls `ScrollTrigger.update` on scroll, so the two never disagree. Menus and modals stop it (`useScrollLock`), and it resets to the top on every route change.
- **Page transitions:** `PageTransition.jsx` keeps the old route rendered while a panel wipes up over it and the next page's code loads. It then swaps pages behind the panel, scrolls to top, refreshes ScrollTrigger and wipes off. Intro animations wait until the page is actually visible (`whenPageVisible()`).
- **Project → detail:** clicking a project (a Home frame or a Work-page card) hands its screen rect to an overlay that lives outside the routes. The overlay expands the image with a vertex shader, navigates, and lifts only once the detail page's hero image has loaded. Without WebGL, a GSAP-scaled image does the same job. With reduced motion, it's a short fade.
- **Background mesh:** `BackgroundMesh.jsx` draws a wire terrain on a fixed canvas behind every page. It rises under the mouse or a finger, sends a ripple out from each click or tap, and drifts, tilts and swells as the page scrolls. It loads when the browser is idle, follows the theme colours, and is skipped wherever WebGL is (reduced motion, software GPUs, Save-Data). Turn it off with `features.backgroundMesh: false`.
- **Cleanup:** every animation lives in `useGSAP` / `gsap.context`, so switching pages reverts all tweens, ScrollTriggers and SplitText splits.
- **Cursor:** a small GSAP `quickTo` dot and a trailing ring that becomes a caret over large text. Its colour, the background mesh glow and the hero markers all share one "live colour" (`utils/liveColor.js`) that starts at the accent and drifts through hues as you move and scroll. Data attributes set its states: `data-cursor="view|drag|text|link|none"` and `data-cursor-label="…"`.

Tooling note: `@fortawesome/free-brands-svg-icons` provides the social icons, rendered by the small `BrandIcon` component instead of FontAwesome's ~70 KB runtime.

---

## Accessibility, reduced motion and performance

| Condition | What changes |
| --- | --- |
| `prefers-reduced-motion` | No Lenis, parallax, cursor, magnetic pull, WebGL, text scramble or rollers. Reveals become short opacity fades, and transitions become quick crossfades. |
| Touch / coarse pointer | No custom cursor, magnetic effects or name spotlight (the name is solid). Native scrolling. The background mesh still follows a finger and ripples on tap. |
| No hardware WebGL (software renderer, Save-Data, < 2 GB memory) | Background mesh skipped. Projects open with the GSAP image expansion. |

Other details:
- Semantic landmarks, a skip link, and one visible focus style in both themes.
- Headless UI handles focus trapping and Escape in the image modal; the menu closes on Escape and on a click outside.
- The form marks invalid fields with `aria-invalid` plus described-by messages, and moves focus to the first invalid field.
- The contact form's pill choices are radio groups (`role="radiogroup"`) with a visible selected state.
- Text colours meet WCAG AA in both themes.
- Per-page title, description, canonical and Open Graph tags (`Seo.jsx`). `robots.txt` and `sitemap.xml` are generated at build from `seo.siteUrl`.

Lighthouse scores have not been re-measured since the redesign. Run it against `npm run preview` before launch.

---

## Placeholder checklist

Everything below is sample content, marked `PLACEHOLDER` in the code where it's text:

- [ ] `siteConfig.js`: title, tagline, bio, manifesto, location/coordinates, **email**, availability, social URLs, services, skills, About copy, experience, education, contact copy, `seo.siteUrl`
- [ ] `projects.json`: all six projects (remove `"placeholder": true` as you replace them)
- [ ] `testimonials.json`: three quotes
- [ ] Images: project covers and galleries, `portrait-*`, `og.jpg`
- [ ] `public/resume.pdf`
- [ ] `.env` / hosting environment variables
