import type { Metadata, ResolvingMetadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { StatusMessage } from '@/components/sections/StatusMessage'

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // The layout's metadata sets the request locale; without it next-intl reads headers, which
  // breaks 404s inside statically generated routes (see layout.tsx).
  await parent
  const t = await getTranslations('notFound')
  return { title: t('metaTitle'), robots: { index: false, follow: true } }
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
