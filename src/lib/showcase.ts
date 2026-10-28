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

// Real project photos per service (alt text in messages under `servicesSection.photos`). The
// originals are small (500–750 px); higher-resolution files are an owner request.
export const servicePhotos: Partial<
  Record<ServiceKey, { src: string; width: number; height: number }>
> = {
  interiorExteriorDesign: {
    src: '/images/work/interiorExteriorDesign.webp',
    width: 750,
    height: 500,
  },
  remodeling: { src: '/images/work/remodeling.webp', width: 750, height: 500 },
  upholsteryFurniture: { src: '/images/work/upholsteryFurniture.webp', width: 500, height: 500 },
  repairsInstallations: { src: '/images/work/repairsInstallations.webp', width: 500, height: 500 },
  signage: { src: '/images/work/signage.webp', width: 750, height: 500 },
  events: { src: '/images/work/events.webp', width: 750, height: 500 },
  lighting: { src: '/images/work/lighting.webp', width: 750, height: 500 },
  building: { src: '/images/work/building.webp', width: 500, height: 500 },
}

// "From X FCFA" per service (owner question Q-5). Empty until real prices exist; tiles then show
// "Clear price before you book".
export const servicePrices: Partial<Record<ServiceKey, number>> = {}
