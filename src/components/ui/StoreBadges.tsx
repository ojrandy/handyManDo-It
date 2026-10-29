import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'

import type { Locale } from '@/i18n/routing'
import { getSiteSettings } from '@/lib/settings'

import { buttonClasses } from './button'

type Props = {
  className?: string
  // Default to the `site` global.
  playStoreUrl?: string
  appStoreUrl?: string
}

// Official Google Play badge (used unaltered, per Google's badge guidelines). The App Store
// link only renders once a URL exists (FR-GLB-06); swap in Apple's official badge then (Q-3).
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
          <a href={appStoreUrl} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
            {t('appStore')}
          </a>
        </li>
      ) : null}
    </ul>
  )
}
