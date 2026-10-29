'use client'

import { ArrowLeft, ArrowUpRight, BadgeCheck, CircleCheck, RotateCcw, Star } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

import { Phone } from '@/components/device/Phone'
import { track } from '@/lib/analytics'
import { services, type ServiceKey } from '@/lib/services'

export type DemoLabels = {
  label: string
  question: string
  prosTitle: string
  back: string
  verified: string
  jobs: string
  // Contains "{service}", replaced here: the client has no message formatter.
  bookTitle: string
  when: string
  slots: { today: string; tomorrow: string; weekend: string }
  payWith: string
  priceNote: string
  confirm: string
  doneTitle: string
  doneBody: string
  cta: string
  restart: string
}

export type DemoProps = {
  labels: DemoLabels
  // Short service names by key, in the page's language.
  serviceNames: Record<ServiceKey, string>
  locale: string
  appUrl: string
}

type Step = 'categories' | 'pros' | 'booking' | 'done'

// Sample data in the shape of the app's pros list (PLAN.md §5.9); the section intro says so.
const pros = [
  { initials: 'SK', name: 'Serge K.', rating: 4.9, jobs: 128 },
  { initials: 'AM', name: 'Aïcha M.', rating: 4.8, jobs: 86 },
  { initials: 'PN', name: 'Paul N.', rating: 4.7, jobs: 54 },
]
const slots = ['today', 'tomorrow', 'weekend'] as const
const payments = ['MTN MoMo', 'Orange Money'] as const
const tiles = services.slice(0, 9)

const option =
  'rounded-full px-3 py-1.5 text-[11px] font-medium ring-1 transition-colors aria-pressed:bg-teal-600 aria-pressed:text-white aria-pressed:ring-teal-600'

/**
 * Tappable app demo (FR-HOME-09): category → pros → booking sheet → done. Real buttons inside a
 * labelled group, so it works from the keyboard and with a screen reader; each new screen moves
 * focus to its heading, which announces it. Fires `demo_interact {step}` on every step.
 */
