import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'

import type { Locale } from '@/i18n/routing'
import { getSiteSettings } from '@/lib/settings'

// Apple's localized badges have different widths at the same 40 px height.
const appStoreBadgeWidth: Record<Locale, number> = { en: 120, fr: 127 }

type Props = {
  className?: string
  // Default to the `site` global.
  playStoreUrl?: string
  appStoreUrl?: string
}

// Official Google Play and App Store badges, per locale and unaltered (both brands' badge
// guidelines; Apple's from toolbox.marketingtools.apple.com). The App Store badge only renders
// while a URL exists (FR-GLB-06).
export async function StoreBadges({ className = '', ...links }: Props) {
  const [t, locale] = await Promise.all([getTranslations('stores'), getLocale() as Promise<Locale>])
  const settings = await getSiteSettings(locale)
  const playStoreUrl = links.playStoreUrl ?? settings.playStoreUrl
  const appStoreUrl = links.appStoreUrl ?? settings.appStoreUrl

  return (
    <ul aria-label={t('label')} className={`flex flex-wrap items-center gap-3 ${className}`}>
      <li>
        <a href={playStoreUrl} className="block rounded-lg">
          <Image
            src={`/badges/google-play-${locale}.webp`}
            alt={t('googlePlay')}
            width={124}
            height={48}
          />
        </a>
      </li>
      {appStoreUrl ? (
        <li>
          {/* SVG served as-is: next/image doesn't optimize SVG, and Apple forbids altering it. */}
          <a href={appStoreUrl} className="block rounded-lg">
            <Image
              src={`/badges/app-store-${locale}.svg`}
              alt={t('appStore')}
              width={appStoreBadgeWidth[locale]}
              height={40}
              unoptimized
            />
          </a>
        </li>
      ) : null}
    </ul>
  )
}
