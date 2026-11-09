import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Audiences } from '@/components/sections/Audiences'
import { DownloadBand } from '@/components/sections/DownloadBand'
import { Earn } from '@/components/sections/Earn'
import { FaqTeaser } from '@/components/sections/FaqTeaser'
import { Hero } from '@/components/sections/Hero'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { LatestPosts } from '@/components/sections/LatestPosts'
import { MiniDemo } from '@/components/sections/MiniDemo'
import { Numbers } from '@/components/sections/Numbers'
import { Pillars } from '@/components/sections/Pillars'
import { ScreensGallery } from '@/components/sections/ScreensGallery'
import { ScrollStory } from '@/components/sections/ScrollStory'
import { ServicesBento } from '@/components/sections/ServicesBento'
import { Testimonials } from '@/components/sections/Testimonials'
import { TrustedBy } from '@/components/sections/TrustedBy'
import { JsonLd } from '@/components/ui/JsonLd'
import type { Locale } from '@/i18n/routing'
import { getGlobal } from '@/lib/payload'
import { pageMetadata, pathsFor } from '@/lib/seo'
import { site } from '@/lib/site'
import { getStructuredData, graph } from '@/lib/structuredData'

type Props = { params: Promise<{ locale: string }> }

// Root-level files such as /robots.txt skip the proxy and match this route with the file name as
// the locale; the localized 404 then reads headers and fails as static-to-dynamic. Unknown
// locales get a plain 404 instead. Set here, not on the layout: a layout's `false` is inherited by
// every route below it and would 404 slugs published after the build (ADR-033).
export const dynamicParams = false

// The CMS `seo` global first; its untouched default title (the bare site name) is too thin for the
// home page, so the translated title stands in for it.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const [t, seo] = await Promise.all([
    getTranslations({ locale, namespace: 'metadata' }),
    getGlobal('seo', locale),
  ])
  const cmsTitle = seo.defaultTitle?.trim()
  return pageMetadata({
    locale,
    title: cmsTitle && cmsTitle !== site.name ? cmsTitle : t('title'),
    description: seo.defaultDescription?.trim() || t('description'),
    paths: pathsFor('/'),
    absoluteTitle: true,
  })
}

// Home page, in docs/PLAN.md §5 order.
export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const data = await getStructuredData(locale as Locale)

  return (
    <main id="main">
      <Hero />
      <TrustedBy />
      <ServicesBento />
      <Pillars />
      <Numbers />
      <ScrollStory />
      <HowItWorks />
      <MiniDemo />
      <ScreensGallery />
      <Testimonials />
      <Audiences />
      <Earn />
      <FaqTeaser />
      <DownloadBand />
      <LatestPosts />
      <JsonLd data={graph(data.organization, data.website, data.app, ...data.offices)} />
    </main>
  )
}
