'use client'

import { CheckCircle2, Loader2, Send } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import React, { useEffect, useId, useRef, useState } from 'react'

import { buttonClasses } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { track } from '@/lib/analytics'
import {
  checkCv,
  cvAccept,
  formFields,
  isRequired,
  validateForm,
  type FormType,
} from '@/lib/forms/schema'

type Props = {
  type: FormType
  // Job form: the role applied for (none = open application).
  job?: number
  // Quote forms: service titles for the "service" select.
  services?: string[]
  // Preselected service (a title from `services`).
  defaultService?: string
  className?: string
}

type Status = 'idle' | 'sending' | 'sent'

const events: Record<FormType, [string, Record<string, string>]> = {
  contact: ['quote_submit', { type: 'contact' }],
  'quote-home': ['quote_submit', { type: 'home' }],
  'quote-business': ['quote_submit', { type: 'business' }],
  partnership: ['quote_submit', { type: 'partnership' }],
  pro: ['pro_apply', {}],
  job: ['job_apply', {}],
}

const autoComplete: Record<string, string> = {
  name: 'name',
  email: 'email',
  phone: 'tel',
  city: 'address-level2',
  company: 'organization',
}

const fetchToken = () =>
  fetch('/api/forms/token', { cache: 'no-store' })
    .then((response) => response.json() as Promise<{ token: string }>)
    .then(({ token }) => token)
    .catch(() => '')

// Campaign tags of the landing URL travel with the submission (FR-ANA-03).
const readUtm = () =>
  Object.fromEntries(
    [...new URLSearchParams(window.location.search)].filter(([key]) => key.startsWith('utm_')),
  )

const inputClasses =
  'block w-full rounded-xl border border-mist-200 bg-white px-4 py-3 text-ink placeholder:text-slate-500/70 aria-[invalid=true]:border-danger'

/**
 * One site form (FR-FORM-01..05, ADR-023): native fields, the shared zod schema in the browser
 * and on the server, errors announced through a live region and linked to each field, and a
 * success message that takes focus. Hidden honeypot + time token against bots (FR-FORM-03).
 */
