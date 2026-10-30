import { cache } from 'react'

import type { Locale } from '@/i18n/routing'
import type { Site } from '@/payload-types'

import { getGlobal } from './payload'
import { site } from './site'

export type Office = {
  key: string
  // Null while the global has no offices: the footer then labels the defaults from messages.
  label: string | null
  address: string
  city: string
  mapUrl: string | null
}

export type Social = { key: 'facebook' | 'instagram' | 'x' | 'youtube'; label: string; url: string }

const socialLabels = { facebook: 'Facebook', instagram: 'Instagram', x: 'X', youtube: 'YouTube' }

const isWebUrl = (value: string | null | undefined): value is string =>
  Boolean(value && /^https?:\/\/\S+$/.test(value))

// `tel:` wants digits only; the global stores the number as displayed.
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`

// The `site` global (contact, app links, stats, socials) merged over the src/lib/site defaults.
// Header, footer and the home sections share one read per render (T-1.15, T-1.17).
export const getSiteSettings = cache(async (locale: Locale) =>
  siteSettingsFrom(await getGlobal('site', locale)),
)

export function siteSettingsFrom(doc: Partial<Site>) {
  const phone = doc.phone || site.phoneDisplay
  return {
    webAppUrl: doc.webAppUrl || site.webAppUrl,
    playStoreUrl: doc.playStoreUrl || site.playStoreUrl,
    appStoreUrl: doc.appStoreUrl || site.appStoreUrl,
    // Both empty until the Play Store figures are confirmed (Q-6): ratings stay hidden.
    rating: doc.rating ?? null,
    reviewCount: doc.reviewCount ?? null,
    stats: {
      towns: doc.towns ?? site.stats.towns,
      years: doc.years ?? site.stats.years,
      clients: doc.clients ?? site.stats.clients,
      projects: doc.projects ?? site.stats.projects,
    },
    phone: { display: phone, href: telHref(phone) },
    whatsappUrl: doc.whatsappUrl || site.whatsappUrl,
    email: doc.email || site.email,
    // Null keeps the messages copy, which is translated.
    hours: doc.hours?.trim() || null,
    offices: doc.offices?.length
      ? doc.offices.map<Office>(({ id, label, address, city, mapUrl }, index) => ({
          key: id ?? String(index),
          label,
          address,
          city,
          mapUrl: isWebUrl(mapUrl) ? mapUrl : null,
        }))
      : site.offices.map<Office>(({ key, address, city }) => ({
          key,
          label: null,
          address,
          city,
          mapUrl: null,
        })),
    // The global's defaults fill these until an editor saves; an emptied field hides its link.
    socials: (Object.keys(socialLabels) as Social['key'][]).flatMap<Social>((key) =>
      isWebUrl(doc[key]) ? [{ key, label: socialLabels[key], url: doc[key] }] : [],
    ),
  }
}
