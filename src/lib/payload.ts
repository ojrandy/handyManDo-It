import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload, type CollectionSlug, type GlobalSlug, type Where } from 'payload'

import type { Locale } from '@/i18n/routing'

// getPayload() memoises the instance, so this is cheap to call from every Server Component.
export const getPayloadClient = () => getPayload({ config })

// Every read is cached under its collection/global slug as a tag (plus 'media', for populated
// uploads); the hooks in src/hooks/revalidate.ts purge those tags on save. Reads use the public
// access rules
// (`overrideAccess: false`) so drafts and private collections never reach a page.

// `tags` adds the collections a global links to, so renaming a linked doc refreshes the read.
export const getGlobal = <S extends GlobalSlug>(
  slug: S,
  locale: Locale,
  tags: readonly CollectionSlug[] = [],
) =>
  unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      return payload.findGlobal({ slug, locale, depth: 1, overrideAccess: false })
    },
    ['global', slug, locale],
    { tags: [slug, 'media', ...tags] },
  )()

type FindOptions = {
  where?: Where
  sort?: string | string[]
  limit?: number
  depth?: number
  // `false` reads only what exists in `locale` (e.g. to tell English-only posts apart).
  fallbackLocale?: Locale | false
}

export const findDocs = <C extends CollectionSlug>(
  collection: C,
  locale: Locale,
  options: FindOptions = {},
) =>
  unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      const { docs } = await payload.find({
        collection,
        locale,
        depth: 1,
        limit: 100,
        pagination: false,
        ...options,
        overrideAccess: false,
      })
      return docs
    },
    ['find', collection, locale, JSON.stringify(options)],
    { tags: [collection, 'media'] },
  )()
