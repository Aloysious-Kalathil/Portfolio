/**
 * Client for the serverless contact endpoint (api/verify-and-send.js).
 * Returns { ok: true } or throws an Error whose message is safe to show.
 */
const ENDPOINT = '/api/verify-and-send'
const TIMEOUT_MS = 15000

export async function sendContactMessage(payload) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
  } catch (error) {
    throw new Error(
      error.name === 'AbortError'
        ? 'The server took too long to answer. Please try again.'
        : 'Couldn’t reach the server. Check your connection and try again.',
    )
  } finally {
    clearTimeout(timer)
  }

  let data = {}
  try {
    data = await response.json()
  } catch {
    // Non-JSON (e.g. a static host with no function deployed)
  }

  if (!response.ok || !data.ok) {
    const fallback =
      response.status === 404
        ? 'The contact service isn’t deployed yet. Email me directly instead.'
        : 'Something went wrong sending your message. Please try again.'
    const error = new Error(data.error || fallback)
    error.fields = data.fields
    throw error
  }
  return data
}

/** Load the reCAPTCHA v3 script once, resolve with window.grecaptcha. */
let recaptchaPromise
export function loadRecaptcha(siteKey) {
  if (!siteKey) return Promise.resolve(null)
  if (recaptchaPromise) return recaptchaPromise
  recaptchaPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`
    script.async = true
    script.defer = true
    script.onload = () => window.grecaptcha.ready(() => resolve(window.grecaptcha))
    script.onerror = () => {
      recaptchaPromise = null
      reject(new Error('reCAPTCHA failed to load'))
    }
    document.head.appendChild(script)
  })
  return recaptchaPromise
}

export async function getRecaptchaToken(siteKey, action = 'contact') {
  const grecaptcha = await loadRecaptcha(siteKey)
  if (!grecaptcha) return null
  return grecaptcha.execute(siteKey, { action })
}
