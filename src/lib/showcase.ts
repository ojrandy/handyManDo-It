import type { ServiceKey } from './services'

// Content taken from the old handymandoit.com (partners, reviews, project photos). It seeds the
// `partners` and `testimonials` collections and service hero photos in Phase 1 (T-1.07), after
// which the home sections read from Payload instead.

export type Partner = {
  key: string
  // Proper noun shown as alt text, as on the old site (Q-10).
  name: string
  logo: string
}

export const partners: readonly Partner[] = [
  { key: 'chef-nina', name: 'Chef Nina’s Cuisine', logo: '/images/partners/chef-nina.webp' },
  { key: 'augma-realty', name: 'AUGMA Realty', logo: '/images/partners/augma-realty.webp' },
  {
    key: 'kukwa-constructions',
    name: 'KUKWA Constructions',
    logo: '/images/partners/kukwa-constructions.webp',
  },
  {
    key: 'spectron-limited',
    name: 'Spectron Limited LLC',
    logo: '/images/partners/spectron-limited.webp',
  },
  { key: 'web-spectron', name: 'Web Spectron', logo: '/images/partners/web-spectron.webp' },
  { key: 'luxecam-tours', name: 'Luxecam Tours Ltd', logo: '/images/partners/luxecam-tours.webp' },
  {
    key: 'kenta-beauty-clinic',
    name: 'Kenta Beauty Clinic',
    logo: '/images/partners/kenta-beauty-clinic.webp',
  },
  {
    key: 'spectron-magazine',
    name: 'Spectron Magazine',
    logo: '/images/partners/spectron-magazine.webp',
  },
]

// Quote text, name, city and service tag live in messages under `testimonials.items.<key>`.
export const testimonials = [
  { key: 'emmanuel', photo: '/images/reviews/emmanuel.webp' },
  { key: 'richard', photo: '/images/reviews/richard.webp' },
  { key: 'solpia', photo: '/images/reviews/solpia.webp' },
  { key: 'mlounge', photo: '/images/reviews/mlounge.webp' },
] as const

// Photos of people doing the work, per service (alt text in messages under
// `servicesSection.photos`). Cropped 3:2 with the subject centred, so the same file holds up on a
// wide tile, a square phone tile and a service page. Placeholders until the owner uploads final
// photos in the CMS (Q-20): packing and transport are Pexels stock, the rest come from the old site.
export const servicePhotos: Partial<
  Record<ServiceKey, { src: string; width: number; height: number }>
> = {
  interiorExteriorDesign: {
    src: '/images/work/at-work-interiorExteriorDesign.webp',
    width: 1050,
    height: 700,
  },
  remodeling: { src: '/images/work/at-work-remodeling.webp', width: 1200, height: 800 },
  upholsteryFurniture: {
    src: '/images/work/at-work-upholsteryFurniture.webp',
    width: 680,
    height: 453,
  },
  repairsInstallations: {
    src: '/images/work/at-work-repairsInstallations.webp',
    width: 958,
    height: 639,
  },
  signage: { src: '/images/work/at-work-signage.webp', width: 1200, height: 800 },
  events: { src: '/images/work/at-work-events.webp', width: 720, height: 480 },
  lighting: { src: '/images/work/at-work-lighting.webp', width: 1200, height: 800 },
  building: { src: '/images/work/at-work-building.webp', width: 900, height: 600 },
  moving: { src: '/images/work/at-work-moving.webp', width: 768, height: 512 },
  packing: { src: '/images/work/at-work-packing.webp', width: 1200, height: 800 },
  transport: { src: '/images/work/at-work-transport.webp', width: 1200, height: 800 },
}

// "From X FCFA" per service (owner question Q-5). Empty until real prices exist; tiles then show
// "Clear price before you book".
export const servicePrices: Partial<Record<ServiceKey, number>> = {}
