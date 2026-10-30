'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import type { FormType } from '@/lib/forms/schema'

import { SiteForm } from './SiteForm'

const choices = ['contact', 'quote-home', 'partnership'] as const satisfies FormType[]
type Choice = (typeof choices)[number]

// Links open a form directly: /contact?type=quote&service=<key>, /contact?type=partnership
// (or the same as a hash, #quote / #partnership).
const fromLink: Record<string, Choice> = { quote: 'quote-home', partnership: 'partnership' }

export type ServiceOption = { key: string; title: string }

/**
 * The three contact forms of FR-PG-13 behind one radio group: a question, a quote, a
 * partnership. The page is pre-rendered, so the browser reads the link's query or hash.
 */
export function ContactForms({ services }: { services: ServiceOption[] }) {
  const t = useTranslations('contactPage.chooser')
  const [choice, setChoice] = useState<Choice>('contact')
  const [service, setService] = useState<string>()

  useEffect(() => {
    const pick = () => {
      const query = new URLSearchParams(window.location.search)
      const linked = fromLink[query.get('type') ?? window.location.hash.slice(1)]
      if (linked) setChoice(linked)
      const key = query.get('service')
      setService(services.find((option) => option.key === key)?.title)
    }
    pick()
    window.addEventListener('hashchange', pick)
    return () => window.removeEventListener('hashchange', pick)
  }, [services])

  return (
    <div id="quote" className="scroll-mt-28">
      <fieldset>
        <legend className="mb-4 font-display text-xl font-semibold text-teal-700">
          {t('legend')}
        </legend>
        <div className="flex flex-wrap gap-2">
          {choices.map((value) => (
            <label
              key={value}
              className="cursor-pointer rounded-full border border-teal-600/30 px-5 py-2.5 text-sm font-semibold text-teal-700 transition-colors has-checked:border-teal-600 has-checked:bg-teal-600 has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-teal-400"
            >
              <input
                type="radio"
                name="contact-form"
                value={value}
                checked={choice === value}
                onChange={() => setChoice(value)}
                className="sr-only"
              />
              {t(value)}
            </label>
          ))}
        </div>
      </fieldset>
      {/* Keyed, so switching starts a fresh form (its own token and errors). */}
      <SiteForm
        key={`${choice}-${service ?? ''}`}
        type={choice}
        services={choice === 'quote-home' ? services.map(({ title }) => title) : undefined}
        defaultService={service}
        className="mt-6"
      />
    </div>
  )
}
