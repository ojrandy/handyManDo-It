// Seed content for the CMS (T-1.07), built from what the repo already holds: old-site copy in
// messages/*.json and the defaults in src/lib. Pure data, no database, so it can be unit-tested.
import type { Faq, Home, Navigation, Service, Site } from '@/payload-types'
import type { Locale } from '@/i18n/routing'
import { paragraph } from '@/lib/richText'
import type { ServiceKey } from '@/lib/service-keys'
import { services } from '@/lib/services'
import { heroCues } from '@/lib/hero'
import { partners, testimonials } from '@/lib/showcase'
import { site } from '@/lib/site'
import en from '@/messages/en.json'
import fr from '@/messages/fr.json'

export type Localized<T> = Record<Locale, T>

const messages: Localized<typeof en> = { fr, en }

const both = <T>(pick: (m: typeof en) => T): Localized<T> => ({
  fr: pick(messages.fr),
  en: pick(messages.en),
})

// Files under public/. Each one is uploaded once and reused wherever it appears.
export type MediaSeed = {
  file: string
  alt: Localized<string>
}

// ---------------------------------------------------------------------------------------------
// Services (PLAN.md §6). Matched on `key`, which never changes; slugs and titles may.

const serviceIcons: Record<ServiceKey, Service['icon']> = {
  interiorExteriorDesign: 'palette',
  upholsteryFurniture: 'sofa',
  repairsInstallations: 'wrench',
  remodeling: 'hammer',
  signage: 'signpost',
  events: 'party-popper',
  lighting: 'lightbulb',
  building: 'hard-hat',
  moving: 'truck',
  packing: 'package',
  transport: 'car',
}

// The two large tiles of the home bento (PLAN.md §5.4).
const largeServices: readonly ServiceKey[] = ['interiorExteriorDesign', 'remodeling']

type PhotoKey = keyof typeof en.servicesSection.photos

const hasPhoto = (key: ServiceKey): key is PhotoKey => key in en.servicesSection.photos

export type ServiceSeed = {
  key: ServiceKey
  icon: Service['icon']
  size: 'large' | 'small'
  order: number
  title: Localized<string>
  slug: Localized<string>
  summary: Localized<string>
  image: MediaSeed | null
}

export const serviceSeeds: ServiceSeed[] = services.map(({ key, slug }, index) => ({
  key,
  icon: serviceIcons[key],
  size: largeServices.includes(key) ? 'large' : 'small',
  order: (index + 1) * 10,
  title: both((m) => m.services[key].name),
  slug,
  summary: both((m) => m.services[key].blurb),
  // Real project photos exist for 8 of the 11 services; the rest keep the designed tile.
  image: hasPhoto(key)
    ? {
        file: `images/work/${key}.webp`,
        alt: both((m) => m.servicesSection.photos[key]),
      }
    : null,
}))

// ---------------------------------------------------------------------------------------------
// Testimonials (PLAN.md §5.11). Matched on `name`.

const testimonialServices: Record<(typeof testimonials)[number]['key'], ServiceKey> = {
  emmanuel: 'interiorExteriorDesign',
  richard: 'remodeling',
  solpia: 'events',
  mlounge: 'signage',
}

export type TestimonialSeed = {
  name: string
  city: string
  service: ServiceKey
  order: number
  quote: Localized<string>
  photo: MediaSeed
}

