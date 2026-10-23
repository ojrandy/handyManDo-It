'use client'

import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

import { StatusMessage } from '@/components/sections/StatusMessage'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorBoundary({ error, reset }: Props) {
  const t = useTranslations('error')

  useEffect(() => {
    // The digest links this to the server log entry on Hostinger.
    console.error('Page error', { digest: error.digest, message: error.message })
  }, [error])

  return (
    <StatusMessage
      eyebrow={t('eyebrow')}
      title={t('title')}
      body={t('body')}
      homeLabel={t('home')}
      whatsappLabel={t('whatsapp')}
      action={
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-gold-500/60 px-7 py-3.5 font-semibold text-gold-300 transition-colors hover:bg-gold-500/10"
        >
          {t('retry')}
        </button>
      }
    />
  )
}
