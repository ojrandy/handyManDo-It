import { ArrowRight } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'

import { answerClass, FaqList, faqItem } from '@/components/ui/FaqList'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getHome, getHomeFaqs, pick, pickList } from '@/lib/home'

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

// The home FAQs (docs/PLAN.md §5.14, FR-HOME-14): `faqs` marked showOnHome, in editor order.
export async function FaqTeaser() {
  const locale = (await getLocale()) as Locale
  const [t, home, docs] = await Promise.all([
    getTranslations('faq'),
    getHome(locale),
    getHomeFaqs(locale),
  ])

  const items = pickList(docs, faqItem, () =>
    fallbackKeys.map((key) => ({
      key,
      question: t(`items.${key}.q`),
      text: t(`items.${key}.a`),
      answer: <p className={answerClass}>{t(`items.${key}.a`)}</p>,
    })),
  )

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

        <FaqList items={items} />
      </div>
    </section>
  )
}