export const testimonialSeeds: TestimonialSeed[] = testimonials.map(({ key, photo }, index) => {
  const item = fr.testimonials.items[key]
  return {
    name: item.name,
    city: item.city,
    service: testimonialServices[key],
    order: (index + 1) * 10,
    quote: both((m) => m.testimonials.items[key].quote),
    // A person's or company's name is the meaningful alt for their avatar, in either language.
    photo: { file: photo.replace(/^\//, ''), alt: { fr: item.name, en: item.name } },
  }
})

// ---------------------------------------------------------------------------------------------
// Team (PLAN.md §6, About). Matched on `name`. Roles are not on the old site (Q-16): editors
// replace the placeholder in /admin and later runs leave their edits alone.

export type TeamSeed = {
  name: string
  order: number
  role: Localized<string>
}

const teamRolePlaceholder: Localized<string> = { fr: 'Équipe HandyMan', en: 'HandyMan team' }

export const teamSeeds: TeamSeed[] = ['J. Batholomew', 'Mbeng Nkeng S.', 'ANU Ernest'].map(
  (name, index) => ({ name, order: (index + 1) * 10, role: teamRolePlaceholder }),
)

// ---------------------------------------------------------------------------------------------
// Partners (PLAN.md §5.3), names and logos as on the old site. Matched on the logo file, so an
// editor can rename a partner without a re-run creating it again.

export type PartnerSeed = {
  name: string
  order: number
  logo: MediaSeed
}

export const partnerSeeds: PartnerSeed[] = partners.map(({ name, logo }, index) => ({
  name,
  order: (index + 1) * 10,
  // The partner's name is the logo's alt text in both languages.
  logo: { file: logo.replace(/^\//, ''), alt: { fr: name, en: name } },
}))

// ---------------------------------------------------------------------------------------------
// FAQs (PLAN.md §5.14). Matched on the French question. The home shows one per category.

type FaqKey = keyof typeof en.faq.items

const faqCategories: Record<FaqKey, Faq['category']> = {
  payment: 'payments',
  cities: 'coverage',
  price: 'quotes',
  satisfaction: 'guarantee',
  vetting: 'safety',
  tracking: 'safety',
  pros: 'pros',
  business: 'business',
}

// Home order follows PLAN.md §5.14; tracking is on /faq only so safety appears once.
const homeOrder: readonly (FaqKey | 'cancel')[] = [
  'payment',
  'cities',
  'price',
  'cancel',
  'satisfaction',
  'vetting',
  'pros',
  'business',
  'tracking',
]

export type FaqSeed = {
  key: FaqKey | 'cancel'
  category: Faq['category']
  showOnHome: boolean
  order: number
  question: Localized<string>
  answer: Localized<string>
}

// Policy from the owner (2026-10-28); the old site had no cancellation FAQ. French reviewed in
// T-1.11; native-speaker sign-off is T-6.03.
const cancelFaq: Omit<FaqSeed, 'order' | 'showOnHome'> = {
  key: 'cancel',
  category: 'cancellations',
  question: { fr: 'Puis-je annuler une réservation ?', en: 'Can I cancel a booking?' },
  answer: {
    fr: 'Oui, depuis la réservation dans l’app, tant que le travail n’a pas commencé et que votre pro n’est pas encore en route. Si vous annulez une fois le travail commencé, vous êtes remboursé à hauteur de 50 %. Les remboursements sont versés sur votre portefeuille HandyMan.',
    en: 'Yes, from the booking in the app, as long as the work hasn’t started and your pro isn’t already on the way. If you cancel once the work has started, you’re refunded 50%. Refunds go back to your HandyMan wallet.',
  },
}

export const faqSeeds: FaqSeed[] = homeOrder.map((key, index) => {
  const base =
    key === 'cancel'
      ? cancelFaq
      : {
          key,
          category: faqCategories[key],
          question: both((m) => m.faq.items[key].q),
          answer: both((m) => m.faq.items[key].a),
        }
  return { ...base, showOnHome: key !== 'tracking', order: (index + 1) * 10 }
})

export const faqAnswer = (text: string): Faq['answer'] => paragraph(text)

// ---------------------------------------------------------------------------------------------
// Globals. Builders take one locale; the runner writes fr, then en.

export const filmMedia = {
  video: { file: 'video/brand-intro.mp4', alt: both((m) => m.hero.film.title) },
  poster: { file: 'video/brand-intro-poster.jpg', alt: both((m) => m.hero.film.title) },
} satisfies Record<string, MediaSeed>

type SiteData = Omit<Site, 'id' | 'createdAt' | 'updatedAt'>

export function siteData(locale: Locale): SiteData {
  const m = messages[locale]
  return {
    phone: site.phoneDisplay,
    whatsappUrl: site.whatsappUrl,
    email: site.email,
    hours: m.footer.hours,
    offices: site.offices.map((office) => ({
      label: m.footer.offices[office.key],
      address: office.address,
      city: office.city,
    })),
    webAppUrl: site.webAppUrl,
    playStoreUrl: site.playStoreUrl,
    appStoreUrl: site.appStoreUrl,
    ...site.stats,
    ...site.socials,
  }
}

type NavLink = NonNullable<Navigation['header']>[number]['link']
type NavPage = NonNullable<NavLink['page']>

const pageLink = (label: string, page: NavPage): NavLink => ({ label, type: 'page', page })

const serviceLink = (label: string, id: number): NavLink => ({
  label,
  type: 'doc',
  doc: { relationTo: 'services', value: id },
})

type NavigationData = Pick<Navigation, 'header' | 'footerColumns'>

// Mirrors the current Header and Footer components, so switching them to the global (T-1.15)
// changes nothing visible.
export function navigationData(
  locale: Locale,
  serviceIds: Record<ServiceKey, number>,
): NavigationData {
  const m = messages[locale]
  const serviceLinks = serviceSeeds.map(({ key }) =>
    serviceLink(m.services[key].name, serviceIds[key]),
  )
  const links = (items: [string, NavPage][]) =>
    items.map(([label, page]) => ({ link: pageLink(label, page) }))

  return {
    header: [
      {
        link: pageLink(m.nav.services, '/services'),
        children: serviceSeeds.map(({ key, icon }, index) => ({
          link: serviceLinks[index],
          description: m.services[key].blurb,
          icon,
        })),
      },
      { link: pageLink(m.nav.businesses, '/businesses') },
      { link: pageLink(m.nav.becomeAPro, '/become-a-pro') },
      { link: pageLink(m.nav.ourWork, '/our-work') },
      { link: pageLink(m.nav.about, '/about') },
      { link: pageLink(m.nav.blog, '/blog') },
    ],
    footerColumns: [
      {
        title: m.footer.columns.services,
        links: [
          ...serviceLinks.map((link) => ({ link })),
          { link: pageLink(m.nav.allServices, '/services') },
        ],
      },
      {
        title: m.footer.columns.company,
        links: links([
          [m.footer.links.about, '/about'],
          [m.footer.links.ourWork, '/our-work'],
          [m.footer.links.careers, '/careers'],
          [m.footer.links.blog, '/blog'],
          [m.footer.links.becomeAPro, '/become-a-pro'],
        ]),
      },
      {
        title: m.footer.columns.support,
        links: links([
          [m.footer.links.contact, '/contact'],
          [m.footer.links.faq, '/faq'],
          [m.footer.links.reviews, '/reviews'],
          [m.footer.links.businesses, '/businesses'],
          [m.footer.links.buildings, '/buildings'],
        ]),
      },
      {
        title: m.footer.columns.legal,
        links: links([
          [m.footer.links.privacy, '/legal/privacy'],
          [m.footer.links.terms, '/legal/terms'],
          [m.footer.links.disclaimer, '/legal/disclaimer'],
        ]),
      },
    ],
  }
}

type HomeIcon = NonNullable<NonNullable<NonNullable<Home['hero']>['cues']>[number]['icon']>

const cueIcons: Record<(typeof heroCues)[number]['key'], HomeIcon> = {
  quote: 'badge-check',
  paid: 'shield-check',
  onTheWay: 'navigation',
  finished: 'circle-check',
  released: 'key-round',
}

// Same icons as the Pillars section.
const valueIcons = { punctual: 'clock', polite: 'handshake', professional: 'sparkles' } as const
const trustIcons = {
  verified: 'badge-check',
  held: 'shield-check',
  tracking: 'navigation',
  code: 'key-round',
} as const

const entries = <K extends string, V>(record: Record<K, V>) => Object.entries(record) as [K, V][]

type HomeData = Omit<Home, 'id' | 'createdAt' | 'updatedAt' | '_status'>

export function homeData(locale: Locale, film: { video?: number; poster?: number }): HomeData {
  const m = messages[locale]
  const heading = (section: { eyebrow: string; title: string }) => ({
    eyebrow: section.eyebrow,
    title: section.title,
  })

  return {
    hero: {
      eyebrow: m.hero.eyebrow,
      titleStart: m.hero.titleStart,
      titleHighlight: m.hero.titleHighlight,
      subtitle: m.hero.subtitle,
      values: m.hero.values,
      // Hero footage waits on Q-4; the brand sting opens the film lightbox.
      film: { video: film.video ?? null, poster: film.poster ?? null },
      cues: heroCues.map(({ key, time }) => ({
        time,
        icon: cueIcons[key],
        title: m.hero.cues[key].title,
        body: m.hero.cues[key].body,
      })),
    },
    pillars: {
      ...heading(m.pillars),
      values: entries(valueIcons).map(([key, icon]) => ({ icon, ...m.pillars.values[key] })),
      trustTitle: m.pillars.trustTitle,
      trust: entries(trustIcons).map(([key, icon]) => ({ icon, ...m.pillars.trust[key] })),
    },
    numbers: { ...heading(m.numbers), body: m.numbers.body },
    howItWorks: {
      ...heading(m.howItWorks),
      steps: (['choose', 'book', 'relax'] as const).map((key) => m.howItWorks.steps[key]),
    },
    audiences: {
      ...heading(m.audiences),
      items: (['homes', 'businesses', 'buildings'] as const).map((audience) => ({
        audience,
        title: m.audiences[audience].title,
        points: m.audiences[audience].points.map((text) => ({ text })),
      })),
    },
    earn: {
      ...heading(m.earn),
      body: m.earn.body,
      tabs: (['pros', 'sellers', 'kitchens'] as const).map((key) => ({
        label: m.earn.tabs[key].label,
        title: m.earn.tabs[key].title,
        points: m.earn.tabs[key].points.map((text) => ({ text })),
      })),
      steps: m.earn.steps.map((text) => ({ text })),
    },
    services: heading(m.servicesSection),
    testimonials: heading(m.testimonials),
    faq: heading(m.faq),
    download: {
      ...heading(m.download),
      bodyAndroid: m.download.bodyAndroid,
      bodyAll: m.download.bodyAll,
    },
  }
}
