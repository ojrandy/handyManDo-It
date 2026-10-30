import { getLocale, getTranslations } from 'next-intl/server'

import type { Locale } from '@/i18n/routing'
import { qrSvg } from '@/lib/qr'
import { absoluteUrl } from '@/lib/seo'
import { getSiteSettings } from '@/lib/settings'

import type { ButtonSize, ButtonVariant } from './button'
import { GetTheAppButton } from './GetTheAppButton'

type Props = {
  // Defaults to the nav "Get the app" label.
  label?: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

// Server wrapper: resolves labels, store links (`site` global) and the QR, then hands them to the
// client button.
// The QR opens /download on the phone that scans it, which picks the store (T-4.10).
export async function GetTheApp({ label, variant, size, className }: Props) {
  const [t, nav, settings] = await Promise.all([
    getTranslations('getTheApp'),
    getTranslations('nav'),
    getLocale().then((locale) => getSiteSettings(locale as Locale)),
  ])
  const qr = await qrSvg(absoluteUrl('/download'))

  return (
    <GetTheAppButton
      label={label ?? nav('getTheApp')}
      playStoreUrl={settings.playStoreUrl}
      appStoreUrl={settings.appStoreUrl}
      webAppUrl={settings.webAppUrl}
      qrSvg={qr}
      labels={{
        qrTitle: t('qrTitle'),
        qrBody: t('qrBody'),
        qrAlt: t('qrAlt'),
        orUseWeb: t('orUseWeb'),
        close: t('close'),
      }}
      variant={variant}
      size={size}
      className={className}
    />
  )
}
