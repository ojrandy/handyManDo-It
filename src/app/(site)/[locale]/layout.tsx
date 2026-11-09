import type { Metadata, Viewport } from 'next'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Poppins, Sora } from 'next/font/google'
import { notFound } from 'next/navigation'
import React from 'react'
import { preconnect } from 'react-dom'

import { Footer } from '@/components/sections/Footer'
import { Header } from '@/components/sections/Header'
import { AfterLoad } from '@/components/ui/AfterLoad'
import { WhatsAppFab } from '@/components/ui/WhatsAppFab'
import { routing } from '@/i18n/routing'
import { renderedAt } from '@/lib/contentVersion'
import { getSiteSettings } from '@/lib/settings'
import { site } from '@/lib/site'
import '../globals.css'

// `subsets` only picks what is preloaded: every subset's @font-face is still emitted. French
// needs nothing beyond `latin` (é, œ, ’, €), so latin-ext files no longer compete with the hero
// photo. Keep it equal to src/components/admin/AdminFonts.tsx: the same font file declared with
// different preload flags fails the build ("next/font/google queries have exactly one entry").
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-sora',
  display: 'swap',
})

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

// A 404 inside a statically generated route (unknown slug, or a root-level file such as
// /foo.php/about taken as the locale) must never make next-intl fall back to reading headers:
// that fails as static-to-dynamic and turns the 404 into a 500. So the request locale is set
// here too (metadata runs apart from rendering; not-found.tsx waits for this), and unknown
// locales fall back to the default before notFound().
const requestLocaleOf = (locale: string) =>
  hasLocale(routing.locales, locale) ? locale : routing.defaultLocale

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = requestLocaleOf((await params).locale)
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'metadata' })

  return {
    metadataBase: new URL(site.url),
    title: { default: t('title'), template: `%s · ${t('siteName')}` },
    description: t('description'),
    applicationName: site.name,
    icons: {
      icon: [
        { url: '/icons/favicon.ico', sizes: 'any' },
        { url: '/icons/favicon-32.png', type: 'image/png', sizes: '32x32' },
      ],
      apple: '/icons/apple-touch-icon.png',
    },
    manifest: '/manifest.webmanifest',
    openGraph: {
      type: 'website',
      siteName: t('siteName'),
      locale: locale === 'fr' ? 'fr_CM' : 'en_CM',
      images: [{ url: '/brand/og-default.jpg', width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image' },
    other: { 'google-play-app': 'app-id=com.handymandoit.app' },
  }
}

export const viewport: Viewport = {
  themeColor: '#0f2530',
  colorScheme: 'light',
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    setRequestLocale(routing.defaultLocale)
    notFound()
  }

  setRequestLocale(locale)
  // CMS images come from R2 on their own host in production: open that connection before the
  // hero's LCP image is discovered (DNS + TLS cost several round trips on 4G).
  if (process.env.MEDIA_PUBLIC_URL) preconnect(new URL(process.env.MEDIA_PUBLIC_URL).origin)
  const [t, whatsapp, consent, settings] = await Promise.all([
    getTranslations({ locale, namespace: 'nav' }),
    getTranslations({ locale, namespace: 'whatsapp' }),
    getTranslations({ locale, namespace: 'consent' }),
    getSiteSettings(locale),
  ])
  const consentKeys = [
    'label',
    'title',
    'body',
    'accept',
    'reject',
    'customise',
    'save',
    'necessary',
    'necessaryBody',
    'analytics',
    'analyticsBody',
    'privacy',
  ] as const

  return (
    <html lang={locale} className={`${poppins.variable} ${sora.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-gold-500 focus:px-4 focus:py-2 focus:text-night-900"
        >
          {t('skipToContent')}
        </a>
        <NextIntlClientProvider>
          <Header />
          {children}
          <Footer />
          <WhatsAppFab href={settings.whatsappUrl} label={whatsapp('label')} />
          {/* Live refresh (ADR-033: compares this render's time with CMS saves) and analytics. */}
          <AfterLoad
            renderedAt={renderedAt()}
            gaId={process.env.NEXT_PUBLIC_GA_ID || null}
            webAppUrl={settings.webAppUrl}
            labels={
              Object.fromEntries(consentKeys.map((key) => [key, consent(key)])) as Record<
                (typeof consentKeys)[number],
                string
              >
            }
          />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
