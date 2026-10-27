import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

let payload: Payload
const context = { disableRevalidate: true }
const prefix = 'int-test-service'

const cleanUp = () =>
  payload.delete({
    collection: 'services',
    where: { title: { like: prefix } },
    context,
  })

describe('services collection', () => {
  beforeAll(async () => {
    payload = await getPayload({ config })
    await cleanUp()
  })

  afterAll(cleanUp)

  it('fills a slug per locale from that locale title', async () => {
    const doc = await payload.create({
      collection: 'services',
      locale: 'fr',
      data: {
        title: `${prefix} Déménagement`,
        slug: '',
        summary: 'fr',
        icon: 'truck',
        _status: 'published',
      },
      context,
    })
    const en = await payload.update({
      collection: 'services',
      id: doc.id,
      locale: 'en',
      data: { title: `${prefix} Moving`, summary: 'en' },
      context,
    })
    expect(doc.slug).toBe(`${prefix}-demenagement`)
    expect(en.slug).toBe(`${prefix}-moving`)
  })

  it('allows the same slug in both locales but not twice in one locale', async () => {
    const doc = await payload.create({
      collection: 'services',
      locale: 'fr',
      data: { title: `${prefix} Transport`, slug: '', summary: 'fr', icon: 'car' },
      context,
    })
    await expect(
      payload.update({
        collection: 'services',
        id: doc.id,
        locale: 'en',
        data: { title: `${prefix} Transport`, summary: 'en' },
        context,
      }),
    ).resolves.toMatchObject({ slug: `${prefix}-transport` })
    await expect(
      payload.create({
        collection: 'services',
        locale: 'fr',
        data: { title: `${prefix} Transport`, slug: '', summary: 'fr', icon: 'car' },
        context,
      }),
    ).rejects.toThrow()
  })

  it('hides drafts from the public and shows them to editors', async () => {
    const draft = await payload.create({
      collection: 'services',
      locale: 'fr',
      data: {
        title: `${prefix} Brouillon`,
        slug: '',
        summary: 'fr',
        icon: 'wrench',
        _status: 'draft',
      },
      draft: true,
      context,
    })
    const publicRead = await payload.find({
      collection: 'services',
      where: { id: { equals: draft.id } },
      overrideAccess: false,
    })
    expect(publicRead.docs).toHaveLength(0)

    const editorRead = await payload.find({
      collection: 'services',
      where: { id: { equals: draft.id } },
      overrideAccess: false,
      user: { id: 0, roles: ['editor'], collection: 'users', email: 'e@x.test' },
      draft: true,
    })
    expect(editorRead.docs).toHaveLength(1)
  })

  it('does not let anonymous visitors write', async () => {
    await expect(
      payload.create({
        collection: 'services',
        data: { title: `${prefix} x`, slug: '', summary: 'x', icon: 'car' },
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })
})
