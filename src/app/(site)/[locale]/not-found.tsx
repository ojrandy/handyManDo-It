import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { StatusMessage } from '@/components/sections/StatusMessage'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('notFound')
  return { title: t('metaTitle') }
}

// Rendered with a 404 status for unknown paths under a locale (see [...rest]/page.tsx).
export default async function NotFound() {
  const t = await getTranslations('notFound')

  return (
    <StatusMessage
      eyebrow={t('eyebrow')}
      title={t('title')}
      body={t('body')}
      homeLabel={t('home')}
      whatsappLabel={t('whatsapp')}
    />
  )
}
