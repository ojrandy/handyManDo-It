import type { ComponentProps } from 'react'
import { cache } from 'react'

import type { Link } from '@/i18n/navigation'
import type { Locale, Pathname } from '@/i18n/routing'
import type { Navigation } from '@/payload-types'

import { getGlobal } from './payload'

type Href = ComponentProps<typeof Link>['href']

// Where a menu entry goes: a site route (resolved per locale by next-intl) or an external URL.
export type LinkTarget = { external: false; href: Href } | { external: true; href: string }

export type NavLink = LinkTarget & { key: string; label: string }

export type NavMenuEntry = NavLink & { description: string | null; icon: string | null }

export type NavItem = NavLink & { children?: NavMenuEntry[] }

export type NavColumn = { key: string; title: string; links: NavLink[] }

type CmsLink = NonNullable<Navigation['header']>[number]['link']
type DocType = NonNullable<CmsLink['doc']>['relationTo']

const docRoutes = {
  services: '/services/[slug]',
  projects: '/our-work/[slug]',
  posts: '/blog/[slug]',
  jobs: '/careers/[slug]',
} as const satisfies Record<DocType, Pathname>

const linkedCollections = Object.keys(docRoutes) as DocType[]

// A `linkField` value as a target. Returns null when it can't be linked yet: a doc that isn't
// published (the public read leaves it unpopulated) or a half-filled row.
export function resolveLink(link: CmsLink | null | undefined): LinkTarget | null {
  switch (link?.type) {
    case 'page':
      return link.page ? { external: false, href: link.page } : null
    case 'doc': {
      const value = link.doc?.value
      if (!link.doc || typeof value !== 'object' || !value?.slug) return null
      const pathname = docRoutes[link.doc.relationTo]
      return { external: false, href: { pathname, params: { slug: value.slug } } }
    }
    case 'external':
      return link.url ? { external: true, href: link.url } : null
    default:
      return null
  }
}

const navLink = (link: CmsLink, key: string): NavLink | null => {
  const target = resolveLink(link)
  return target && link.label ? { ...target, key, label: link.label } : null
}

// Header and footer menus from the `navigation` global (T-1.17). Empty lists mean "not filled
// yet": the header and footer then keep their built-in menus.
export const getNavigation = cache(async (locale: Locale) =>
  navigationFrom(await getGlobal('navigation', locale, linkedCollections)),
)

export function navigationFrom(doc: Pick<Navigation, 'header' | 'footerColumns'>) {
  // The header has one mega-menu panel: only the first item with sub-links opens it.
  let menuTaken = false

  const header = (doc.header ?? []).flatMap<NavItem>((item, index) => {
    const link = navLink(item.link, item.id ?? String(index))
    if (!link) return []
    const children = menuTaken
      ? []
      : (item.children ?? []).flatMap<NavMenuEntry>((child, childIndex) => {
          const entry = navLink(child.link, child.id ?? String(childIndex))
          return entry
            ? [{ ...entry, description: child.description ?? null, icon: child.icon ?? null }]
            : []
        })
    if (!children.length) return [link]
    menuTaken = true
    return [{ ...link, children }]
  })

  const footer = (doc.footerColumns ?? []).flatMap<NavColumn>((column, index) => {
    const links = (column.links ?? []).flatMap((row, linkIndex) => {
      const link = navLink(row.link, row.id ?? String(linkIndex))
      return link ? [link] : []
    })
    return links.length ? [{ key: column.id ?? String(index), title: column.title, links }] : []
  })

  return { header, footer }
}