export function DemoPhone({ labels, serviceNames, locale, appUrl }: DemoProps) {
  const [step, setStep] = useState<Step>('categories')
  const [service, setService] = useState<ServiceKey>(tiles[0].key)
  const [pro, setPro] = useState(0)
  const [slot, setSlot] = useState<(typeof slots)[number]>('today')
  const [payment, setPayment] = useState<(typeof payments)[number]>('MTN MoMo')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const moved = useRef(false)

  useEffect(() => {
    // Not on first render: the demo must not steal focus when it loads.
    if (moved.current) headingRef.current?.focus()
  }, [step])

  const go = (next: Step) => {
    moved.current = true
    setStep(next)
    track('demo_interact', { step: next })
  }

  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const name = serviceNames[service]
  const heading = (text: string) => (
    <h3
      ref={headingRef}
      tabIndex={-1}
      className="font-display text-[15px] leading-tight font-semibold text-teal-700 focus-visible:outline-offset-1"
    >
      {text}
    </h3>
  )
  const back = (to: Step) => (
    <button
      type="button"
      onClick={() => go(to)}
      aria-label={labels.back}
      className="-ml-1 grid size-8 place-items-center rounded-full text-teal-700 hover:bg-mist-100"
    >
      <ArrowLeft aria-hidden className="size-4" />
    </button>
  )

  let screen: React.ReactNode
  if (step === 'categories') {
    screen = (
      <>
        {heading(labels.question)}
        <ul className="mt-4 grid grid-cols-3 gap-2">
          {tiles.map(({ key, icon: Icon }) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => {
                  setService(key)
                  go('pros')
                }}
                className="flex w-full flex-col items-center gap-1.5 rounded-xl bg-white px-1 py-2.5 shadow-sm ring-1 ring-mist-200 transition-colors hover:ring-teal-400"
              >
                <span className="grid size-7 place-items-center rounded-lg bg-mist-100 text-teal-600">
                  <Icon aria-hidden className="size-3.5" strokeWidth={2} />
                </span>
                <span className="text-center text-[10px] leading-tight font-medium">
                  {serviceNames[key]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </>
    )
  } else if (step === 'pros') {
    screen = (
      <>
        <div className="flex items-center gap-1">
          {back('categories')}
          <div>
            <p className="text-[10px] text-slate-500">{name}</p>
            {heading(labels.prosTitle)}
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          {pros.map(({ initials, name: proName, rating, jobs }, index) => (
            <li key={initials}>
              <button
                type="button"
                onClick={() => {
                  setPro(index)
                  go('booking')
                }}
                className="flex w-full items-center gap-3 rounded-xl bg-white p-3 text-left shadow-sm ring-1 ring-mist-200 transition-colors hover:ring-teal-400"
              >
                <span
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-teal-600 text-[11px] font-bold text-white"
                >
                  {initials}
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-1 text-[12px] font-semibold">
                    {proName}
                    <BadgeCheck aria-hidden className="size-3.5 text-teal-500" />
                    <span className="sr-only">{labels.verified}</span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500">
                    <Star aria-hidden className="size-3 fill-gold-500 text-gold-500" />
                    {number.format(rating)} · {number.format(jobs)} {labels.jobs}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </>
    )
  } else if (step === 'booking') {
    screen = (
      <>
        <div className="flex items-center gap-1">
          {back('pros')}
          <div>
            <p className="text-[10px] text-slate-500">{pros[pro].name}</p>
            {heading(labels.bookTitle.replace('{service}', name))}
          </div>
        </div>
        <fieldset className="mt-4">
          <legend className="text-[11px] font-semibold text-teal-700">{labels.when}</legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {slots.map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={slot === key}
                onClick={() => setSlot(key)}
                className={`${option} bg-white text-ink ring-mist-200`}
              >
                {labels.slots[key]}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-4">
          <legend className="text-[11px] font-semibold text-teal-700">{labels.payWith}</legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {payments.map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={payment === key}
                onClick={() => setPayment(key)}
                className={`${option} bg-white text-ink ring-mist-200`}
              >
                {key}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="mt-4 rounded-xl bg-teal-600/10 px-3 py-2.5 text-[11px] leading-snug text-teal-700">
          {labels.priceNote}
        </p>
        <button
          type="button"
          onClick={() => go('done')}
          className="mt-auto rounded-full bg-gold-500 py-2.5 text-[12px] font-semibold text-night-950 hover:bg-gold-400"
        >
          {labels.confirm}
        </button>
      </>
    )
  } else {
    screen = (
      <div className="my-auto text-center">
        <CircleCheck aria-hidden className="mx-auto size-12 text-teal-500" strokeWidth={1.75} />
        <div className="mt-3">{heading(labels.doneTitle)}</div>
        <p className="mt-2 text-[12px] leading-snug text-slate-500">{labels.doneBody}</p>
        <a
          href={appUrl}
          className="mt-5 inline-flex items-center gap-1 rounded-full bg-gold-500 px-4 py-2.5 text-[12px] font-semibold text-night-950 hover:bg-gold-400"
        >
          {labels.cta}
          <ArrowUpRight aria-hidden className="size-3.5" />
        </a>
        <button
          type="button"
          onClick={() => go('categories')}
          className="mx-auto mt-3 flex items-center gap-1 text-[11px] font-medium text-teal-600 underline-offset-2 hover:underline"
        >
          <RotateCcw aria-hidden className="size-3" />
          {labels.restart}
        </button>
      </div>
    )
  }

  return (
    <Phone>
      <div role="group" aria-label={labels.label} className="flex h-full flex-col text-ink">
        <div aria-hidden className="h-10 shrink-0" />
        <div key={step} className="flex flex-1 flex-col overflow-y-auto px-4 pt-2 pb-5">
          {screen}
        </div>
      </div>
    </Phone>
  )
}
