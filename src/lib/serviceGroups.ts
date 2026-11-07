import type { Locale } from '@/i18n/routing'

import { services, type ServiceKey } from './services'

// The panels of the home services section on phones (FR-HOME-04, ADR-031). Each fills one screen,
// so a group holds at most four services. Titles live in messages under `servicesSection.groups`.
export const serviceGroups = [
  {
    key: 'home',
    services: [
      'interiorExteriorDesign',
      'remodeling',
      'upholsteryFurniture',
      'repairsInstallations',
    ],
  },
  { key: 'projects', services: ['signage', 'events', 'lighting', 'building'] },
  { key: 'moving', services: ['moving', 'packing', 'transport'] },
] as const satisfies readonly { key: string; services: readonly ServiceKey[] }[]

export type ServiceGroupKey = (typeof serviceGroups)[number]['key']

// Sorts tiles into groups by their localized slug, keeping their order within each group. A service
// we can't place (new in the CMS, or renamed) joins the last group, so it is never dropped.
export function groupBySlug<T extends { slug: string }>(
  tiles: readonly T[],
  locale: Locale,
): { key: ServiceGroupKey; tiles: T[] }[] {
  const lastGroup = serviceGroups[serviceGroups.length - 1]
  const groupOf = (slug: string) => {
    const key = services.find((service) => service.slug[locale] === slug)?.key
    const known = serviceGroups.find(({ services: keys }: { services: readonly string[] }) =>
      keys.includes(key ?? ''),
    )
    return known ?? lastGroup
  }
  return serviceGroups
    .map((group) => ({
      key: group.key,
      tiles: tiles.filter((tile) => groupOf(tile.slug) === group),
    }))
    .filter((group) => group.tiles.length > 0)
}
