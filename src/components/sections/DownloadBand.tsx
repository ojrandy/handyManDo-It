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

// Download band (docs/PLAN.md §5.15, FR-HOME-15). No QR code here (owner, 2026-11-07): desktop
// visitors still get one from the "Get the app" popover and /get-the-app. Says "iOS & Android" only once an App Store
// URL exists (Q-3); until then "Android and the web", which is what is actually available.
export async function DownloadBand() {
  const locale = (await getLocale()) as Locale
  const [t, home, settings, screens] = await Promise.all([
    getTranslations('download'),
    getHome(locale),
    getSiteSettings(locale),
    getAppScreens(locale),
  ])
  const copy = home.download

  return (
    <section
      aria-labelledby="download-title"
      className="grain relative overflow-hidden bg-night-900 py-20 text-white md:py-28"
    >
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
          <div className="mt-10">
            <StoreBadges playStoreUrl={settings.playStoreUrl} appStoreUrl={settings.appStoreUrl} />
            <a
              href={settings.webAppUrl}
              className="mt-5 inline-flex items-center gap-1.5 font-semibold text-gold-300 underline-offset-4 hover:underline"
            >
              {t('webApp')}
              <ArrowUpRight aria-hidden className="size-4" />
            </a>
          </div>
        </div>

        <div aria-hidden className="flex justify-center gap-4 sm:gap-6">
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
