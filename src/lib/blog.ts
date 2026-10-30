import { cache } from 'react'

import type { Locale } from '@/i18n/routing'
import type { Post } from '@/payload-types'

import { findDocs } from './payload'

// Blog reads (FR-PG-11). Imported posts are English-only, so French pages read them with an
// English fallback (ADR-019).

// Every published post, newest first. 20 today; the index filters them in the browser (ADR-024).
export const getPosts = cache((locale: Locale) =>
  findDocs('posts', locale, { sort: '-publishedAt', fallbackLocale: 'en' }),
)

export const getPost = cache(async (locale: Locale, slug: string) => {
  const [doc] = await findDocs('posts', locale, {
    where: { slug: { equals: slug } },
    limit: 1,
    fallbackLocale: 'en',
  })
  return doc ?? null
})

export const getCategories = cache((locale: Locale) =>
  findDocs('categories', locale, { sort: 'title', fallbackLocale: 'en' }),
)

// Ids of the posts written in `locale`. The others show English text, which the page marks with
// `lang="en"` (WCAG 3.1.2) and a note.
export const getTranslatedPostIds = cache(async (locale: Locale): Promise<Set<number>> => {
  const docs = await findDocs('posts', locale, {
    fallbackLocale: false,
    depth: 0,
  })
  return new Set(docs.filter((doc) => doc.title).map((doc) => doc.id))
})

const categoryIds = (post: Post) =>
  (post.categories ?? []).map((category) => (typeof category === 'object' ? category.id : category))

// Up to three other posts: same category first, then the newest.
export function relatedPosts(post: Post, all: Post[], count = 3): Post[] {
  const mine = new Set(categoryIds(post))
  const others = all.filter((other) => other.id !== post.id)
  const shared = others.filter((other) => categoryIds(other).some((id) => mine.has(id)))
  return [...shared, ...others.filter((other) => !shared.includes(other))].slice(0, count)
}
