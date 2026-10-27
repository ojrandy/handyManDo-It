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
