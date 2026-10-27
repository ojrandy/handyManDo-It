import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { site } from '@/lib/site'

let payload: Payload

// Smoke checks of the public/anonymous surface. The full role matrix is T-1.12 (QA-AUTO-08).
describe('anonymous access', () => {
  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  it('can read the site global, seeded from lib/site defaults', async () => {
    const global = await payload.findGlobal({ slug: 'site', overrideAccess: false })
    expect(global.webAppUrl).toBe(site.webAppUrl)
  })

  it('can read media', async () => {
    const media = await payload.find({ collection: 'media', overrideAccess: false, limit: 1 })
    expect(media.docs).toBeDefined()
  })

  it('cannot read users', async () => {
    await expect(
      payload.find({ collection: 'users', overrideAccess: false }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('cannot update the site global', async () => {
    await expect(
      payload.updateGlobal({ slug: 'site', data: { phone: '+000' }, overrideAccess: false }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it.each(['team', 'partners'] as const)('can read %s but not write it', async (collection) => {
    const { docs } = await payload.find({ collection, overrideAccess: false, limit: 1 })
    expect(docs).toBeDefined()
    await expect(
      payload.create({
        collection,
        data: { name: 'x', role: 'x', logo: 1 },
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('cannot create media', async () => {
    await expect(
      payload.create({ collection: 'media', data: { alt: 'x' }, overrideAccess: false }),
    ).rejects.toMatchObject({ status: 403 })
  })
})
