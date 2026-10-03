/**
 * One colour shared by the cursor, the background mesh and the hero markers.
 * It starts at the accent (lime) and its hue drifts as the pointer travels and
 * the page scrolls, so everything you touch shifts colour together.
 */
const BASE_HUE = 75
const HUE_PER_PX_MOVED = 0.035
const HUE_PER_PX_SCROLLED = 0.02

let travel = 0
let last = null
let tracking = false

function track() {
  if (tracking || typeof window === 'undefined') return
  tracking = true
  window.addEventListener(
    'pointermove',
    (e) => {
      if (last) travel += Math.hypot(e.clientX - last.x, e.clientY - last.y)
      last = { x: e.clientX, y: e.clientY }
    },
    { passive: true },
  )
}

/** Current hue in degrees, 0–360. */
export function liveHue() {
  track()
  return (BASE_HUE + travel * HUE_PER_PX_MOVED + window.scrollY * HUE_PER_PX_SCROLLED) % 360
}

/** Saturation and lightness tuned per theme: bright on dark, deep on light
 *  (so it keeps contrast against the pale background). */
export function liveTone(theme = document.documentElement.dataset.theme) {
  return theme === 'light' ? { s: 0.85, l: 0.36 } : { s: 0.9, l: 0.62 }
}

/** CSS colour string for the current live colour. */
export function liveColorCss(theme) {
  const { s, l } = liveTone(theme)
  return `hsl(${liveHue().toFixed(1)} ${s * 100}% ${l * 100}%)`
}

/** Writes the live colour into a three.js Color. */
export function setLiveColor(color, theme) {
  const { s, l } = liveTone(theme)
  return color.setHSL(liveHue() / 360, s, l)
}
