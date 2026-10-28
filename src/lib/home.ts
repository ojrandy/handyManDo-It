import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import { cache } from 'react'

import type { Locale } from '@/i18n/routing'
import type { Faq, Home, Service } from '@/payload-types'

import type { HeroVideo } from './hero'
import { mediaUrl } from './media'
import { findDocs, getGlobal } from './payload'
import { site } from './site'

// Home page content from Payload (T-1.15). Each read is tagged in src/lib/payload.ts, so a
// publish refreshes the page; cache() makes the sections share one read per render.
//
// Fallbacks cover *missing content*, not failures: an empty field or collection keeps the
// messages / src/lib copy (fresh database, section not filled yet). A failed read throws on
// purpose: Next then keeps serving the last good page instead of caching a fallback one.

export const getHome = cache((locale: Locale) => getGlobal('home', locale))

export const getHomeServices = cache((locale: Locale) =>
  findDocs('services', locale, { where: { featuredOnHome: { equals: true } }, sort: 'order' }),
)

export const getPartners = cache((locale: Locale) =>
  findDocs('partners', locale, { sort: 'order' }),
)

export const getHomeTestimonials = cache((locale: Locale) =>
  findDocs('testimonials', locale, { where: { featured: { equals: true } }, sort: 'order' }),
)

export const getHomeFaqs = cache((locale: Locale) =>
  findDocs('faqs', locale, { where: { showOnHome: { equals: true } }, sort: 'order' }),
)

// Contact and app links merged over the src/lib/site defaults.
export const getSiteSettings = cache(async (locale: Locale) => {
  const doc = await getGlobal('site', locale)
  return {
    webAppUrl: doc.webAppUrl || site.webAppUrl,
    playStoreUrl: doc.playStoreUrl || site.playStoreUrl,
    appStoreUrl: doc.appStoreUrl || site.appStoreUrl,
    stats: {
      towns: doc.towns ?? site.stats.towns,
      years: doc.years ?? site.stats.years,
      clients: doc.clients ?? site.stats.clients,
      projects: doc.projects ?? site.stats.projects,
    },
  }
})

// An editor's text, or the fallback while the field is empty.
export const pick = (value: string | null | undefined, fallback: string): string =>
  value?.trim() ? value : fallback

// An editor's list, or the fallback while it has no rows.
export function pickList<T, U>(
  items: readonly T[] | null | undefined,
  map: (item: T, index: number) => U,
  fallback: () => U[],
): U[] {
  return items?.length ? items.map(map) : fallback()
}

// Hero footage needs at least the MP4; without it the hero keeps its designed background.
export function heroVideoFrom(video: NonNullable<Home['hero']>['video']): HeroVideo | null {
  const mp4 = mediaUrl(video?.mp4)
  if (!mp4) return null
  return {
    mp4,
    webm: mediaUrl(video?.webm) ?? undefined,
    poster: mediaUrl(video?.poster) ?? undefined,
  }
}

// Large tiles first (they anchor the bento grid), each group in editor order.
export const bentoOrder = (services: readonly Service[]): Service[] => [
  ...services.filter(({ size }) => size === 'large'),
  ...services.filter(({ size }) => size !== 'large'),
]

// FAQPage JSON-LD wants the answer as text.
export const faqText = (answer: Faq['answer']): string =>
  convertLexicalToPlaintext({ data: answer }).trim()
