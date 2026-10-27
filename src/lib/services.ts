import {
  Car,
  Hammer,
  HardHat,
  Lightbulb,
  Package,
  Palette,
  PartyPopper,
  Signpost,
  Sofa,
  Truck,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

import type { Locale } from '@/i18n/routing'

import type { ServiceKey } from './service-keys'

export type { ServiceKey } from './service-keys'

type Service = {
  key: ServiceKey
  slug: Record<Locale, string>
  icon: LucideIcon
}

// The 11 service categories (docs/PLAN.md §6) with localized slugs. Names and blurbs live in
// messages under `services.<key>`. Seeds the `services` collection in Phase 1 (T-1.01), after
// which the header reads from Payload instead.
export const services: readonly Service[] = [
  {
    key: 'interiorExteriorDesign',
    slug: { fr: 'design-interieur-exterieur', en: 'interior-exterior-design' },
    icon: Palette,
  },
  {
    key: 'upholsteryFurniture',
    slug: { fr: 'tapisserie-mobilier', en: 'upholstery-furniture' },
    icon: Sofa,
  },
  {
    key: 'repairsInstallations',
    slug: { fr: 'reparations-installations', en: 'repairs-installations' },
    icon: Wrench,
  },
  { key: 'remodeling', slug: { fr: 'renovation', en: 'remodeling' }, icon: Hammer },
  { key: 'signage', slug: { fr: 'signaletique', en: 'signage' }, icon: Signpost },
  { key: 'events', slug: { fr: 'evenements', en: 'events' }, icon: PartyPopper },
  { key: 'lighting', slug: { fr: 'eclairage', en: 'lighting' }, icon: Lightbulb },
  { key: 'building', slug: { fr: 'construction', en: 'building' }, icon: HardHat },
  { key: 'moving', slug: { fr: 'demenagement', en: 'moving' }, icon: Truck },
  { key: 'packing', slug: { fr: 'emballage', en: 'packing' }, icon: Package },
  { key: 'transport', slug: { fr: 'transport', en: 'transport' }, icon: Car },
]