export function SiteForm({ type, job, services = [], defaultService, className = '' }: Props) {
  const t = useTranslations('forms')
  const locale = useLocale()
  const id = useId()
  const [token, setToken] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [failure, setFailure] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const successRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let live = true
    void fetchToken().then((value) => live && setToken(value))
    return () => {
      live = false
    }
  }, [])

  useEffect(() => {
    if (status === 'sent') successRef.current?.focus()
  }, [status])

  const order = [...formFields[type], ...(type === 'job' ? ['cv'] : []), 'consent']
  const label = (field: string) =>
    t.has(`labels.${type}.${field}`) ? t(`labels.${type}.${field}`) : t(`fields.${field}`)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const values: Record<string, string> = {}
    for (const [key, value] of data.entries()) if (typeof value === 'string') values[key] = value

    const result = validateForm(type, values)
    const found: Record<string, string> = result.ok ? {} : { ...result.errors }
    if (type === 'job') {
      const file = data.get('cv')
      const problem = checkCv(file instanceof File ? file : null)
      if (problem) found.cv = problem
    }
    setFailure(null)
    if (Object.keys(found).length) {
      setErrors(found)
      const first = order.find((field) => found[field])
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }

    setErrors({})
    setStatus('sending')
    data.set('token', token || (await fetchToken()))
    data.set('locale', locale)
    data.set('utm', JSON.stringify(readUtm()))
    if (job) data.set('job', String(job))

    try {
      const response = await fetch(`/api/forms/${type}`, { method: 'POST', body: data })
      const body = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        errors?: Record<string, string>
      }
      if (response.ok && body.ok) {
        setStatus('sent')
        track(...events[type])
        return
      }
      setStatus('idle')
      if (body.errors) setErrors(body.errors)
      setFailure(body.error ?? (body.errors ? null : 'server'))
      // A stale or early token: take a fresh one, so the next try goes through.
      if (body.error === 'expired' || body.error === 'tooFast') setToken(await fetchToken())
    } catch {
      setStatus('idle')
      setFailure('network')
    }
  }

  if (status === 'sent') {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className={`rounded-panel bg-white p-8 text-center ring-1 ring-mist-200 ${className}`}
      >
        <CheckCircle2 aria-hidden className="mx-auto size-12 text-teal-600" />
        <p className="mt-4 font-display text-2xl font-semibold text-teal-700">
          {t('success.title')}
        </p>
        <p className="mt-2 text-slate-500">
          {t.has(`success.${type}`) ? t(`success.${type}`) : t('success.body')}
        </p>
      </div>
    )
  }

  const errorCount = Object.keys(errors).length
  const field = (name: string) => {
    const inputId = `${id}-${name}`
    const errorId = `${inputId}-error`
    const required = name === 'cv' || isRequired(type, name)
    const common = {
      id: inputId,
      name,
      'aria-invalid': errors[name] ? true : undefined,
      'aria-describedby':
        [name === 'cv' ? `${inputId}-hint` : '', errors[name] ? errorId : '']
          .filter(Boolean)
          .join(' ') || undefined,
      'aria-required': required || undefined,
    }
    const wide = name === 'message' || name === 'skills' || name === 'subject' || name === 'cv'

    let control: React.ReactNode
    if (name === 'message') {
      control = <textarea {...common} rows={5} maxLength={4000} className={inputClasses} />
    } else if (name === 'service') {
      control = (
        <select {...common} className={inputClasses} defaultValue={defaultService ?? ''}>
          <option value="">{t('serviceAny')}</option>
          {services.map((service) => (
            <option key={service} value={service}>
              {service}
            </option>
          ))}
        </select>
      )
    } else if (name === 'cv') {
      control = (
        <input
          {...common}
          type="file"
          accept={cvAccept}
          className={`${inputClasses} file:mr-4 file:rounded-full file:border-0 file:bg-mist-100 file:px-4 file:py-2 file:font-semibold file:text-teal-700`}
        />
      )
    } else {
      control = (
        <input
          {...common}
          type={name === 'email' ? 'email' : name === 'phone' ? 'tel' : 'text'}
          autoComplete={autoComplete[name]}
          inputMode={name === 'phone' ? 'tel' : undefined}
          className={inputClasses}
        />
      )
    }

    return (
      <div key={name} className={wide ? 'sm:col-span-2' : undefined}>
        <label htmlFor={inputId} className="mb-2 block text-sm font-semibold text-teal-700">
          {label(name)}
          {required ? (
            <span className="text-danger" aria-hidden>
              {' '}
              *
            </span>
          ) : (
            <span className="font-normal text-slate-500"> ({t('optional')})</span>
          )}
        </label>
        {name === 'cv' ? (
          <p id={`${inputId}-hint`} className="mb-2 text-sm text-slate-500">
            {t('cvHint')}
          </p>
        ) : null}
        {control}
        {errors[name] ? (
          <p id={errorId} className="mt-2 text-sm font-medium text-danger">
            {t(`errors.${errors[name]}`)}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-busy={status === 'sending'}
      className={`rounded-panel bg-white p-6 ring-1 ring-mist-200 sm:p-8 ${className}`}
    >
      <div aria-live="assertive" className="empty:hidden mb-6">
        {errorCount || failure ? (
          <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            {failure ? t(`errors.${failure}`) : t('errors.summary', { count: errorCount })}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {order.filter((n) => n !== 'consent').map(field)}
      </div>

      {/* Honeypot: hidden from people and assistive tech, filled by naive bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-website`}>{t('honeypot')}</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-6">
        <div className="flex items-start gap-3">
          <input
            id={`${id}-consent`}
            name="consent"
            type="checkbox"
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? `${id}-consent-error` : undefined}
            className="mt-1 size-5 shrink-0 accent-teal-600"
          />
          <label htmlFor={`${id}-consent`} className="text-sm text-slate-500">
            {t.rich('consent', {
              link: (chunks) => (
                <Link
                  href="/legal/privacy"
                  className="font-semibold text-teal-600 underline underline-offset-4"
                >
                  {chunks}
                </Link>
              ),
            })}
          </label>
        </div>
        {errors.consent ? (
          <p id={`${id}-consent-error`} className="mt-2 text-sm font-medium text-danger">
            {t(`errors.${errors.consent}`)}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={status === 'sending'}
        className={buttonClasses({
          variant: 'solid',
          size: 'lg',
          className: 'mt-8 w-full sm:w-auto',
        })}
      >
        {status === 'sending' ? (
          <Loader2 aria-hidden className="size-5 animate-spin" />
        ) : (
          <Send aria-hidden className="size-5" />
        )}
        {status === 'sending'
          ? t('sending')
          : t.has(`submit.${type}`)
            ? t(`submit.${type}`)
            : t('submit.default')}
      </button>
    </form>
  )
}
