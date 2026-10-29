import type { AppScreen } from '../../src/payload-types'

export const appUrl = 'https://app.handymandoit.com'

export type ScreenKey = AppScreen['key']
export type Lang = AppScreen['lang']
export type Theme = AppScreen['theme']

export const langs: readonly Lang[] = ['fr', 'en']
export const themes: readonly Theme[] = ['light', 'dark']

export type ScreenSpec = {
  key: ScreenKey
  // The app routes on the URL hash, read on load.
  hash: string
  // Gallery caption (FR-HOME-10).
  caption: Record<Lang, string>
  // Some screens are one tap away from their hash.
  open?: 'firstCategory' | 'firstPro'
}

// Every screen reachable without signing in (PLAN.md §13). Tracking, wallet, chat and completion
// need an account; the site keeps its HTML rebuilds of those until a demo account exists
// (PLAN.md §13, item 3).
export const screens: readonly ScreenSpec[] = [
  {
    key: 'welcome',
    hash: 'welcome',
    caption: {
      fr: 'Un compte pour réserver ou pour travailler',
      en: 'One account to book or to work',
    },
  },
  {
    key: 'home',
    hash: 'home',
    caption: { fr: 'Tout commence à l’accueil', en: 'Everything starts at home' },
  },
  {
    key: 'services',
    hash: 'services',
    caption: { fr: 'Des centaines de services', en: 'Hundreds of services' },
  },
  {
    key: 'category',
    hash: 'services',
    open: 'firstCategory',
    caption: { fr: 'Décrivez votre besoin', en: 'Describe what you need' },
  },
  {
    key: 'shop',
    hash: 'shop',
    caption: {
      fr: 'La boutique : neuf, reconditionné, occasion',
      en: 'The shop: new, refurbished, used',
    },
  },
  {
    key: 'food',
    hash: 'food',
    caption: { fr: 'Les cuisines du quartier', en: 'Kitchens near you' },
  },
  {
    key: 'help',
    hash: 'help',
    caption: { fr: 'De l’aide tous les jours, 7 h – 21 h', en: 'Help every day, 7 am – 9 pm' },
  },
  {
    // A real pro's public profile, shown with the owner's consent (2026-10-29).
    key: 'pro',
    hash: 'home',
    open: 'firstPro',
    caption: {
      fr: 'Des pros vérifiés, notés par leurs clients',
      en: 'Verified pros, rated by their clients',
    },
  },
]

// iPhone 12–15 logical size at 3× (the `app-screens` image description: 1170×2532).
export const viewport = { width: 390, height: 844 }
export const scale = 3

export const fileName = (key: ScreenKey, lang: Lang, theme: Theme) =>
  `app-${key}-${lang}-${theme}.webp`

const themeName = {
  fr: { light: 'thème clair', dark: 'thème sombre' },
  en: { light: 'light theme', dark: 'dark theme' },
}
const langName = {
  fr: { fr: 'en français', en: 'en anglais' },
  en: { fr: 'in French', en: 'in English' },
}

// Alt text in both site languages, for a screenshot that is itself in one language.
export const altText = (spec: ScreenSpec, lang: Lang, theme: Theme): Record<Lang, string> => ({
  fr: `Écran de l’app HandyMan Do IT : ${spec.caption.fr.toLowerCase()} (${langName.fr[lang]}, ${themeName.fr[theme]})`,
  en: `HandyMan Do IT app screen: ${spec.caption.en.toLowerCase()} (${langName.en[lang]}, ${themeName.en[theme]})`,
})
