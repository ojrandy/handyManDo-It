import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

let payload: Payload
const context = { disableRevalidate: true }

describe('home global', () => {
  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  it('serves the published copy, not a newer draft, per language', async () => {
    const hero = (titleStart: string) => ({ hero: { titleStart } })
    await payload.updateGlobal({
      slug: 'home',
      locale: 'fr',
      data: { ...hero('Publié'), _status: 'published' },
      context,
    })
    await payload.updateGlobal({
      slug: 'home',
      locale: 'en',
      data: { ...hero('Published'), _status: 'published' },
      context,
    })
    await payload.updateGlobal({
      slug: 'home',
      locale: 'fr',
      data: { ...hero('Brouillon'), _status: 'draft' },
      draft: true,
      context,
    })

    const fr = await payload.findGlobal({ slug: 'home', locale: 'fr', overrideAccess: false })
    const en = await payload.findGlobal({ slug: 'home', locale: 'en', overrideAccess: false })
    const draft = await payload.findGlobal({ slug: 'home', locale: 'fr', draft: true })
    expect(fr.hero?.titleStart).toBe('Publié')
    expect(en.hero?.titleStart).toBe('Published')
    expect(draft.hero?.titleStart).toBe('Brouillon')
  })

  it('keeps hero cues per language with a required time', async () => {
    await expect(
      payload.updateGlobal({
        slug: 'home',
        locale: 'fr',
        data: { hero: { titleStart: 'x', cues: [{ title: 'Devis' }] } } as never,
        context,
      }),
    ).rejects.toThrow()
  })
})
