import type { CollectionConfig, Config, GlobalConfig } from 'payload'

// Admin names in both admin languages (ADR-032). Kept in one map so the collection files stay
// about data; the config applies it. Labels only: no schema change, no migration.

type Pair = { en: string; fr: string }

export const adminGroups = {
  inbox: { en: 'Inbox', fr: 'Boîte de réception' },
  content: { en: 'Content', fr: 'Contenu' },
  marketing: { en: 'Marketing', fr: 'Marketing' },
  company: { en: 'Company', fr: 'Entreprise' },
  settings: { en: 'Settings', fr: 'Paramètres' },
} satisfies Record<string, Pair>

type Group = keyof typeof adminGroups

const collections: Record<string, { singular: Pair; plural: Pair; group: Group }> = {
  submissions: {
    singular: { en: 'Form entry', fr: 'Message reçu' },
    plural: { en: 'Form entries', fr: 'Messages reçus' },
    group: 'inbox',
  },
  files: {
    singular: { en: 'Private file', fr: 'Fichier privé' },
    plural: { en: 'Private files', fr: 'Fichiers privés' },
    group: 'inbox',
  },
  services: {
    singular: { en: 'Service', fr: 'Service' },
    plural: { en: 'Services', fr: 'Services' },
    group: 'content',
  },
  projects: {
    singular: { en: 'Project', fr: 'Réalisation' },
    plural: { en: 'Projects', fr: 'Réalisations' },
    group: 'content',
  },
  posts: {
    singular: { en: 'Article', fr: 'Article' },
    plural: { en: 'Articles', fr: 'Articles' },
    group: 'content',
  },
  categories: {
    singular: { en: 'Category', fr: 'Catégorie' },
    plural: { en: 'Categories', fr: 'Catégories' },
    group: 'content',
  },
  faqs: {
    singular: { en: 'FAQ', fr: 'Question fréquente' },
    plural: { en: 'FAQs', fr: 'FAQ' },
    group: 'content',
  },
  media: {
    singular: { en: 'Media file', fr: 'Média' },
    plural: { en: 'Media', fr: 'Médias' },
    group: 'content',
  },
  testimonials: {
    singular: { en: 'Review', fr: 'Avis' },
    plural: { en: 'Reviews', fr: 'Avis' },
    group: 'marketing',
  },
  partners: {
    singular: { en: 'Partner', fr: 'Partenaire' },
    plural: { en: 'Partners', fr: 'Partenaires' },
    group: 'marketing',
  },
  'app-screens': {
    singular: { en: 'App screen', fr: 'Écran de l’app' },
    plural: { en: 'App screens', fr: 'Écrans de l’app' },
    group: 'marketing',
  },
  team: {
    singular: { en: 'Team member', fr: 'Membre de l’équipe' },
    plural: { en: 'Team', fr: 'Équipe' },
    group: 'company',
  },
  jobs: {
    singular: { en: 'Job', fr: 'Offre d’emploi' },
    plural: { en: 'Jobs', fr: 'Offres d’emploi' },
    group: 'company',
  },
  users: {
    singular: { en: 'User', fr: 'Utilisateur' },
    plural: { en: 'Users', fr: 'Utilisateurs' },
    group: 'settings',
  },
  redirects: {
    singular: { en: 'Redirect', fr: 'Redirection' },
    plural: { en: 'Redirects', fr: 'Redirections' },
    group: 'settings',
  },
}

const globals: Record<string, { label: Pair; group: Group }> = {
  home: { label: { en: 'Home page', fr: 'Page d’accueil' }, group: 'content' },
  site: { label: { en: 'Site settings', fr: 'Réglages du site' }, group: 'settings' },
  navigation: { label: { en: 'Navigation', fr: 'Navigation' }, group: 'settings' },
  seo: { label: { en: 'SEO', fr: 'SEO' }, group: 'settings' },
  legal: { label: { en: 'Legal pages', fr: 'Pages légales' }, group: 'settings' },
}

export function labelCollection(config: CollectionConfig): CollectionConfig {
  const entry = collections[config.slug]
  if (!entry) return config
  return {
    ...config,
    labels: { singular: entry.singular, plural: entry.plural },
    admin: { ...config.admin, group: adminGroups[entry.group] },
  }
}

export function labelGlobal(config: GlobalConfig): GlobalConfig {
  const entry = globals[config.slug]
  if (!entry) return config
  return {
    ...config,
    label: entry.label,
    admin: { ...config.admin, group: adminGroups[entry.group] },
  }
}

const groupOrder = Object.keys(adminGroups) as Group[]
const rank = (group?: Group) => (group ? groupOrder.indexOf(group) : groupOrder.length)

// Last plugin in the config, so it also names what other plugins added (redirects). Sidebar and
// dashboard list groups in the order they first appear, hence the stable sort by group.
export function adminLabels(config: Config): Config {
  const collectionList = (config.collections ?? []).map(labelCollection)
  const globalList = (config.globals ?? []).map(labelGlobal)
  return {
    ...config,
    collections: [...collectionList].sort(
      (a, b) => rank(collections[a.slug]?.group) - rank(collections[b.slug]?.group),
    ),
    globals: [...globalList].sort(
      (a, b) => rank(globals[a.slug]?.group) - rank(globals[b.slug]?.group),
    ),
  }
}
