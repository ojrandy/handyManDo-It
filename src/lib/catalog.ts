import { cache } from 'react'

import { getPathname } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'

import { findDocs } from './payload'
import type { LocalizedPaths } from './seo'

// Published services in editor order, for the services index and detail pages (FR-PG-01/02).
export const getServices = cache((locale: Locale) =>
  findDocs('services', locale, { sort: 'order' }),
)

// One service with its joined projects, testimonials and FAQs. Depth 2 populates the projects'
// cover images; joins respect the joined collection's access, so draft projects stay hidden.
export const getService = cache(async (locale: Locale, slug: string) => {
  const [doc] = await findDocs('services', locale, {
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })
  return doc ?? null
})

// The service's URL in every locale, found by id because each language has its own slug.
export async function servicePaths(id: number): Promise<LocalizedPaths | null> {
  const slugs = await Promise.all(
    routing.locales.map(async (locale) => {
      const docs = await getServices(locale)
      return [locale, docs.find((doc) => doc.id === id)?.slug] as const
    }),
  )
  const paths: Partial<LocalizedPaths> = {}
  for (const [locale, slug] of slugs) {
    if (!slug) return null
    paths[locale] = getPathname({
      locale,
      href: { pathname: '/services/[slug]', params: { slug } },
    })
  }
  return paths as LocalizedPaths
}

export const formatPrice = (locale: Locale, price: number) =>
  new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US').format(price)
