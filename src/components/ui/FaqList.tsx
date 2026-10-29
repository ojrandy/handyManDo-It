import { RichText } from '@payloadcms/richtext-lexical/react'
import { Plus } from 'lucide-react'
import React from 'react'

import { faqText } from '@/lib/home'
import type { Faq } from '@/payload-types'

import { JsonLd } from './JsonLd'

export type FaqItem = {
  key: string
  question: string
  // Plain text of the answer, for the FAQPage structured data.
  text: string
  answer: React.ReactNode
}

export const answerClass = 'pb-5 leading-relaxed text-slate-500 [&_p+p]:mt-3'

export const faqItem = (faq: Faq): FaqItem => ({
  key: String(faq.id),
  question: faq.question,
  text: faqText(faq.answer),
  answer: <RichText data={faq.answer} className={answerClass} />,
})

// Questions as native <details> (keyboard and screen-reader support without JS), with FAQPage
// structured data built from the same content (FR-SEO-03). Set `structuredData={false}` when
// another list on the page already emits it: Google reads one FAQPage per page.
export function FaqList({
  items,
  structuredData = true,
}: {
  items: FaqItem[]
  structuredData?: boolean
}) {
  return (
    <>
      <div className="divide-y divide-mist-200 rounded-panel bg-white px-6 shadow-sm ring-1 ring-mist-200 sm:px-8">
        {items.map(({ key, question, answer }) => (
          <details key={key} className="group py-1">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-lg font-semibold text-teal-700 [&::-webkit-details-marker]:hidden">
              {question}
              <Plus
                aria-hidden
                className="size-5 shrink-0 text-teal-600 transition-transform duration-200 group-open:rotate-45"
              />
            </summary>
            {answer}
          </details>
        ))}
      </div>
      {structuredData ? (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: items.map(({ question, text }) => ({
              '@type': 'Question',
              name: question,
              acceptedAnswer: { '@type': 'Answer', text },
            })),
          }}
        />
      ) : null}
    </>
  )
}
