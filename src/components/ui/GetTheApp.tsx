import { getTranslations } from 'next-intl/server'

import { qrSvg } from '@/lib/qr'
import { site } from '@/lib/site'

import type { ButtonSize, ButtonVariant } from './button'
import { GetTheAppButton } from './GetTheAppButton'

type Props = {
  // Defaults to the nav "Get the app" label.
  label?: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

// Server wrapper: resolves labels and renders the QR once, then hands both to the client button.
// The QR points at the Play listing until /download exists (T-4.10), which will pick the store.
export async function GetTheApp({ label, variant, size, className }: Props) {
  const [t, nav, qr] = await Promise.all([
    getTranslations('getTheApp'),
    getTranslations('nav'),
    qrSvg(site.playStoreUrl),
  ])

  return (
    <GetTheAppButton
      label={label ?? nav('getTheApp')}
      playStoreUrl={site.playStoreUrl}
      appStoreUrl={site.appStoreUrl}
      webAppUrl={site.webAppUrl}
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
