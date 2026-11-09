'use client'

import { useEffect, useId, useRef, useState } from 'react'

import { buttonClasses } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { openEvent, storedConsent, type Consent } from '@/lib/analytics'

import { setConsent } from './ga'

export type BannerProps = {
  gaId: string
  // Opened from the footer's "Cookie settings": details shown and focus moved to the banner.
  reopen?: boolean
  labels: {
    label: string
    title: string
    body: string
    accept: string
    reject: string
    customise: string
    save: string
    necessary: string
    necessaryBody: string
    analytics: string
    analyticsBody: string
    privacy: string
  }
}

// Bilingual, non-blocking banner (FR-ANA-01): a region at the bottom of the screen, not a modal,
// so the page stays usable. Accept and Reject carry equal weight. The footer's "Cookie settings"
// reopens it with the details shown and focus moved to it.
export function ConsentBanner({ gaId, labels, reopen = false }: BannerProps) {
  const [open, setOpen] = useState(() => reopen || storedConsent() === null)
  const [details, setDetails] = useState(reopen)
  const [analytics, setAnalytics] = useState(() => storedConsent() === 'granted')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const reopened = useRef(reopen)
  const id = useId()

  useEffect(() => {
    const reopen = () => {
      reopened.current = true
      setAnalytics(storedConsent() === 'granted')
      setDetails(true)
      setOpen(true)
    }
    window.addEventListener(openEvent, reopen)
    return () => window.removeEventListener(openEvent, reopen)
  }, [])

  useEffect(() => {
    if (open && reopened.current) headingRef.current?.focus()
  }, [open])

  if (!open) return null

  const choose = (choice: Consent) => {
    setConsent(choice, gaId)
    setOpen(false)
    reopened.current = false
  }

  return (
    <section
      aria-label={labels.label}
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-panel bg-night-900 p-5 text-white shadow-float ring-1 ring-white/10 sm:inset-x-6 sm:bottom-6 sm:p-6"
    >
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-lg font-semibold outline-none"
      >
        {labels.title}
      </h2>
      <p className="mt-2 text-sm text-white/80">
        {labels.body}{' '}
        <Link
          href="/legal/privacy"
          className="font-semibold text-white underline underline-offset-4"
        >
          {labels.privacy}
        </Link>
      </p>

      {details ? (
        <fieldset className="mt-4 space-y-3 text-sm">
          <legend className="sr-only">{labels.customise}</legend>
          <div className="flex items-start gap-3">
            <input
              id={`${id}-necessary`}
              type="checkbox"
              checked
              disabled
              className="mt-1 size-4 accent-gold-500"
            />
            <label htmlFor={`${id}-necessary`}>
              <span className="font-semibold">{labels.necessary}</span>
              <span className="block text-white/70">{labels.necessaryBody}</span>
            </label>
          </div>
          <div className="flex items-start gap-3">
            <input
              id={`${id}-analytics`}
              type="checkbox"
              checked={analytics}
              onChange={(event) => setAnalytics(event.target.checked)}
              className="mt-1 size-4 accent-gold-500"
            />
            <label htmlFor={`${id}-analytics`}>
              <span className="font-semibold">{labels.analytics}</span>
              <span className="block text-white/70">{labels.analyticsBody}</span>
            </label>
          </div>
        </fieldset>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => choose('granted')}
          className={buttonClasses({ size: 'sm' })}
        >
          {labels.accept}
        </button>
        <button
          type="button"
          onClick={() => choose('denied')}
          className={buttonClasses({ variant: 'secondary', size: 'sm' })}
        >
          {labels.reject}
        </button>
        {details ? (
          <button
            type="button"
            onClick={() => choose(analytics ? 'granted' : 'denied')}
            className={buttonClasses({ variant: 'secondary', size: 'sm' })}
          >
            {labels.save}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setDetails(true)}
            aria-expanded={false}
            className={buttonClasses({
              variant: 'ghost',
              size: 'sm',
              className: 'px-2 underline underline-offset-4',
            })}
          >
            {labels.customise}
          </button>
        )}
      </div>
    </section>
  )
}
