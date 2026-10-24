import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'

import { site } from '@/lib/site'

import { buttonClasses } from './button'

type Props = {
  className?: string
  playStoreUrl?: string
  appStoreUrl?: string
}

// Official Google Play badge (used unaltered, per Google's badge guidelines). The App Store
// link only renders once a URL exists (FR-GLB-06); swap in Apple's official badge then (Q-3).
export async function StoreBadges({
  className = '',
  playStoreUrl = site.playStoreUrl,
  appStoreUrl = site.appStoreUrl,
}: Props) {
  const [t, locale] = await Promise.all([getTranslations('stores'), getLocale()])

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
