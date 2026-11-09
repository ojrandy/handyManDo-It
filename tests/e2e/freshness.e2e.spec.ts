import { expect, test, type APIRequestContext } from '@playwright/test'

import { cleanupTestUser, seedTestUser, testUser } from '../helpers/seedUser'

// FR-CMS-04: a CMS save reaches the public site without a rebuild, and open pages pick it up
// without a reload (ADR-033). Edits go through the REST API so Payload's hooks run inside the
// Next server, as they do for an editor in /admin.

const stamp = Date.now().toString(36)
const created: string[] = []

const paragraph = (text: string) => ({
  root: {
    type: 'root',
    version: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    children: [
      {
        type: 'paragraph',
        version: 1,
        direction: 'ltr',
        format: '',
        indent: 0,
        children: [
          { type: 'text', version: 1, text, format: 0, detail: 0, mode: 'normal', style: '' },
        ],
      },
    ],
  },
})

async function authHeaders(request: APIRequestContext) {
  const res = await request.post('/api/users/login', { data: testUser })
  expect(res.ok()).toBeTruthy()
  const { token } = (await res.json()) as { token: string }
  return { authorization: `JWT ${token}` }
}

async function publishPost(request: APIRequestContext, slug: string, title: string) {
  const res = await request.post('/api/posts?locale=fr', {
    headers: await authHeaders(request),
    data: { title, slug, excerpt: title, content: paragraph(title), _status: 'published' },
  })
  expect(res.status()).toBe(201)
  const { doc } = (await res.json()) as { doc: { id: string } }
  created.push(String(doc.id))
}

test.describe('CMS changes reach the site', () => {
  test.beforeAll(async () => {
    test.setTimeout(120_000)
    await seedTestUser()
  })

  test.afterAll(async ({ request }) => {
    const headers = await authHeaders(request)
    for (const id of created) await request.delete(`/api/posts/${id}`, { headers })
    await cleanupTestUser()
  })

  test('an article published after the build has its own page', async ({ request }) => {
    test.slow()
    const slug = `e2e-new-${stamp}`
    await publishPost(request, slug, `E2E new ${stamp}`)
    const res = await request.get(`/fr/blog/${slug}`)
    expect(res.status()).toBe(200)
    expect(await res.text()).toContain(`E2E new ${stamp}`)
  })

  test('an unknown slug is still a 404', async ({ request }) => {
    const res = await request.get(`/fr/blog/does-not-exist-${stamp}`)
    expect(res.status()).toBe(404)
  })

  test('a partner ticked as a sister product shows in the footer', async ({ request }) => {
    test.slow()
    const headers = await authHeaders(request)
    const name = 'Luxecam Tours Ltd'
    const found = await request.get(
      `/api/partners?where[name][equals]=${encodeURIComponent(name)}&depth=0`,
      { headers },
    )
    const [partner] = (
      (await found.json()) as {
        docs: { id: number; url: string | null; sisterProduct: boolean | null }[]
      }
    ).docs
    test.skip(!partner, `needs the seeded partner "${name}"`)

    // A footer logo must lead somewhere: ticking without a link is refused.
    const noLink = await request.patch(`/api/partners/${partner.id}`, {
      headers,
      data: { sisterProduct: true, url: '' },
    })
    expect(noLink.status()).toBe(400)

    const url = `https://e2e-${stamp}.example/`
    try {
      const saved = await request.patch(`/api/partners/${partner.id}`, {
        headers,
        data: { sisterProduct: true, url },
      })
      expect(saved.ok()).toBeTruthy()
      const html = await (await request.get('/en')).text()
      expect(html).toContain(`href="${url}"`)
    } finally {
      await request.patch(`/api/partners/${partner.id}`, {
        headers,
        data: { sisterProduct: partner.sisterProduct ?? false, url: partner.url },
      })
    }
    expect(await (await request.get('/en')).text()).not.toContain(`href="${url}"`)
  })

  test('an open page shows the change without a reload', async ({ page, request }) => {
    test.slow()
    await page.goto('/fr/blog')
    // Set after load: a full reload would wipe it, router.refresh() keeps it.
    await page.evaluate(() => {
      ;(window as unknown as { liveMarker: string }).liveMarker = 'kept'
    })
    // AfterLoad fetches its watcher after the load event; let that settle first.
    await page.waitForLoadState('networkidle')

    const title = `E2E live ${stamp}`
    await publishPost(request, `e2e-live-${stamp}`, title)

    // Coming back to the tab triggers the check (the 30 s timer would too, more slowly).
    await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 15_000 })
    expect(
      await page.evaluate(() => (window as unknown as { liveMarker?: string }).liveMarker),
    ).toBe('kept')
  })
})
