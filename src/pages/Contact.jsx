import { useEffect, useId, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { ArrowUpRightIcon, CheckIcon, ExclamationCircleIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import siteConfig from '../config/siteConfig'
import Seo from '../components/ui/Seo'
import Button from '../components/ui/Button'
import SplitTextReveal from '../components/animations/SplitTextReveal'
import ScrollFade from '../components/animations/ScrollFade'
import { LocalTime } from '../components/layout/Footer'
import { sendContactMessage, loadRecaptcha, getRecaptchaToken } from '../utils/api'
import { gsap, EASE } from '../utils/gsapSetup'

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY
const MESSAGE_MAX = 5000
const EMPTY = { name: '', email: '', subject: '', timeline: '', message: '', company: '' }
const PROMPT = 'text-[clamp(1.0625rem,1.45vw,1.375rem)] font-medium leading-[1.3] tracking-[-0.01em] text-accent-ink'

/** Returns an error string per invalid field (same rules as the server). */
function validate(values) {
  const errors = {}
  if (values.name.trim().length < 2) errors.name = 'Tell me what to call you.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) errors.email = 'That email doesn’t look complete — check for a typo.'
  if (values.subject.trim().length < 3) errors.subject = 'Pick the one that fits best.'
  if (values.message.trim().length < 20) errors.message = 'A little more detail, please — at least 20 characters.'
  if (values.message.length > MESSAGE_MAX) errors.message = `Please keep it under ${MESSAGE_MAX} characters.`
  return errors
}

function Field({ name, label, error, hint, as = 'input', value, onChange, onBlur, ...rest }) {
  const id = useId()
  const Tag = as
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="label !text-fg/70">
          {label}
        </label>
        {hint && (
          <span id={`${id}-hint`} className="label tabular">
            {hint}
          </span>
        )}
      </div>
      <Tag
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={`field ${as === 'textarea' ? 'min-h-[9rem] resize-y' : ''}`}
        data-cursor="none"
        {...rest}
      />
      <p id={`${id}-error`} className={`mt-2 flex items-center gap-2 text-sm text-accent-ink ${error ? '' : 'hidden'}`} role={error ? 'alert' : undefined}>
        <ExclamationCircleIcon className="size-4 shrink-0" aria-hidden="true" />
        {error}
      </p>
    </div>
  )
}

/** A question answered by picking one pill (a radio group). */
function PillGroup({ name, legend, options, value, onChange, error, disabled }) {
  const id = useId()
  return (
    <div
      role="radiogroup"
      aria-labelledby={`${id}-legend`}
      aria-describedby={error ? `${id}-error` : undefined}
      aria-invalid={error ? 'true' : undefined}
    >
      <p id={`${id}-legend`} className={`${PROMPT} mb-4`}>
        {legend}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const checked = value === option
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={checked}
              disabled={disabled}
              onClick={() => onChange({ target: { name, value: checked ? '' : option } })}
              className={`pill pill-lg ${checked ? '' : 'pill-ghost'}`}
            >
              {option}
            </button>
          )
        })}
      </div>
      <p id={`${id}-error`} className={`mt-3 flex items-center gap-2 text-sm text-accent-ink ${error ? '' : 'hidden'}`} role={error ? 'alert' : undefined}>
        <ExclamationCircleIcon className="size-4 shrink-0" aria-hidden="true" />
        {error}
      </p>
    </div>
  )
}

