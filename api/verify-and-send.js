/**
 * POST /api/verify-and-send
 *
 * 1. Validates the contact form payload (same rules as the browser)
 * 2. Verifies the reCAPTCHA v3 token with Google and rejects low scores
 * 3. Sends the message to you with Resend (https://resend.com)
 *
 * Written against the web-standard Request/Response API, so the same file runs:
 *  - on Vercel as a Node.js function (named POST export)
 *  - on Netlify through netlify/functions/verify-and-send.mjs
 *  - locally inside `npm run dev` (see the dev-api plugin in vite.config.js)
 *
 * Env (server only — never prefixed with VITE_):
 *   RECAPTCHA_SECRET_KEY, RECAPTCHA_MIN_SCORE (default 0.5),
 *   RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL
 */

const MESSAGE_MAX = 5000

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

function validate(v) {
  const fields = {}
  const str = (x) => (typeof x === 'string' ? x.trim() : '')
  const name = str(v.name)
  const email = str(v.email)
  const subject = str(v.subject)
  const message = str(v.message)
  if (name.length < 2 || name.length > 120) fields.name = 'Tell me what to call you.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) fields.email = 'That email doesn’t look complete.'
  if (subject.length < 3 || subject.length > 200) fields.subject = 'A few words on what this is about.'
  if (message.length < 20) fields.message = 'A little more detail, please — at least 20 characters.'
  if (message.length > MESSAGE_MAX) fields.message = `Please keep it under ${MESSAGE_MAX} characters.`
  return { fields, clean: { name, email, subject, message } }
}

async function verifyRecaptcha(token, secret, ip) {
  const body = new URLSearchParams({ secret, response: token })
  if (ip) body.set('remoteip', ip)
  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', { method: 'POST', body })
  if (!res.ok) throw new Error(`siteverify HTTP ${res.status}`)
  return res.json() // { success, score, action, hostname, 'error-codes' }
}

async function sendEmail({ apiKey, from, to, data, meta }) {
  const { name, email, subject, message } = data
  const text = `${message}\n\n— ${name} <${email}>\nreCAPTCHA score: ${meta.score}`
  const html = `
    <div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.55;color:#111">
      <p style="white-space:pre-wrap;margin:0 0 24px">${escapeHtml(message)}</p>
      <p style="margin:0;color:#555">— ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
      <p style="margin:8px 0 0;color:#999;font-size:12px">Sent from your portfolio · reCAPTCHA score ${meta.score}</p>
    </div>`
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: to.split(',').map((s) => s.trim()),
      reply_to: email,
      subject: `Portfolio — ${subject}`,
      text,
      html,
    }),
  })
  if (!res.ok) throw new Error(`Resend HTTP ${res.status}: ${await res.text()}`)
}

export async function POST(request) {
  const env = process.env
  const secret = env.RECAPTCHA_SECRET_KEY
  const apiKey = env.RESEND_API_KEY
  const to = env.CONTACT_TO_EMAIL
  const from = env.CONTACT_FROM_EMAIL || 'Portfolio <onboarding@resend.dev>'
  const minScore = Number(env.RECAPTCHA_MIN_SCORE ?? 0.5)

  if (!secret || !apiKey || !to) {
    console.error('[contact] Missing env: RECAPTCHA_SECRET_KEY, RESEND_API_KEY or CONTACT_TO_EMAIL')
    return json(500, { ok: false, error: 'The contact form isn’t configured yet. Please email me directly.' })
  }

  let payload
  try {
    payload = await request.json()
  } catch {
    return json(400, { ok: false, error: 'The request was malformed. Please try again.' })
  }

  // Honeypot filled in → almost certainly a bot. Pretend it worked.
  if (payload.company) return json(200, { ok: true })

  const { fields, clean } = validate(payload)
  if (Object.keys(fields).length) {
    return json(422, { ok: false, error: 'Some fields need another look.', fields })
  }

  if (typeof payload.token !== 'string' || !payload.token) {
    return json(400, { ok: false, error: 'Spam protection didn’t run. Reload the page and try again.' })
  }

  let verdict
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    verdict = await verifyRecaptcha(payload.token, secret, ip)
  } catch (error) {
    console.error('[contact] reCAPTCHA verification failed', error)
    return json(502, { ok: false, error: 'Couldn’t verify the request right now. Please try again in a minute.' })
  }

  if (!verdict.success || verdict.action !== 'contact' || typeof verdict.score !== 'number' || verdict.score < minScore) {
    console.warn('[contact] Rejected by reCAPTCHA', { score: verdict.score, action: verdict.action, errors: verdict['error-codes'] })
    return json(403, {
      ok: false,
      error: 'Your message was flagged as automated. If that’s wrong, please email me directly.',
    })
  }

  try {
    await sendEmail({ apiKey, from, to, data: clean, meta: { score: verdict.score } })
  } catch (error) {
    console.error('[contact] Email send failed', error)
    return json(502, { ok: false, error: 'The message couldn’t be delivered. Please try again, or email me directly.' })
  }

  return json(200, { ok: true })
}

export function GET() {
  return json(405, { ok: false, error: 'Use POST.' })
}
