// The 11 built-in service categories (docs/PLAN.md §6). Kept free of icon/UI imports so the
// Payload config can share it with the site.
export const serviceKeys = [
  'interiorExteriorDesign',
  'upholsteryFurniture',
  'repairsInstallations',
  'remodeling',
  'signage',
  'events',
  'lighting',
  'building',
  'moving',
  'packing',
  'transport',
] as const

export type ServiceKey = (typeof serviceKeys)[number]

// Groups for the services index filter (FR-PG-01). Labels live in messages under
// `servicesPage.categories`.
export const serviceCategories = ['design', 'build', 'moving', 'business'] as const

export type ServiceCategory = (typeof serviceCategories)[number]

export const defaultServiceCategory: Record<ServiceKey, ServiceCategory> = {
  interiorExteriorDesign: 'design',
  upholsteryFurniture: 'design',
  lighting: 'design',
  repairsInstallations: 'build',
  remodeling: 'build',
  building: 'build',
  moving: 'moving',
  packing: 'moving',
  transport: 'moving',
  signage: 'business',
  events: 'business',
}

// Lucide icon names editors can pick for a service (rendered by the site's icon map).
export const serviceIcons = [
  'palette',
  'sofa',
  'wrench',
  'hammer',
  'signpost',
  'party-popper',
  'lightbulb',
  'hard-hat',
  'truck',
  'package',
  'car',
  'paint-roller',
  'plug',
  'droplets',
  'shield-check',
] as const

export type ServiceIcon = (typeof serviceIcons)[number]