function Success({ name, onReset }) {
  const ref = useRef(null)
  useEffect(() => {
    ref.current?.focus()
    const tween = gsap.fromTo(ref.current, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1, ease: EASE.out })
    return () => tween.kill()
  }, [])
  return (
    <div ref={ref} tabIndex={-1} className="border-t border-line pt-10 outline-none" role="status">
      <span className="grid size-12 place-items-center rounded-full bg-accent text-[rgb(var(--accent-contrast))]">
        <CheckIcon className="size-6" aria-hidden="true" />
      </span>
      <p className="display mt-8 text-display-sm">Thanks{name ? `, ${name.split(' ')[0]}` : ''}. It’s in my inbox.</p>
      <p className="mt-4 max-w-prose text-muted">
        I read everything myself and reply within two working days. If it’s urgent, email{' '}
        <a href={`mailto:${siteConfig.email}`} className="link-draw text-fg">
          {siteConfig.email}
        </a>
        .
      </p>
      <div className="mt-10">
        <Button onClick={onReset} variant="outline" icon={null}>
          Send another message
        </Button>
      </div>
    </div>
  )
}

export default function Contact() {
  const [values, setValues] = useState(EMPTY)
  const [touched, setTouched] = useState({})
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [serverError, setServerError] = useState('')
  const [sentName, setSentName] = useState('')
  const formRef = useRef(null)

  // Load reCAPTCHA only on this page, and only once
  useEffect(() => {
    loadRecaptcha(SITE_KEY).catch(() => {})
  }, [])

  const update = (event) => {
    const { name, value } = event.target
    const next = { ...values, [name]: value }
    setValues(next)
    // Re-validate live only once a field has been visited
    if (touched[name] || name === 'subject') setErrors((prev) => ({ ...prev, [name]: validate(next)[name] }))
    if (status === 'error') setStatus('idle')
  }

  const blur = (event) => {
    const { name } = event.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    setErrors((prev) => ({ ...prev, [name]: validate(values)[name] }))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (status === 'loading') return
    const found = validate(values)
    // Commit synchronously so the first invalid field can take focus
    flushSync(() => {
      setErrors(found)
      setTouched({ name: true, email: true, subject: true, message: true })
    })
    if (Object.keys(found).length) {
      const invalid = formRef.current.querySelector('[aria-invalid="true"]')
      const target = invalid?.matches('[role="radiogroup"]') ? invalid.querySelector('button') : invalid
      target?.focus()
      return
    }

    setStatus('loading')
    setServerError('')
    try {
      const token = await getRecaptchaToken(SITE_KEY, 'contact').catch(() => {
        throw new Error('Spam protection didn’t load. Disable any blocker for this page, or email me directly.')
      })
      const { timeline, ...fields } = values
      const message = timeline ? `${fields.message.trim()}\n\nTiming: ${timeline}` : fields.message
      await sendContactMessage({ ...fields, message, token })
      setSentName(values.name.trim())
      setValues(EMPTY)
      setTouched({})
      setStatus('success')
    } catch (error) {
      if (error.fields) setErrors(error.fields)
      setServerError(error.message)
      setStatus('error')
    }
  }

  const reset = () => {
    setStatus('idle')
    setErrors({})
  }

  const { contact } = siteConfig
  const loading = status === 'loading'

  return (
    <>
      <Seo title="Contact" description={`Start a project with ${siteConfig.name}. ${contact.lede}`} />

      <section className="frame pb-section pt-[calc(var(--margin)+9rem)]">
        <SplitTextReveal as="h1" trigger="load" className="display text-display-xl">
          Let’s talk
        </SplitTextReveal>

        <div className="grid-layout mt-14 gap-y-16 md:mt-20">
          {/* Direct details */}
          <ScrollFade trigger="load" delay={0.4} className="col-span-4 space-y-10 md:col-span-8 lg:col-span-4">
            <p className="max-w-sm text-lede text-balance">{contact.heading}</p>
            <p className="max-w-sm text-muted">{contact.lede}</p>
            <div className={PROMPT}>
              <p>
                Say<span className="pl-[1.4em]">hello:</span>
              </p>
              <a href={`mailto:${siteConfig.email}`} className="mt-2 inline-flex items-baseline gap-2 text-fg">
                <ArrowUpRightIcon aria-hidden="true" className="size-[0.62em] shrink-0 stroke-[2.5] text-accent-ink" />
                <span className="link-draw break-all">{siteConfig.email}</span>
              </a>
            </div>
            <div className={PROMPT}>
              <p>
                Based<span className="pl-[1.4em]">in:</span>
              </p>
              <p className="mt-2 text-fg">
                {siteConfig.location.city}, {siteConfig.location.country} — <LocalTime />
              </p>
            </div>
            {siteConfig.availability && (
              <p className="flex max-w-sm items-baseline gap-2 text-muted">
                <span aria-hidden="true" className="size-1.5 shrink-0 -translate-y-0.5 rounded-full bg-accent" />
                {siteConfig.availability}
              </p>
            )}
          </ScrollFade>

          {/* Form */}
          <div className="col-span-4 md:col-span-8 lg:col-span-7 lg:col-start-6">
            {status === 'success' ? (
              <Success name={sentName} onReset={reset} />
            ) : (
              <ScrollFade trigger="load" delay={0.55}>
                <form ref={formRef} onSubmit={submit} noValidate aria-busy={loading} className="space-y-14">
                  <PillGroup
                    name="subject"
                    legend="I’m writing about:"
                    options={contact.topics}
                    value={values.subject}
                    onChange={update}
                    error={errors.subject}
                    disabled={loading}
                  />
                  <PillGroup
                    name="timeline"
                    legend="It needs to happen:"
                    options={contact.timelines}
                    value={values.timeline}
                    onChange={update}
                    disabled={loading}
                  />
                  <div>
                    <p className={`${PROMPT} mb-2`}>A few more details:</p>
                    <Field
                      as="textarea"
                      name="message"
                      label="Message"
                      rows={5}
                      hint={`${values.message.length} / ${MESSAGE_MAX}`}
                      placeholder="The project, the timeline, what a good outcome looks like…"
                      value={values.message}
                      onChange={update}
                      onBlur={blur}
                      error={errors.message}
                      disabled={loading}
                      maxLength={MESSAGE_MAX + 200}
                      required
                    />
                  </div>
                  <div>
                    <p className={`${PROMPT} mb-2`}>And you are:</p>
                    <div className="grid gap-10 md:grid-cols-2 md:gap-gutter">
                      <Field
                        name="name"
                        label="Your name"
                        autoComplete="name"
                        value={values.name}
                        onChange={update}
                        onBlur={blur}
                        error={errors.name}
                        disabled={loading}
                        required
                      />
                      <Field
                        name="email"
                        label="Email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        value={values.email}
                        onChange={update}
                        onBlur={blur}
                        error={errors.email}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  {/* Honeypot: invisible to people, tempting to bots */}
                  <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                    <label>
                      Company
                      <input name="company" tabIndex={-1} autoComplete="off" value={values.company} onChange={update} />
                    </label>
                  </div>

                  {status === 'error' && (
                    <div role="alert" className="flex items-start gap-3 border border-accent-ink/50 p-4 text-sm">
                      <ExclamationCircleIcon className="size-5 shrink-0 text-accent-ink" aria-hidden="true" />
                      <p>
                        {serverError}{' '}
                        <a href={`mailto:${siteConfig.email}`} className="link-draw font-medium">
                          Email instead
                        </a>
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col-reverse gap-6 border-t border-line pt-8 md:flex-row md:items-center md:justify-between">
                    <p className="max-w-sm text-xs text-muted">
                      Protected by reCAPTCHA — Google’s{' '}
                      <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-fg">
                        Privacy Policy
                      </a>{' '}
                      and{' '}
                      <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-fg">
                        Terms
                      </a>{' '}
                      apply.
                      {!SITE_KEY && import.meta.env.DEV && (
                        <span className="mt-2 block text-accent-ink">Dev note: VITE_RECAPTCHA_SITE_KEY is not set, so the server will reject submissions.</span>
                      )}
                    </p>
                    <Button type="submit" size="lg" loading={loading} icon={PaperAirplaneIcon}>
                      {loading ? 'Sending…' : 'Send message'}
                    </Button>
                  </div>
                </form>
              </ScrollFade>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
