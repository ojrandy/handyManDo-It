import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import { cache } from 'react'

import type { Locale } from '@/i18n/routing'
import type { AppScreen, Faq, Home, Service } from '@/payload-types'

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

// Captured app screens in the page's language (T-1.09); each one is a key × theme pair.
export const getAppScreens = cache((locale: Locale) =>
  findDocs('app-screens', locale, { where: { lang: { equals: locale } } }),
)

export const findScreen = (
  screens: readonly AppScreen[],
  key: AppScreen['key'],
  theme: AppScreen['theme'],
): AppScreen | undefined => screens.find((screen) => screen.key === key && screen.theme === theme)

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

// Hero footage needs at least the 720p MP4; without it the hero keeps its designed background.
// Sources run largest first, WebM before MP4 in each size: the browser takes the first one whose
// `media` matches. Browsers that ignore `media` on video sources take the first playable file.
export function heroVideoFrom(video: NonNullable<Home['hero']>['video']): HeroVideo | null {
  const mp4 = mediaUrl(video?.mp4)
  if (!mp4) return null
  // Without a 480p file, small screens play the 720p one.
  const hasSmall = Boolean(mediaUrl(video?.mp4Small))
  const sizes = [
    { webm: video?.webmLarge, mp4: video?.mp4Large, media: '(min-width: 1280px)' },
    { webm: video?.webm, mp4: video?.mp4, media: hasSmall ? '(min-width: 640px)' : undefined },
    { webm: video?.webmSmall, mp4: video?.mp4Small, media: undefined },
  ]
  const sources = sizes.flatMap(({ webm, mp4, media }) =>
    [
      { src: mediaUrl(webm), type: 'video/webm' as const, media },
      { src: mediaUrl(mp4), type: 'video/mp4' as const, media },
    ].flatMap(({ src, ...rest }) => (src ? [{ src, ...rest }] : [])),
  )
  return { sources, poster: mediaUrl(video?.poster) ?? undefined }
}

// Large tiles first (they anchor the bento grid), each group in editor order.
export const bentoOrder = (services: readonly Service[]): Service[] => [
  ...services.filter(({ size }) => size === 'large'),
  ...services.filter(({ size }) => size !== 'large'),
]

// FAQPage JSON-LD wants the answer as text.
export const faqText = (answer: Faq['answer']): string =>
  convertLexicalToPlaintext({ data: answer }).trim()
