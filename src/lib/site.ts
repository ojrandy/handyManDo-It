// Single source for contact and distribution defaults. The CMS `site` global is
// seeded from these values; pages read the global once content is wired (Phase 1).
export const site = {
  name: 'HandyMan Do IT',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://handymandoit.com',
  webAppUrl: 'https://app.handymandoit.com',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.handymandoit.app',
  appStoreUrl: '',
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
} as const
