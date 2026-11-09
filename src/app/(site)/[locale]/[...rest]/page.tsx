import { notFound } from 'next/navigation'

import { routing, type Locale } from '@/i18n/routing'
import { followEditorRedirect } from '@/lib/redirects'

type Props = { params: Promise<{ locale: string; rest: string[] }> }

// Unknown paths under a locale land here so they get the localized not-found
// page (with the site layout) instead of Next's unstyled global 404. A CMS redirect for the
// path wins over the 404 (src/lib/redirects.ts).
// Only the home page sets dynamicParams = false (root-level files); any path is allowed here.
export const dynamicParams = true

export default async function CatchAllPage({ params }: Props) {
  const { locale, rest } = await params
  if ((routing.locales as readonly string[]).includes(locale)) {
    await followEditorRedirect(locale as Locale, `/${locale}/${rest.join('/')}`)
  }
  notFound()
}
