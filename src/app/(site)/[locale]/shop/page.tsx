import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { AppOfferPage } from '@/components/sections/AppOfferPage'
import type { Locale } from '@/i18n/routing'
import { pageMetadata, pathsFor } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const t = await getTranslations({ locale, namespace: 'shopPage' })
  return pageMetadata({
    locale,
    title: t('metaTitle'),
    description: t('metaDescription'),
    paths: pathsFor('/shop'),
  })
}

export default async function ShopPage({ params }: Props) {
  setRequestLocale((await params).locale)
  return <AppOfferPage namespace="shopPage" pathname="/shop" screen="shop" />
}
