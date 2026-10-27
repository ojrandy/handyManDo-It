import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { toRedirectPath } from '@/fields/redirectFrom'

let payload: Payload
const context = { disableRevalidate: true }
const from = '/int-test-redirect/old'

const cleanUp = () =>
  payload.delete({
    collection: 'redirects',
    where: { from: { like: '/int-test-redirect' } },
    context,
  })

describe('redirects', () => {
  beforeAll(async () => {
    payload = await getPayload({ config })
    await cleanUp()
  })

  afterAll(cleanUp)

  it('reduces old URLs to a bare path', () => {
    expect(toRedirectPath('https://handymandoit.com/blog/x/?utm=1#top')).toBe('/blog/x')
    expect(toRedirectPath('/contact-us.html')).toBe('/contact-us.html')
    expect(toRedirectPath('/')).toBe('/')
  })

  it('stores a normalised path and refuses a second rule for the same URL', async () => {
    const doc = await payload.create({
      collection: 'redirects',
      data: {
        from: `https://handymandoit.com${from}/`,
        type: '301',
        to: { type: 'custom', url: '/fr' },
      },
      context,
    })
    expect(doc.from).toBe(from)
    await expect(
      payload.create({
        collection: 'redirects',
        data: { from: `${from}/`, type: '301', to: { type: 'custom', url: '/en' } },
        context,
      }),
    ).rejects.toThrow()
  })

  it('refuses the home page and anonymous writes', async () => {
    await expect(
      payload.create({
        collection: 'redirects',
        data: { from: '/', type: '301', to: { type: 'custom', url: '/fr' } },
        context,
      }),
    ).rejects.toThrow()
    await expect(
      payload.create({
        collection: 'redirects',
        data: { from: '/int-test-redirect/anon', type: '301', to: { type: 'custom', url: '/fr' } },
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })
})
