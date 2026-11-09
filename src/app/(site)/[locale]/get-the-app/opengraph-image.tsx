import { routing } from '@/i18n/routing'
import { ogContentType, ogImage, ogSize } from '@/lib/ogImage'

import { generateMetadata } from './page'

// Share card from this page's own title and description (FR-SEO-04, src/lib/ogImage.tsx).
// Rendered at build; a page published later gets its card on first request, then cached.
export const size = ogSize
export const contentType = ogContentType
export const dynamic = 'force-static'
export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }))

export default async function Image(props: Parameters<typeof generateMetadata>[0]) {
  return ogImage(await generateMetadata(props))
}
