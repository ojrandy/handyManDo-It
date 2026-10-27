import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

import { paragraph } from '../helpers/richText'

let payload: Payload
const context = { disableRevalidate: true }
const prefix = 'int-test-rel'
let serviceId: number
let mediaId: number

const cleanUp = async () => {
  for (const collection of ['projects', 'testimonials', 'faqs', 'services'] as const) {
    const field = { testimonials: 'name', faqs: 'question' }[collection as string] ?? 'title'
    await payload.delete({ collection, where: { [field]: { like: prefix } }, context })
  }
  await payload.delete({ collection: 'media', where: { alt: { like: prefix } }, context })
}

// Services list their projects and testimonials through join fields (ADR-017).
describe('service joins', () => {
  beforeAll(async () => {
    payload = await getPayload({ config })
    await cleanUp()
    const media = await payload.create({
      collection: 'media',
      data: { alt: `${prefix} cover` },
      file: {
        // 1×1 transparent PNG
        data: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
          'base64',
        ),
        mimetype: 'image/png',
        name: `${prefix}.png`,
        size: 68,
      },
      context,
    })
    mediaId = media.id
    const service = await payload.create({
      collection: 'services',
      data: {
        title: `${prefix} service`,
        slug: '',
        summary: 's',
        icon: 'car',
        _status: 'published',
      },
      context,
    })
    serviceId = service.id
    const project = {
      slug: '',
      service: serviceId,
      city: 'Douala',
      cover: mediaId,
    }
    await payload.create({
      collection: 'projects',
      data: { ...project, title: `${prefix} published`, _status: 'published' },
      context,
    })
    await payload.create({
      collection: 'projects',
      data: { ...project, title: `${prefix} draft`, _status: 'draft' },
      draft: true,
      context,
    })
    await payload.create({
      collection: 'testimonials',
      data: { name: `${prefix} Emmanuel`, city: 'Yaoundé', quote: 'Top', service: serviceId },
      context,
    })
    await payload.create({
      collection: 'faqs',
      data: {
        question: `${prefix} How long?`,
        answer: paragraph('Two days.'),
        category: 'quotes',
        service: serviceId,
      },
      context,
    })
  })

  afterAll(cleanUp)

  it('lists only published projects and the testimonials to the public', async () => {
    const service = await payload.findByID({
      collection: 'services',
      id: serviceId,
      overrideAccess: false,
      depth: 1,
    })
    const titles = service.projects?.docs?.map((doc) => typeof doc === 'object' && doc.title)
    expect(titles).toEqual([`${prefix} published`])
    expect(service.testimonials?.docs).toHaveLength(1)
    expect(service.faqs?.docs).toHaveLength(1)
  })

  it('refuses a project without a service', async () => {
    await expect(
      payload.create({
        collection: 'projects',
        data: { title: `${prefix} orphan`, slug: '', city: 'Buea', cover: mediaId } as never,
        context,
      }),
    ).rejects.toThrow()
  })

  it('requires an FAQ category', async () => {
    await expect(
      payload.create({
        collection: 'faqs',
        data: { question: `${prefix} x`, answer: paragraph('x') } as never,
        context,
      }),
    ).rejects.toThrow()
  })

  it('keeps ratings within 1–5', async () => {
    await expect(
      payload.create({
        collection: 'testimonials',
        data: { name: `${prefix} x`, city: 'Buea', quote: 'x', rating: 6 },
        context,
      }),
    ).rejects.toThrow()
  })
})
