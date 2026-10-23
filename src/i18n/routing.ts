import { defineRouting } from 'next-intl/routing'

export const locales = ['fr', 'en'] as const
export type Locale = (typeof locales)[number]

// French is the default (Douala and Yaoundé are mostly francophone); English
// visitors are detected from Accept-Language and remembered in a cookie.
export const routing = defineRouting({
  locales,
  defaultLocale: 'fr',
  localePrefix: 'always',
  pathnames: {
    '/': '/',
    '/services': '/services',
    '/services/[slug]': '/services/[slug]',
    '/businesses': { fr: '/entreprises', en: '/businesses' },
    '/buildings': { fr: '/immeubles', en: '/buildings' },
    '/shop': { fr: '/boutique', en: '/shop' },
    '/food': { fr: '/repas', en: '/food' },
    '/become-a-pro': { fr: '/devenir-pro', en: '/become-a-pro' },
    '/our-work': { fr: '/nos-realisations', en: '/our-work' },
    '/our-work/[slug]': { fr: '/nos-realisations/[slug]', en: '/our-work/[slug]' },
    '/reviews': { fr: '/avis', en: '/reviews' },
    '/about': { fr: '/a-propos', en: '/about' },
    '/careers': { fr: '/carrieres', en: '/careers' },
    '/careers/[slug]': { fr: '/carrieres/[slug]', en: '/careers/[slug]' },
    '/blog': '/blog',
    '/blog/[slug]': '/blog/[slug]',
    '/faq': '/faq',
    '/contact': '/contact',
    '/legal/privacy': { fr: '/mentions/confidentialite', en: '/legal/privacy' },
    '/legal/terms': { fr: '/mentions/conditions', en: '/legal/terms' },
    '/legal/disclaimer': { fr: '/mentions/avertissement', en: '/legal/disclaimer' },
  },
})

export type Pathname = keyof typeof routing.pathnames
