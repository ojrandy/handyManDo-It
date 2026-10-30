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

// Published projects: featured first, then newest (FR-PG-07).
export const getProjects = cache((locale: Locale) =>
  findDocs('projects', locale, { sort: ['-featured', '-date', '-createdAt'] }),
)

export const getProject = cache(async (locale: Locale, slug: string) => {
  const [doc] = await findDocs('projects', locale, {
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })
  return doc ?? null
})

export const getTestimonials = cache((locale: Locale) =>
  findDocs('testimonials', locale, { sort: 'order' }),
)

export const getFaqs = cache((locale: Locale) => findDocs('faqs', locale, { sort: 'order' }))

export const getTeam = cache((locale: Locale) => findDocs('team', locale, { sort: 'order' }))

const slugRoutes = {
  services: { list: getServices, pathname: '/services/[slug]' },
  projects: { list: getProjects, pathname: '/our-work/[slug]' },
} as const

// A document's URL in every locale, found by id because each language has its own slug. Null
// when it is missing in a language (the page then gets no hreflang alternates).
export async function docPaths(
  collection: keyof typeof slugRoutes,
  id: number,
): Promise<LocalizedPaths | null> {
  const { list, pathname } = slugRoutes[collection]
  const paths: Partial<LocalizedPaths> = {}
  for (const locale of routing.locales) {
    const slug = (await list(locale)).find((doc) => doc.id === id)?.slug
    if (!slug) return null
    paths[locale] = getPathname({ locale, href: { pathname, params: { slug } } })
  }
  return paths as LocalizedPaths
}

export const formatPrice = (locale: Locale, price: number) =>
  new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US').format(price)
