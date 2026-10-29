import type { Metadata } from 'next'

import { getPathname } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'

import { site } from './site'

export type Href = Parameters<typeof getPathname>[0]['href']

// The page's path in every locale. Slug pages pass their own map, because a translated slug
// differs per language (/fr/services/demenagement ↔ /en/services/moving).
export type LocalizedPaths = Record<Locale, string>

export const pathsFor = (href: Href): LocalizedPaths =>
  Object.fromEntries(
    routing.locales.map((locale) => [locale, getPathname({ locale, href })]),
  ) as LocalizedPaths

export const absoluteUrl = (path: string) => new URL(path, site.url).toString()

type PageMeta = {
  locale: Locale
  title: string
  description: string
  paths: LocalizedPaths
}

// Title, description, canonical and hreflang alternates for one page (FR-SEO-01). French is the
// x-default (FR-I18N). The language switcher also follows these alternates to the translated
// page, so a slug page that omits them would switch to a 404. Open Graph images are Phase 5.
export function pageMetadata({ locale, title, description, paths }: PageMeta): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: paths[locale],
      languages: { ...paths, 'x-default': paths[routing.defaultLocale] },
    },
  }
}
