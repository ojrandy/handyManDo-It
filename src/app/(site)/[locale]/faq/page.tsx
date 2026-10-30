import { MessageCircle } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { PageHero } from '@/components/sections/PageHero'
import { buttonClasses } from '@/components/ui/button'
import { FaqList, faqItem, faqPageData } from '@/components/ui/FaqList'
import { JsonLd } from '@/components/ui/JsonLd'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getFaqs } from '@/lib/catalog'
import { pageMetadata, pathsFor } from '@/lib/seo'
import { getSiteSettings } from '@/lib/settings'
import type { Faq } from '@/payload-types'

type Props = { params: Promise<{ locale: string }> }

// Display order of the FAQ categories (the `faqs.category` options).
const categories: Faq['category'][] = [
  'payments',
  'quotes',
  'coverage',
  'cancellations',
  'guarantee',
  'safety',
  'pros',
  'business',
]

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const t = await getTranslations({ locale, namespace: 'faqPage' })
  return pageMetadata({
    locale,
    title: t('metaTitle'),
    description: t('metaDescription'),
    paths: pathsFor('/faq'),
  })
}

// Full FAQ by category (PLAN.md §6, FR-PG-12). One FAQPage block covers every question; the
// per-category lists don't repeat it.
export default async function FaqPage({ params }: Props) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const [t, faqs, settings] = await Promise.all([
    getTranslations('faqPage'),
    getFaqs(locale),
    getSiteSettings(locale),
  ])

  const groups = categories
    .map((category) => ({
      category,
      items: faqs.filter((faq) => faq.category === category).map(faqItem),
    }))
    .filter(({ items }) => items.length)
  const all = groups.flatMap(({ items }) => items)

  return (
    <main id="main">
      <PageHero
        breadcrumbs={[{ label: t('eyebrow'), href: '/faq' }]}
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
      />

      <div className="bg-mist-50 py-16 md:py-24">
        <div className="container-site grid gap-12 lg:grid-cols-[16rem_1fr]">
          <nav aria-label={t('nav')} className="lg:sticky lg:top-28 lg:self-start">
            <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {groups.map(({ category }) => (
                <li key={category}>
                  <a
                    href={`#${category}`}
                    className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-teal-700 ring-1 ring-teal-600/20 hover:bg-teal-600/5 lg:rounded-card lg:ring-0"
                  >
                    {t(`categories.${category}`)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-14">
            {groups.map(({ category, items }) => (
              <section
                key={category}
                id={category}
                aria-labelledby={`${category}-title`}
                className="scroll-mt-28"
              >
                <h2
                  id={`${category}-title`}
                  className="mb-6 text-2xl font-bold text-teal-700 sm:text-3xl"
                >
                  {t(`categories.${category}`)}
                </h2>
                <FaqList items={items} structuredData={false} />
              </section>
            ))}

            <aside
              aria-labelledby="faq-more-title"
              className="rounded-panel bg-night-900 p-8 text-white"
            >
              <h2 id="faq-more-title" className="text-2xl font-bold">
                {t('more.title')}
              </h2>
              <p className="mt-3 text-white/75">{t('more.body')}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={settings.whatsappUrl}
                  className={buttonClasses({ variant: 'primary', size: 'md' })}
                >
                  <MessageCircle aria-hidden className="size-4" />
                  {t('more.whatsapp')}
                </a>
                <Link
                  href="/contact"
                  className={buttonClasses({ variant: 'secondary', size: 'md' })}
                >
                  {t('more.contact')}
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {all.length ? <JsonLd data={faqPageData(all)} /> : null}
    </main>
  )
}
