import { RichText } from '@payloadcms/richtext-lexical/react'
import { ArrowRight, Plus } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'

import { SectionHeading } from '@/components/ui/SectionHeading'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { faqText, getHome, getHomeFaqs, pick, pickList } from '@/lib/home'

// Stand-in while no FAQ is marked "show on home": the copy in messages.
const fallbackKeys = [
  'payment',
  'cities',
  'price',
  'satisfaction',
  'vetting',
  'tracking',
  'pros',
  'business',
] as const

const answerClass = 'pb-5 leading-relaxed text-slate-500 [&_p+p]:mt-3'

// The home FAQs (docs/PLAN.md §5.14, FR-HOME-14): `faqs` marked showOnHome, in editor order.
// Native <details> gives keyboard and screen-reader support without JS.
export async function FaqTeaser() {
  const locale = (await getLocale()) as Locale
  const [t, home, docs] = await Promise.all([
    getTranslations('faq'),
    getHome(locale),
    getHomeFaqs(locale),
  ])

  const items = pickList(
    docs,
    (faq) => ({
      key: String(faq.id),
      question: faq.question,
      text: faqText(faq.answer),
      answer: <RichText data={faq.answer} className={answerClass} />,
    }),
    () =>
      fallbackKeys.map((key) => ({
        key,
        question: t(`items.${key}.q`),
        text: t(`items.${key}.a`),
        answer: <p className={answerClass}>{t(`items.${key}.a`)}</p>,
      })),
  )

  // FAQPage structured data, built from the same content that is rendered.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ question, text }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text },
    })),
  }

  return (
    <section aria-labelledby="faq-title" className="bg-mist-50 py-20 md:py-28">
      <div className="container-site grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHeading
            id="faq-title"
            eyebrow={pick(home.faq?.eyebrow, t('eyebrow'))}
            title={pick(home.faq?.title, t('title'))}
          />
          <Link
            href="/faq"
            className="mt-8 inline-flex items-center gap-1.5 font-semibold text-teal-600 underline-offset-4 hover:underline"
          >
            {t('seeAll')}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

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
      </div>

      <script
        type="application/ld+json"
        // JSON.stringify escapes quotes; "<" is escaped so the data can never close the tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
    </section>
  )
}
