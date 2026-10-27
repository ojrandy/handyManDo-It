import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

let payload: Payload
const context = { disableRevalidate: true }
const editor = { id: 0, roles: ['editor'], collection: 'users', email: 'e@x.test' } as const

describe('navigation and seo globals', () => {
  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  afterAll(async () => {
    await payload.updateGlobal({
      slug: 'navigation',
      data: { header: [], footerColumns: [] },
      context,
    })
  })

  it('lets editors edit the menu and stores each link kind', async () => {
    const nav = await payload.updateGlobal({
      slug: 'navigation',
      overrideAccess: false,
      user: editor,
      context,
      data: {
        header: [
          { link: { label: 'Entreprises', type: 'page', page: '/businesses' } },
          { link: { label: 'Partenaire', type: 'external', url: 'https://example.com' } },
        ],
      },
    })
    expect(nav.header?.map((item) => item.link.type)).toEqual(['page', 'external'])
  })

  it('rejects a link without its target', async () => {
    await expect(
      payload.updateGlobal({
        slug: 'navigation',
        context,
        data: { header: [{ link: { label: 'Vide', type: 'external', url: 'example.com' } }] },
      }),
    ).rejects.toThrow()
    await expect(
      payload.updateGlobal({
        slug: 'navigation',
        context,
        data: { header: [{ link: { label: 'Vide', type: 'page' } }] },
      }),
    ).rejects.toThrow()
  })

  it('keeps SEO settings admin-only and public to read', async () => {
    await expect(
      payload.updateGlobal({
        slug: 'seo',
        overrideAccess: false,
        user: editor,
        context,
        data: { defaultTitle: 'x', defaultDescription: 'x' },
      }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(payload.findGlobal({ slug: 'seo', overrideAccess: false })).resolves.toBeDefined()
    await expect(
      payload.findGlobal({ slug: 'navigation', overrideAccess: false }),
    ).resolves.toBeDefined()
  })
})
