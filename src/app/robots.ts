import type { MetadataRoute } from 'next'

import { absoluteUrl } from '@/lib/seo'

// FR-SEO-02. The CMS and API stay out of search; uploaded images served through the API (local
// storage, no R2) stay crawlable for image search. /download is a per-device redirect, not a page.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/media/file/'],
      disallow: ['/admin', '/api/', '/download'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
