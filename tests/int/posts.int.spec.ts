import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

import { paragraph } from '../helpers/richText'

let payload: Payload
const context = { disableRevalidate: true }
const prefix = 'int-test-post'

const cleanUp = async () => {
  await payload.delete({ collection: 'posts', where: { title: { like: prefix } }, context })
  await payload.delete({ collection: 'categories', where: { title: { like: prefix } }, context })
}

const post = (title: string, extra: object = {}) => ({
  title: `${prefix} ${title}`,
  slug: '',
  content: paragraph('Body'),
  ...extra,
})

describe('posts collection', () => {
  beforeAll(async () => {
    payload = await getPayload({ config })
    await cleanUp()
  })

  afterAll(cleanUp)

  it('stamps publishedAt on first publish and keeps an imported date', async () => {
    const fresh = await payload.create({
      collection: 'posts',
      data: post('fresh', { _status: 'published' }),
      context,
    })
    expect(fresh.publishedAt).toBeTruthy()

    const imported = await payload.create({
      collection: 'posts',
      data: post('imported', { _status: 'published', publishedAt: '2021-05-04T00:00:00.000Z' }),
      context,
    })
    expect(imported.publishedAt).toBe('2021-05-04T00:00:00.000Z')
  })

  it('leaves drafts undated and hidden from the public', async () => {
    const draft = await payload.create({
      collection: 'posts',
      data: post('draft', { _status: 'draft' }),
      draft: true,
      context,
    })
    expect(draft.publishedAt).toBeFalsy()
    const { docs } = await payload.find({
      collection: 'posts',
      where: { id: { equals: draft.id } },
      overrideAccess: false,
    })
    expect(docs).toHaveLength(0)
  })

  it('rejects a second post with the same legacy URL', async () => {
    const legacyUrl = 'https://handymandoit.com/blog/int-test-post-legacy/'
    await payload.create({ collection: 'posts', data: post('legacy 1', { legacyUrl }), context })
    await expect(
      payload.create({ collection: 'posts', data: post('legacy 2', { legacyUrl }), context }),
    ).rejects.toThrow()
  })

  it('links categories and lets the public read them', async () => {
    const category = await payload.create({
      collection: 'categories',
      data: { title: `${prefix} Conseils`, slug: '' },
      context,
    })
    expect(category.slug).toBe(`${prefix}-conseils`)
    const linked = await payload.create({
      collection: 'posts',
      data: post('linked', { _status: 'published', categories: [category.id] }),
      context,
    })
    const read = await payload.findByID({
      collection: 'posts',
      id: linked.id,
      overrideAccess: false,
      depth: 1,
    })
    expect(read.categories?.map((c) => typeof c === 'object' && c.slug)).toEqual([
      `${prefix}-conseils`,
    ])
  })
})
