import { routing } from '@/i18n/routing'
import { imageParamsFor, ogContentType, ogImage, ogSize } from '@/lib/ogImage'

import { generateMetadata, generateStaticParams as pageParams } from './page'

// Share card from this page's own title and description (FR-SEO-04, src/lib/ogImage.tsx).
// Rendered at build; a page published later gets its card on first request, then cached.
export const size = ogSize
export const contentType = ogContentType
export const dynamic = 'force-static'
export const generateStaticParams = imageParamsFor(pageParams, routing.locales)

export default async function Image(props: Parameters<typeof generateMetadata>[0]) {
  return ogImage(await generateMetadata(props))
}
