// Admin-only strings. They stay out of src/messages so they never reach the public site's client
// bundle (the home page has under 1 KB of JS budget left). The admin itself runs in fr or en.

const en = {
  studio: 'Content studio',
  viewSite: 'View the site',
  greeting: 'Hello',
  intro: 'Everything the site shows lives here. Changes go live within seconds of saving.',
  newPost: 'New article',
  editHome: 'Edit the home page',
  openInbox: 'Open the inbox',
  inboxTitle: 'Inbox',
  inboxNew: 'new',
  inboxAll: 'See all',
  inboxEmpty: 'No messages yet. Form entries from the site land here.',
  inboxDenied: 'You can’t see form entries with this account.',
  contentTitle: 'Site content',
  contentDrafts: 'drafts',
  contentOpen: 'open',
  contentPublished: 'published',
  types: {
    contact: 'Question',
    'quote-home': 'Quote · home',
    'quote-business': 'Quote · business',
    partnership: 'Partnership',
    pro: 'Pro application',
    job: 'Job application',
  },
  statuses: {
    new: 'New',
    'in-progress': 'In progress',
    done: 'Done',
    spam: 'Spam',
  },
  collections: {
    services: 'Services',
    projects: 'Projects',
    posts: 'Articles',
    testimonials: 'Reviews',
    faqs: 'FAQs',
    jobs: 'Jobs',
  },
}

export type AdminCopy = typeof en

const fr: AdminCopy = {
  studio: 'Espace de gestion',
  viewSite: 'Voir le site',
  greeting: 'Bonjour',
  intro:
    'Tout ce que le site affiche se gère ici. Les changements sont en ligne quelques secondes après l’enregistrement.',
  newPost: 'Nouvel article',
  editHome: 'Modifier l’accueil',
  openInbox: 'Ouvrir la boîte de réception',
  inboxTitle: 'Boîte de réception',
  inboxNew: 'nouveaux',
  inboxAll: 'Tout voir',
  inboxEmpty: 'Aucun message pour l’instant. Les formulaires du site arrivent ici.',
  inboxDenied: 'Ce compte ne peut pas voir les formulaires reçus.',
  contentTitle: 'Contenu du site',
  contentDrafts: 'brouillons',
  contentOpen: 'ouvertes',
  contentPublished: 'publiés',
  types: {
    contact: 'Question',
    'quote-home': 'Devis · particulier',
    'quote-business': 'Devis · entreprise',
    partnership: 'Partenariat',
    pro: 'Candidature pro',
    job: 'Candidature emploi',
  },
  statuses: {
    new: 'Nouveau',
    'in-progress': 'En cours',
    done: 'Traité',
    spam: 'Spam',
  },
  collections: {
    services: 'Services',
    projects: 'Réalisations',
    posts: 'Articles',
    testimonials: 'Avis',
    faqs: 'FAQ',
    jobs: 'Offres d’emploi',
  },
}

export type AdminLang = 'en' | 'fr'

export function adminLang(language: string | undefined): AdminLang {
  return language === 'fr' ? 'fr' : 'en'
}

export function adminCopy(language: string | undefined): AdminCopy {
  return adminLang(language) === 'fr' ? fr : en
}
