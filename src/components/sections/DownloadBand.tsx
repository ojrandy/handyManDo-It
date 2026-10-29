import { ArrowUpRight } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'

import { AppHomeScreen } from '@/components/device/AppHomeScreen'
import { AppScreenImage } from '@/components/device/AppScreenImage'
import { Phone } from '@/components/device/Phone'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { StoreBadges } from '@/components/ui/StoreBadges'
import type { Locale } from '@/i18n/routing'
import { findScreen, getAppScreens, getHome, pick } from '@/lib/home'
import { getSiteSettings } from '@/lib/settings'
import { qrSvg } from '@/lib/qr'

// Download band (docs/PLAN.md §5.15, FR-HOME-15). Says "iOS & Android" only once an App Store
// URL exists (Q-3); until then "Android and the web", which is what is actually available.
export async function DownloadBand() {
  const locale = (await getLocale()) as Locale
  const [t, getTheApp, home, settings, screens] = await Promise.all([
    getTranslations('download'),
    getTranslations('getTheApp'),
    getHome(locale),
    getSiteSettings(locale),
    getAppScreens(locale),
  ])
  const copy = home.download
  const qr = await qrSvg(settings.playStoreUrl)
  const qrAlt = getTheApp('qrAlt')

  return (
    <section
      aria-labelledby="download-title"
      className="grain relative overflow-hidden bg-night-900 py-20 text-white md:py-28"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_30%_100%,rgb(231_171_52/0.22),transparent_70%)]"
      />
      <div className="container-site grid items-center gap-14 lg:grid-cols-2">
        <div>
          <SectionHeading
            id="download-title"
            tone="dark"
            eyebrow={pick(copy?.eyebrow, t('eyebrow'))}
            title={pick(copy?.title, t('title'))}
            intro={
              settings.appStoreUrl
                ? pick(copy?.bodyAll, t('bodyAll'))
                : pick(copy?.bodyAndroid, t('bodyAndroid'))
            }
          />
          <div className="mt-10 flex flex-wrap items-center gap-8">
            <div>
              <StoreBadges
                playStoreUrl={settings.playStoreUrl}
                appStoreUrl={settings.appStoreUrl}
              />
              <a
                href={settings.webAppUrl}
                className="mt-5 inline-flex items-center gap-1.5 font-semibold text-gold-300 underline-offset-4 hover:underline"
              >
                {t('webApp')}
                <ArrowUpRight aria-hidden className="size-4" />
              </a>
            </div>
            {/* QR only makes sense on a computer; phones use the badge directly. */}
            <figure className="hidden items-center gap-4 lg:flex">
              <div
                role="img"
                aria-label={qrAlt}
                className="w-28 rounded-card bg-white p-2 [&>svg]:h-auto [&>svg]:w-full"
                // Trusted markup: generated on the server by the qrcode library from a fixed URL.
                dangerouslySetInnerHTML={{ __html: qr }}
              />
              <figcaption className="max-w-[8rem] text-sm text-white/70">{t('qrHint')}</figcaption>
            </figure>
          </div>
        </div>

        <div aria-hidden className="relative flex justify-center gap-4 sm:gap-6">
          <div className="absolute top-1/2 left-1/2 size-96 -translate-1/2 rounded-full bg-gold-500/15 blur-3xl" />
          {/* zoom scales the whole device, so the screen's pixel-sized text stays in proportion. */}
          <div className="translate-y-8 [zoom:0.6] sm:[zoom:0.78]">
            <Phone>
              <AppScreenImage
                screen={findScreen(screens, 'home', 'light')}
                fallback={<AppHomeScreen />}
              />
            </Phone>
          </div>
          <div className="-translate-y-4 [zoom:0.6] sm:[zoom:0.78]">
            <Phone>
              <AppScreenImage
                screen={findScreen(screens, 'home', 'dark')}
                fallback={<AppHomeScreen theme="dark" />}
              />
            </Phone>
          </div>
        </div>
      </div>
    </section>
  )
}
