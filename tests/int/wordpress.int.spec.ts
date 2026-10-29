import { copyFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

import { htmlText, imageRefs, prepareHtml } from '../../scripts/wordpress/html'
import { altText, runImport } from '../../scripts/wordpress/run'
import type { WordPressSource, WpMedia, WpPost } from '../../scripts/wordpress/source'

const gallery = `
<p>Intro with <a href="https://example.com">a link</a>.</p>
<figure class="wp-block-gallery">
  <figure class="wp-block-image"><a href="/x.jpg"><img data-id="11" src="https://wp.test/a.jpg" class="wp-image-11"></a></figure>
  <figure class="wp-block-image"><img src="https://wp.test/b.jpg" class="wp-image-12"><figcaption>Shop front</figcaption></figure>
</figure>
<h1>Old title</h1>
<p>&nbsp;</p>
<p>Text <img src="https://wp.test/missing.jpg"> after</p>`

describe('WordPress HTML', () => {
  it('decodes entities and keeps words apart across blocks', () => {
    expect(htmlText('Tom&#8217;s &amp; Co')).toBe('Tom’s & Co')
    expect(htmlText('<h3>Different</h3><p>Explain [&hellip;]</p>')).toBe('Different Explain …')
  })

  it('finds images with their attachment id and caption', () => {
    expect(imageRefs(gallery)).toEqual([
      { wpId: 11, src: 'https://wp.test/a.jpg', caption: '' },
      { wpId: 12, src: 'https://wp.test/b.jpg', caption: 'Shop front' },
      { wpId: null, src: 'https://wp.test/missing.jpg', caption: '' },
    ])
  })

  it('turns images into upload nodes and unwraps WordPress blocks', () => {
    const ids: Record<string, number> = { 'https://wp.test/a.jpg': 1, 'https://wp.test/b.jpg': 2 }
    const html = prepareHtml(gallery, (ref) => ids[ref.src] ?? null)
    expect(html).toContain(
      '<img data-lexical-upload-id="1" data-lexical-upload-relation-to="media">',
    )
    expect(html).toContain('data-lexical-upload-id="2"')
    expect(html).toContain('<p><em>Shop front</em></p>')
    expect(html).not.toMatch(/<figure|<h1|missing\.jpg|&nbsp;|<a href="\/x\.jpg"/)
    expect(html).toContain('<h2>Old title</h2>')
    expect(html).toContain('<a href="https://example.com">a link</a>')
  })

  it('writes alt text from the best source available', () => {
    const media = (alt: string, title: string): WpMedia => ({
      id: 1,
      source_url: '',
      alt_text: alt,
      title: { rendered: title },
      caption: { rendered: '' },
      mime_type: 'image/jpeg',
    })
    const ref = { wpId: 1, src: '', caption: '' }
    expect(altText(media('Kitchen', 'x'), ref, 'Post')).toBe('Kitchen')
    expect(altText(media('', 'x'), { ...ref, caption: 'Caption' }, 'Post')).toBe('Caption')
    expect(altText(media('', 'Modern kitchen cabinets Douala'), ref, 'Post')).toBe(
      'Modern kitchen cabinets Douala',
    )
    expect(altText(media('', 'WhatsApp Image 2025-10-25'), ref, 'Post')).toBe('Post')
    expect(altText(media('', 'TY67-1'), ref, 'Post')).toBe('Post')
  })
})

describe('WordPress import', () => {
  let payload: Payload
  const context = { disableRevalidate: true }
  // Unique names, so the run never reuses media another spec uploaded.
  const stamp = Date.now()
  const legacyUrl = `https://handymandoit.com/blog/int-test-${stamp}/`
  const slug = `int-test-wp-${stamp}`
  const categorySlug = `int-test-wp-category-${stamp}`
  const dir = mkdtempSync(path.join(tmpdir(), 'wp-'))
  const image = path.join(dir, `int-test-wp-${stamp}.jpg`)
  copyFileSync(path.resolve('public/brand/og-default.jpg'), image)

  const post: WpPost = {
    id: 1,
    date_gmt: '2024-09-13T04:29:52',
    slug,
    status: 'publish',
    link: legacyUrl,
    title: { rendered: 'Upholstery &amp; you' },
    excerpt: { rendered: '<p>Short intro [&hellip;]</p>' },
    content: {
      rendered: `<p>Body</p><figure class="wp-block-image"><img src="https://wp.test/i.jpg" class="wp-image-7"></figure>`,
    },
    featured_media: 7,
    categories: [3, 1],
  }
  const source: WordPressSource = {
    posts: async () => [post, { ...post, id: 2, status: 'draft', link: `${legacyUrl}draft` }],
    categories: async () => [
      { id: 1, slug: 'uncategorized', name: 'Uncategorized' },
      { id: 3, slug: categorySlug, name: 'News &amp; Updates' },
    ],
    media: async (ids) =>
      ids.map((id) => ({
        id,
        source_url: 'https://wp.test/i.jpg',
        alt_text: '',
        title: { rendered: 'TY67-1' },
        caption: { rendered: '' },
        mime_type: 'image/jpeg',
      })),
    download: async () => image,
  }

  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  afterAll(async () => {
    await payload.delete({ collection: 'posts', where: { slug: { equals: slug } }, context })
    await payload.delete({
      collection: 'categories',
      where: { slug: { equals: categorySlug } },
      context,
    })
    await payload.delete({
      collection: 'media',
      where: { filename: { like: `int-test-wp-${stamp}` } },
      context,
    })
  })

  it('imports published posts once, in English, with their media and categories', async () => {
    const quiet = () => {}
    const first = await runImport(payload, source, { log: quiet })
    expect(first.posts).toEqual({ created: 1, updated: 0, skipped: 0, failed: 0 })
    expect(first.categories.created).toBe(1)
    // The cover and the inline image are the same file: uploaded once.
    expect(first.media.created).toBe(1)

    const second = await runImport(payload, source, { log: quiet })
    expect(second.posts).toEqual({ created: 0, updated: 0, skipped: 1, failed: 0 })
    expect(second.categories).toEqual({ created: 0, updated: 0, skipped: 1, failed: 0 })
    expect(second.media.created).toBe(0)

    const { docs } = await payload.find({
      collection: 'posts',
      where: { legacyUrl: { equals: legacyUrl } },
      locale: 'en',
      depth: 1,
    })
    expect(docs).toHaveLength(1)
    const [doc] = docs
    expect(doc.title).toBe('Upholstery & you')
    expect(doc.excerpt).toBe('Short intro …')
    expect(doc.publishedAt).toBe('2024-09-13T04:29:52.000Z')
    expect(doc._status).toBe('published')
    expect(typeof doc.cover === 'object' && doc.cover?.alt).toBe('Upholstery & you')
    const categories = doc.categories?.map((c) => (typeof c === 'object' ? c.title : c))
    expect(categories).toEqual(['News & Updates'])
    const nodes = doc.content.root.children.map((node) => node.type)
    expect(nodes).toEqual(['paragraph', 'upload'])

    // Payload falls back to the default locale (fr), not to en, so a French read of an English-only
    // article is empty unless the blog pages ask for the English fallback (T-4.07).
    const fr = await payload.findByID({ collection: 'posts', id: doc.id, locale: 'fr', depth: 0 })
    expect(fr.title).toBeFalsy()
    const frWithFallback = await payload.findByID({
      collection: 'posts',
      id: doc.id,
      locale: 'fr',
      fallbackLocale: 'en',
      depth: 0,
    })
    expect(frWithFallback.title).toBe('Upholstery & you')
  }, 120_000)

  it('leaves a post out when one of its images fails, so the next run retries it', async () => {
    const link = `${legacyUrl}broken-image`
    const broken: WordPressSource = {
      ...source,
      posts: async () => [{ ...post, link, slug: `${slug}-broken`, featured_media: 0 }],
      download: async () => {
        throw new Error('timeout')
      },
    }
    const summary = await runImport(payload, broken, { log: () => {} })
    expect(summary.posts.failed).toBe(1)
    expect(summary.media.failed).toBe(1)
    const { totalDocs } = await payload.find({
      collection: 'posts',
      where: { legacyUrl: { equals: link } },
      draft: true,
    })
    expect(totalDocs).toBe(0)
  }, 120_000)
})
