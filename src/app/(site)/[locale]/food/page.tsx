import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { AppOfferPage } from '@/components/sections/AppOfferPage'
import type { Locale } from '@/i18n/routing'
import { pageMetadata, pathsFor } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const t = await getTranslations({ locale, namespace: 'foodPage' })
  return pageMetadata({
    locale,
    title: t('metaTitle'),
    description: t('metaDescription'),
    paths: pathsFor('/food'),
  })
}

export default async function FoodPage({ params }: Props) {
  setRequestLocale((await params).locale)
  return <AppOfferPage namespace="foodPage" pathname="/food" screen="food" />
}
