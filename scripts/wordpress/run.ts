import { editorConfigFactory } from '@payloadcms/richtext-lexical'
import type { Payload } from 'payload'

import type { Counts } from '../seed/run'
import { findMedia } from '../seed/media'

import { htmlText, htmlToLexical, type ImageRef, imageRefs, prepareHtml } from './html'
import type { WordPressSource, WpMedia, WpPost } from './source'

export const steps = ['categories', 'media', 'posts'] as const
type Step = (typeof steps)[number]
export type Summary = Record<Step, Counts>

export type ImportOptions = {
  // Overwrite posts (and media alt text) that were imported before. Off by default so a re-run
  // never undoes an editor's changes.
  update?: boolean
  log?: (line: string) => void
}

// Imports write many documents; revalidation hooks skip them (src/hooks/revalidate.ts).
const context = { disableRevalidate: true }

// The blog's categories in French; WordPress only had English names. "Uncategorized" is dropped.
const frenchCategoryNames: Record<string, string> = {
  'news-updates': 'Actualités',
  'handyman-infos': 'Infos HandyMan',
}
const skippedCategories = ['uncategorized']

// WordPress leaves alt text empty on this blog. Media titles are often the uploaded file's name
// ("TY67-1", "WhatsApp Image 2025-…"), which says nothing about the picture.
const describes = (title: string) =>
  title.split(' ').length >= 3 && !/whatsapp|screenshot|^img|^dsc|^image/i.test(title)

export function altText(media: WpMedia | undefined, ref: ImageRef, postTitle: string): string {
  const title = media ? htmlText(media.title.rendered) : ''
  return (
    media?.alt_text.trim() ||
    ref.caption ||
    (media && htmlText(media.caption.rendered)) ||
    (describes(title) ? title : '') ||
    postTitle
  )
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

// Articles exist in English only. Posts and media are written in the `en` locale; French pages
// fall back to English (Payload `fallback: true`) until someone translates them in /admin.
export async function runImport(
  payload: Payload,
  source: WordPressSource,
  options: ImportOptions = {},
): Promise<Summary> {
  const { update = false, log = console.log } = options
  const summary = Object.fromEntries(
    steps.map((step) => [step, { created: 0, updated: 0, skipped: 0, failed: 0 }]),
  ) as Summary
  const fail = (step: Step, label: string, error: unknown) => {
    summary[step].failed++
    log(`  ✗ ${step}: ${label}: ${errorMessage(error)}`)
  }

  // --- Categories: matched on the WordPress slug. -------------------------------------------
  const categoryIds = new Map<number, number>()
  for (const category of await source.categories()) {
    if (skippedCategories.includes(category.slug)) continue
    try {
      const name = htmlText(category.name)
      const existing = await payload.find({
        collection: 'categories',
        where: { slug: { equals: category.slug } },
        limit: 1,
        depth: 0,
      })
      let id = existing.docs[0]?.id
      if (id !== undefined && !update) {
        summary.categories.skipped++
      } else {
        const fr = { title: frenchCategoryNames[category.slug] ?? name, slug: category.slug }
        id =
          id === undefined
            ? (await payload.create({ collection: 'categories', locale: 'fr', data: fr, context }))
                .id
            : (
                await payload.update({
                  collection: 'categories',
                  id,
                  locale: 'fr',
                  data: fr,
                  context,
                })
              ).id
        await payload.update({
          collection: 'categories',
          id,
          locale: 'en',
          data: { title: name },
          context,
        })
        summary.categories[existing.docs[0] ? 'updated' : 'created']++
      }
      categoryIds.set(category.id, id)
    } catch (error) {
      fail('categories', category.slug, error)
    }
  }

  // --- Media: downloaded once, uploaded once, found again by file name. ----------------------
  const mediaIds = new Map<string, number | null>()

  async function media(url: string, alt: string): Promise<number | null> {
    const cached = mediaIds.get(url)
    if (cached !== undefined) return cached
    let id: number | null = null
    try {
      const filePath = await source.download(url)
      id = await findMedia(payload, filePath)
      if (id !== null && !update) {
        summary.media.skipped++
      } else if (id !== null) {
        await payload.update({ collection: 'media', id, locale: 'en', data: { alt }, context })
        summary.media.updated++
      } else {
        id = (
          await payload.create({
            collection: 'media',
            locale: 'en',
            data: { alt },
            filePath,
            context,
          })
        ).id
        summary.media.created++
      }
    } catch (error) {
      fail('media', url, error)
    }
    mediaIds.set(url, id)
    return id
  }

  // --- Posts: matched on the old URL. --------------------------------------------------------
  const editorConfig = await editorConfigFactory.default({ config: payload.config })

  async function importPost(post: WpPost, existingId: number | undefined) {
    const title = htmlText(post.title.rendered)
    const refs = imageRefs(post.content.rendered)
    const wpIds = [post.featured_media, ...refs.map(({ wpId }) => wpId)].filter(
      (id): id is number => Boolean(id),
    )
    const wpMedia = new Map((await source.media([...new Set(wpIds)])).map((m) => [m.id, m]))

    const uploaded = new Map<string, number | null>()
    for (const ref of refs) {
      const record = ref.wpId ? wpMedia.get(ref.wpId) : undefined
      const url = record?.source_url ?? ref.src
      if (url) uploaded.set(ref.src, await media(url, altText(record, ref, title)))
    }
    const featured = wpMedia.get(post.featured_media)
    const cover = featured
      ? await media(
          featured.source_url,
          altText(featured, { wpId: null, src: '', caption: '' }, title),
        )
      : null
    // Saved without an image, the post would be skipped on the next run and the image lost.
    const missing =
      [...uploaded.values()].filter((id) => id === null).length +
      (featured && cover === null ? 1 : 0)
    if (missing) throw new Error(`${missing} image(s) failed to import; re-run to retry the post`)

    const html = prepareHtml(post.content.rendered, (ref) => uploaded.get(ref.src) ?? null)
    const data = {
      title,
      slug: post.slug,
      excerpt: htmlText(post.excerpt.rendered),
      cover,
      content: htmlToLexical(html, editorConfig),
      categories: post.categories.flatMap((id) => categoryIds.get(id) ?? []),
      publishedAt: new Date(`${post.date_gmt}Z`).toISOString(),
      legacyUrl: post.link,
      _status: 'published' as const,
    }
    if (existingId === undefined) {
      await payload.create({ collection: 'posts', locale: 'en', data, context })
    } else {
      await payload.update({ collection: 'posts', id: existingId, locale: 'en', data, context })
    }
  }

  const posts = (await source.posts()).filter(({ status }) => status === 'publish')
  for (const [index, post] of posts.entries()) {
    try {
      const existing = await payload.find({
        collection: 'posts',
        where: { legacyUrl: { equals: post.link } },
        limit: 1,
        depth: 0,
        // Match drafts too, so an unpublished import is not created twice.
        draft: true,
      })
      const existingId = existing.docs[0]?.id
      if (existingId !== undefined && !update) {
        summary.posts.skipped++
        continue
      }
      log(`  ${index + 1}/${posts.length} ${post.slug}`)
      await importPost(post, existingId)
      summary.posts[existingId === undefined ? 'created' : 'updated']++
    } catch (error) {
      fail('posts', post.slug, error)
    }
  }

  return summary
}
