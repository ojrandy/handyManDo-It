import { ArrowUpRight, Smartphone } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { PageHero } from '@/components/sections/PageHero'
import { buttonClasses } from '@/components/ui/button'
import { StoreBadges } from '@/components/ui/StoreBadges'
import type { Locale } from '@/i18n/routing'
import { qrSvg } from '@/lib/qr'
import { absoluteUrl, pageMetadata, pathsFor } from '@/lib/seo'
import { getSiteSettings } from '@/lib/settings'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const t = await getTranslations({ locale, namespace: 'appPage' })
  return pageMetadata({
    locale,
    title: t('metaTitle'),
    description: t('metaDescription'),
    paths: pathsFor('/get-the-app'),
  })
}

// Where /download sends desktop browsers (PLAN.md §4, FR-PG-14): a QR code that opens /download
// on the phone (which picks the store), the store badges and the web app.
export default async function GetTheAppPage({ params }: Props) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const [t, settings] = await Promise.all([getTranslations('appPage'), getSiteSettings(locale)])
  const qr = await qrSvg(absoluteUrl('/download'))

  return (
    <main id="main">
      <PageHero
        breadcrumbs={[{ label: t('eyebrow'), href: '/get-the-app' }]}
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
      >
        <StoreBadges />
      </PageHero>

      <section aria-labelledby="page-title" className="bg-mist-50 py-16 md:py-24">
        <div className="container-site grid gap-6 md:grid-cols-2">
          <div className="flex flex-col items-center rounded-panel bg-white p-8 text-center ring-1 ring-mist-200">
            <h2 className="font-display text-2xl font-semibold text-teal-700">{t('qrTitle')}</h2>
            <p className="mt-2 text-slate-500">{t('qrBody')}</p>
            <div
              role="img"
              aria-label={t('qrAlt')}
              className="mt-6 size-56 [&>svg]:size-full"
              dangerouslySetInnerHTML={{ __html: qr }}
            />
          </div>
          <div className="flex flex-col rounded-panel bg-night-900 p-8 text-white">
            <Smartphone aria-hidden className="size-10 text-gold-300" />
            <h2 className="mt-5 font-display text-2xl font-semibold">{t('webTitle')}</h2>
            <p className="mt-2 text-white/75">{t('webBody')}</p>
            <a
              href={settings.webAppUrl}
              className={buttonClasses({ size: 'lg', className: 'mt-6 self-start' })}
            >
              {t('webCta')}
              <ArrowUpRight aria-hidden className="size-5" />
            </a>
            {settings.appStoreUrl ? null : (
              <p className="mt-6 text-sm text-white/60">{t('iphone')}</p>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
