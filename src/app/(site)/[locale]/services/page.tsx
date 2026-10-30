import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { CtaBand } from '@/components/sections/CtaBand'
import { PageHero } from '@/components/sections/PageHero'
import { PricingExplainer } from '@/components/sections/PricingExplainer'
import { FilterableGrid } from '@/components/ui/FilterableGrid'
import { ServiceCard } from '@/components/ui/ServiceCard'
import type { Locale } from '@/i18n/routing'
import { formatPrice, getServices } from '@/lib/catalog'
import { pageMetadata, pathsFor } from '@/lib/seo'
import { serviceCategories } from '@/lib/service-keys'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const t = await getTranslations({ locale, namespace: 'servicesPage' })
  return pageMetadata({
    locale,
    title: t('metaTitle'),
    description: t('metaDescription'),
    paths: pathsFor('/services'),
  })
}

// Services index (PLAN.md §6, FR-PG-01): every published service, filterable by group, then how
// pricing works and the quote CTA.
export default async function ServicesPage({ params }: Props) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const [t, section, services] = await Promise.all([
    getTranslations('servicesPage'),
    getTranslations('servicesSection'),
    getServices(locale),
  ])

  const price = (value: number | null | undefined) =>
    value ? section('from', { price: formatPrice(locale, value) }) : section('clearPrice')

  return (
    <main id="main">
      <PageHero
        breadcrumbs={[{ label: t('eyebrow'), href: '/services' }]}
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
      />

      <div className="bg-mist-50 py-16 md:py-24">
        <div className="container-site">
          <FilterableGrid
            namespace="servicesPage.filter"
            groups={[
              {
                key: 'category',
                label: t('filter.label'),
                options: serviceCategories.map((value) => ({
                  value,
                  label: t(`categories.${value}`),
                })),
              },
            ]}
            items={services.map((service) => ({
              id: String(service.id),
              tags: { category: service.category ?? null },
              node: <ServiceCard service={service} price={price(service.fromPrice)} />,
            }))}
          />
        </div>
      </div>

      <PricingExplainer />
      <CtaBand />
    </main>
  )
}
