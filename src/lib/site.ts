// Single source for contact and distribution defaults. The CMS `site` global is
// seeded from these values; pages read the global once content is wired (Phase 1).
export const site = {
  name: 'HandyMan Do IT',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://handymandoit.com',
  webAppUrl: 'https://app.handymandoit.com',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.handymandoit.app',
  appStoreUrl: 'https://apps.apple.com/app/handyman-do-it/id6820783542',
  phone: '+237652767674',
  phoneDisplay: '+237 652 767 674',
  whatsappUrl: 'https://wa.me/237652767674',
  email: 'handymanservicesdoit@gmail.com',
  socials: {
    facebook: 'https://web.facebook.com/handymandoit',
    instagram: 'https://www.instagram.com/handymandoit',
    x: 'https://twitter.com/handymandoit',
    youtube: 'https://www.youtube.com/handymandoit',
  },
  stats: { towns: 120, years: 6, clients: 79, projects: 38 },
  // Same values as the `site` global's offices default; labels live in messages (footer.offices).
  offices: [
    { key: 'technical', address: 'Mile 16 Shopping Mall', city: 'Buea' },
    { key: 'office', address: 'Mobile Njo Njo, Bonapriso', city: 'Douala' },
  ],
  // Office visiting hours (Q-19) for the LocalBusiness structured data; the text shown on the
  // page lives in messages or the `site` global.
  openingHours: [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], opens: '08:00', closes: '17:00' },
    { days: ['Friday', 'Saturday'], opens: '09:00', closes: '16:00' },
  ],
  // Footer credit. The sentence around the name lives in messages (footer.credit).
  developerUrl: 'https://webspectron.com/',
  // Footer "Sister Products" before any partner exists in the CMS (fresh database). After that,
  // editors choose them with the partner's "Show in footer" box. Names are proper nouns, so they
  // stay out of messages; logos are the square 300 px files the partner marquee already ships.
  groupCompanies: [
    {
      key: 'spectron-limited',
      name: 'Spectron Limited LLC',
      url: 'https://spectronlimitedllc.com/',
      logo: '/images/partners/spectron-limited.webp',
    },
    {
      key: 'spectron-magazine',
      name: 'Spectron Magazine',
      url: 'https://spectronmagazine.com/',
      logo: '/images/partners/spectron-magazine.webp',
    },
    {
      key: 'web-spectron',
      name: 'Web Spectron',
      url: 'https://webspectron.com/',
      logo: '/images/partners/web-spectron.webp',
    },
    {
      key: 'kenta-beauty-clinic',
      name: 'Kenta Beauty Clinic',
      url: 'https://kentabeautyclinic.com/',
      logo: '/images/partners/kenta-beauty-clinic.webp',
    },
  ],
} as const
