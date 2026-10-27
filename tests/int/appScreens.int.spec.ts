import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

let payload: Payload
let imageId: number
const context = { disableRevalidate: true }
const alt = 'int-test-screen'

const cleanUp = async () => {
  await payload.delete({ collection: 'app-screens', where: { key: { equals: 'wallet' } }, context })
  await payload.delete({ collection: 'media', where: { alt: { equals: alt } }, context })
}

describe('app screens', () => {
  beforeAll(async () => {
    payload = await getPayload({ config })
    await cleanUp()
    const image = await payload.create({
      collection: 'media',
      data: { alt },
      file: {
        data: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
          'base64',
        ),
        mimetype: 'image/png',
        name: `${alt}.png`,
        size: 68,
      },
      context,
    })
    imageId = image.id
  })

  afterAll(cleanUp)

  it('allows one screenshot per screen, language and theme', async () => {
    const screen = { key: 'wallet', lang: 'fr', image: imageId } as const
    await payload.create({
      collection: 'app-screens',
      data: { ...screen, theme: 'light' },
      context,
    })
    await payload.create({ collection: 'app-screens', data: { ...screen, theme: 'dark' }, context })
    await payload.create({
      collection: 'app-screens',
      data: { ...screen, lang: 'en', theme: 'light' },
      context,
    })
    await expect(
      payload.create({ collection: 'app-screens', data: { ...screen, theme: 'light' }, context }),
    ).rejects.toThrow()
  })
})
