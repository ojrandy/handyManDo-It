import { ArrowRight, Plus } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { SectionHeading } from '@/components/ui/SectionHeading'
import { Link } from '@/i18n/navigation'

// The 8 home FAQs (docs/PLAN.md §5.14, FR-HOME-14). Native <details> gives keyboard and
// screen-reader support without JS. Answers stick to facts in docs/PLAN.md; they move to the
// `faqs` collection (showOnHome) in Phase 1.
const keys = [
  'payment',
  'cities',
  'price',
  'satisfaction',
  'vetting',
  'tracking',
  'pros',
  'business',
] as const

export async function FaqTeaser() {
  const t = await getTranslations('faq')

  // FAQPage structured data, built from the same strings that are rendered.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: keys.map((key) => ({
      '@type': 'Question',
      name: t(`items.${key}.q`),
      acceptedAnswer: { '@type': 'Answer', text: t(`items.${key}.a`) },
    })),
  }

  return (
    <section aria-labelledby="faq-title" className="bg-mist-50 py-20 md:py-28">
      <div className="container-site grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHeading id="faq-title" eyebrow={t('eyebrow')} title={t('title')} />
          <Link
            href="/faq"
            className="mt-8 inline-flex items-center gap-1.5 font-semibold text-teal-600 underline-offset-4 hover:underline"
          >
            {t('seeAll')}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

        <div className="divide-y divide-mist-200 rounded-panel bg-white px-6 shadow-sm ring-1 ring-mist-200 sm:px-8">
          {keys.map((key) => (
            <details key={key} className="group py-1">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-lg font-semibold text-teal-700 [&::-webkit-details-marker]:hidden">
                {t(`items.${key}.q`)}
                <Plus
                  aria-hidden
                  className="size-5 shrink-0 text-teal-600 transition-transform duration-200 group-open:rotate-45"
                />
              </summary>
              <p className="pb-5 leading-relaxed text-slate-500">{t(`items.${key}.a`)}</p>
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
