import type { Metadata, Viewport } from 'next'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Poppins, Sora } from 'next/font/google'
import { notFound } from 'next/navigation'
import React from 'react'
import { preconnect } from 'react-dom'

import { Footer } from '@/components/sections/Footer'
import { Header } from '@/components/sections/Header'
import { WhatsAppFab } from '@/components/ui/WhatsAppFab'
import { routing } from '@/i18n/routing'
import { site } from '@/lib/site'
import '../globals.css'

const poppins = Poppins({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin', 'latin-ext'],
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
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
  if (!hasLocale(routing.locales, locale)) notFound()

  setRequestLocale(locale)
  // CMS images come from R2 on their own host in production: open that connection before the
  // hero's LCP image is discovered (DNS + TLS cost several round trips on 4G).
  if (process.env.MEDIA_PUBLIC_URL) preconnect(new URL(process.env.MEDIA_PUBLIC_URL).origin)
  const [t, whatsapp] = await Promise.all([
    getTranslations({ locale, namespace: 'nav' }),
    getTranslations({ locale, namespace: 'whatsapp' }),
  ])

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
          <WhatsAppFab href={site.whatsappUrl} label={whatsapp('label')} />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
