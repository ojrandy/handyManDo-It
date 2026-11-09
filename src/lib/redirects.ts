import { permanentRedirect, redirect } from 'next/navigation'

import { getPathname } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'
import type { Redirect } from '@/payload-types'

import { findDocs } from './payload'

const pathnames = {
  services: '/services/[slug]',
  projects: '/our-work/[slug]',
  posts: '/blog/[slug]',
  jobs: '/careers/[slug]',
} as const

function targetOf(rule: Redirect, locale: Locale): string | null {
  const to = rule.to
  if (to?.type === 'custom') return to.url || null
  const ref = to?.reference
  if (!ref || typeof ref.value !== 'object' || !ref.value?.slug) return null
  return getPathname({
    locale,
    href: { pathname: pathnames[ref.relationTo], params: { slug: ref.value.slug } },
  })
}

/**
 * Editor redirects (CMS "Redirects", T-1.06). Called where a page would otherwise 404 (unknown
 * paths and unknown slugs), so a rule never shadows a live page and costs nothing on normal
 * requests. `from` is stored without a trailing slash (src/fields/redirectFrom.ts) and matches
 * with or without the locale prefix: `/old-page` also catches `/fr/old-page`, which is where the
 * locale middleware sends it. Reads are cached under the `redirects` tag, purged on save.
 */
export async function followEditorRedirect(locale: Locale, path: string) {
  const decoded = decodeURI(path).replace(/\/+$/, '') || '/'
  const bare = decoded.replace(new RegExp(`^/(${routing.locales.join('|')})(?=/|$)`), '') || '/'
  const rules = await findDocs('redirects', locale, { depth: 1 })
  const rule = rules.find(({ from }) => from === decoded || from === bare)
  const target = rule && targetOf(rule, locale)
  if (!rule || !target || target === decoded) return
  if (rule.type === '302') redirect(target)
  permanentRedirect(target)
}
