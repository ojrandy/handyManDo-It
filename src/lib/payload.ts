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

export const getGlobal = <S extends GlobalSlug>(slug: S, locale: Locale) =>
  unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      return payload.findGlobal({ slug, locale, depth: 1, overrideAccess: false })
    },
    ['global', slug, locale],
    { tags: [slug, 'media'] },
  )()

type FindOptions = {
  where?: Where
  sort?: string
  limit?: number
  depth?: number
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
