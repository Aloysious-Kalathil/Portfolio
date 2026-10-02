/** Design tokens. Colours resolve to CSS variables (src/styles/variables.css)
 *  so the theme toggle and the accent in siteConfig.js work at runtime. */
const color = (name) => `rgb(var(--${name}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1600px',
    },
    extend: {
      colors: {
        bg: color('bg'),
        fg: color('fg'),
        muted: color('muted'),
        accent: color('accent'),
        'accent-ink': color('accent-ink'),
        line: 'rgb(var(--fg) / 0.14)',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      // Fluid type scale — display sizes lean on viewport width.
      fontSize: {
        label: ['0.6875rem', { lineHeight: '1.2', letterSpacing: '0.08em' }],
        'display-xl': ['clamp(3.75rem, 16.5vw, 19rem)', { lineHeight: '0.8', letterSpacing: '-0.055em' }],
        'display-lg': ['clamp(3rem, 9vw, 9.5rem)', { lineHeight: '0.88', letterSpacing: '-0.045em' }],
        'display-md': ['clamp(2.25rem, 5.4vw, 5.5rem)', { lineHeight: '0.94', letterSpacing: '-0.04em' }],
        'display-sm': ['clamp(1.625rem, 3vw, 2.75rem)', { lineHeight: '1.04', letterSpacing: '-0.03em' }],
        lede: ['clamp(1.1875rem, 1.9vw, 1.625rem)', { lineHeight: '1.38', letterSpacing: '-0.012em' }],
      },
      spacing: {
        margin: 'var(--margin)',
        gutter: 'var(--gutter)',
        header: 'var(--header-h)',
        section: 'var(--section-y)',
      },
      maxWidth: {
        prose: '36rem',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-quart': 'cubic-bezier(0.76, 0, 0.24, 1)',
      },
      transitionDuration: {
        400: '400ms',
        600: '600ms',
        800: '800ms',
      },
      zIndex: {
        grid: '1',
        rail: '40',
        header: '50',
        menu: '60',
        modal: '70',
        transition: '80',
        preloader: '90',
        cursor: '100',
      },
    },
  },
  plugins: [],
}
