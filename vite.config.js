import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import siteConfig from './src/config/siteConfig.js'

const hexToRgb = (hex) => {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}
const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** Bakes values from siteConfig.js into index.html (theme default, accent,
 *  default meta tags) so they're correct before any JS runs. */
function htmlConfig() {
  const { settings, seo, name, email } = siteConfig
  const values = {
    __TITLE__: seo.defaultTitle,
    __DESCRIPTION__: seo.description,
    __NAME__: name,
    __LOCATION__: `${siteConfig.location.city}, ${siteConfig.location.country}`,
    __YEAR__: String(new Date().getFullYear()),
    __EMAIL__: email,
    __SITE_URL__: seo.siteUrl.replace(/\/$/, ''),
    __OG_IMAGE__: seo.ogImage,
    __DEFAULT_THEME__: settings.defaultTheme,
    __PRELOADER__: String(Boolean(settings.features.preloader)),
    __ACCENT_RGB__: hexToRgb(settings.accent),
    __ACCENT_INK_RGB__: hexToRgb(settings.accentInk || settings.accent),
  }
  return {
    name: 'html-config',
    transformIndexHtml(html) {
      return html.replace(/__[A-Z_]+?__/g, (key) => (key in values ? escapeHtml(values[key]) : key))
    },
  }
}

/**
 * Dev-only bridge: runs /api/verify-and-send.js inside the Vite dev server so
 * the contact form works locally without `vercel dev` / `netlify dev`.
 */
function devApi(env) {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      Object.assign(process.env, env)
      server.middlewares.use('/api/verify-and-send', async (req, res) => {
        try {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const request = new Request(`http://localhost${req.originalUrl}`, {
            method: req.method,
            headers: req.headers,
            body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
          })
          const mod = await server.ssrLoadModule('/api/verify-and-send.js')
          const handler = mod[req.method] || mod.POST
          const response = await handler(request)
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(await response.text())
        } catch (error) {
          server.config.logger.error(error)
          res.statusCode = 500
          res.end(JSON.stringify({ ok: false, error: 'Dev API crashed. Check the terminal.' }))
        }
      })
    },
  }
}

/** Emits robots.txt and sitemap.xml (pages + every project) at build time. */
function seoFiles() {
  return {
    name: 'seo-files',
    apply: 'build',
    async generateBundle() {
      const base = siteConfig.seo.siteUrl.replace(/\/$/, '')
      const { default: projects } = await import('./src/data/projects.json', { with: { type: 'json' } })
      const paths = ['/', '/projects', '/about', '/contact', ...projects.map((p) => `/projects/${p.slug}`)]
      const urls = paths.map((path) => `  <url><loc>${base}${path}</loc></url>`).join('\n')
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      })
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n` })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), htmlConfig(), seoFiles(), devApi(env)],
    build: {
      target: 'es2022',
      chunkSizeWarningLimit: 900,
      // Vendor groups: first-paint code (react, ui, motion) stays small; three
      // and r3f only load with the lazy WebGL scenes.
      // Groups pull in their dependencies, so shared code (React) must be
      // claimed first — higher priority wins.
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: 'three', test: /node_modules[\\/]three[\\/]/, priority: 55 },
              { name: 'r3f', test: /node_modules[\\/](@react-three|three-stdlib|troika|maath|meshline|camera-controls|zustand|its-fine|suspend-react|@monogrid|@use-gesture|hls\.js|stats)/, priority: 50 },
              { name: 'motion', test: /node_modules[\\/](gsap|@gsap|lenis)[\\/]/, priority: 60 },
              { name: 'ui', test: /node_modules[\\/](@headlessui|@floating-ui|@react-aria|tabbable|@tanstack)[\\/]/, priority: 60 },
              { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|cookie|set-cookie-parser)[\\/]/, priority: 70 },
            ],
          },
        },
      },
    },
  }
})
