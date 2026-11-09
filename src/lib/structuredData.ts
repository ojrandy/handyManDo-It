import { cache } from 'react'

import type { Locale } from '@/i18n/routing'

import { getGlobal } from './payload'
import { absoluteUrl } from './seo'
import { getSiteSettings, type Office } from './settings'
import { site } from './site'

// Site-wide structured data (FR-SEO-03, PLAN.md §8). Nodes reference each other by `@id`, so
// Google reads one organisation behind the offices, the app and every page's Service/Article.

const ids = {
  organization: absoluteUrl('/#organization'),
  website: absoluteUrl('/#website'),
  app: absoluteUrl('/#app'),
  office: (key: string) => absoluteUrl(`/#office-${key}`),
}

export const organizationRef = { '@id': ids.organization }

const logo = () => absoluteUrl('/icons/icon-512.png')

export const getStructuredData = cache(async (locale: Locale) => {
  const [seo, settings] = await Promise.all([getGlobal('seo', locale), getSiteSettings(locale)])
  const sameAs = [
    ...(seo.organization?.sameAs ?? []).map(({ url }) => url),
    ...settings.socials.map(({ url }) => url),
    settings.playStoreUrl,
    settings.appStoreUrl,
  ].filter((url, index, all): url is string => Boolean(url) && all.indexOf(url) === index)

  const organization = {
    '@type': 'Organization',
    '@id': ids.organization,
    name: site.name,
    legalName: seo.organization?.legalName || site.name,
    url: absoluteUrl('/'),
    logo: { '@type': 'ImageObject', url: logo(), width: 512, height: 512 },
    email: settings.email,
    telephone: settings.phone.href.replace('tel:', ''),
    ...(seo.organization?.foundingDate
      ? { foundingDate: seo.organization.foundingDate.slice(0, 10) }
      : {}),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: settings.phone.href.replace('tel:', ''),
      email: settings.email,
      areaServed: 'CM',
      availableLanguage: ['French', 'English'],
    },
    sameAs,
  }

  const website = {
    '@type': 'WebSite',
    '@id': ids.website,
    name: site.name,
    url: absoluteUrl('/'),
    inLanguage: ['fr', 'en'],
    publisher: organizationRef,
  }

  const office = (item: Office) => ({
    '@type': 'HomeAndConstructionBusiness',
    '@id': ids.office(item.city.toLowerCase()),
    name: `${site.name} ${item.city}`,
    parentOrganization: organizationRef,
    url: absoluteUrl(`/${locale}`),
    image: logo(),
    telephone: settings.phone.href.replace('tel:', ''),
    email: settings.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: item.address,
      addressLocality: item.city,
      addressCountry: 'CM',
    },
    areaServed: { '@type': 'Country', name: 'Cameroon' },
    ...(item.mapUrl ? { hasMap: item.mapUrl } : {}),
    openingHoursSpecification: site.openingHours.map(({ days, opens, closes }) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: days,
      opens,
      closes,
    })),
  })

  const app = {
    '@type': 'MobileApplication',
    '@id': ids.app,
    name: site.name,
    operatingSystem: 'Android, iOS',
    applicationCategory: 'LifestyleApplication',
    url: settings.webAppUrl,
    installUrl: settings.playStoreUrl,
    downloadUrl: [settings.playStoreUrl, settings.appStoreUrl].filter(Boolean),
    image: logo(),
    inLanguage: ['fr', 'en'],
    publisher: organizationRef,
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'XAF' },
    // Only real store figures (Q-6); without them Google shows no stars, which is fine.
    ...(settings.rating && settings.reviewCount
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: settings.rating,
            ratingCount: settings.reviewCount,
            bestRating: 5,
          },
        }
      : {}),
  }

  return { organization, website, offices: settings.offices.map(office), app }
})

export const graph = (...nodes: Record<string, unknown>[]) => ({
  '@context': 'https://schema.org',
  '@graph': nodes,
})
