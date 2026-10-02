/**
 * Single place where GSAP plugins are registered and motion defaults are set.
 * Import gsap / ScrollTrigger / SplitText from here, never from 'gsap' directly,
 * so registration always happens first.
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)

/** House easing. Entrances decelerate hard (expo.out); things that cover and
 *  uncover the screen accelerate then brake (power4.inOut). Nothing bounces. */
export const EASE = {
  out: 'expo.out',
  inOut: 'power4.inOut',
  soft: 'power3.out',
  in: 'power3.in',
}

export const DURATION = {
  fast: 0.5,
  base: 0.9,
  slow: 1.3,
}

gsap.defaults({ ease: EASE.out, duration: DURATION.base })

ScrollTrigger.config({
  // Mobile URL-bar show/hide shouldn't trigger a full refresh
  ignoreMobileResize: true,
})

/** Default start for scroll reveals: when the element's top passes 88% of
 *  the viewport height. */
export const REVEAL_START = 'top 88%'

export { gsap, ScrollTrigger, SplitText, useGSAP }
