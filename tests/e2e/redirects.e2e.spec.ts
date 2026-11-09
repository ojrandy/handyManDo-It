import { expect, test } from '@playwright/test'

import { legacyRedirectSamples } from '../../src/lib/legacyRedirects'

// QA-AUTO-05 (FR-SEO-05): every old handymandoit.com URL answers one 301 straight to its new
// page, and that page exists. Read from the same table next.config.ts serves.
test.describe('Legacy redirects', () => {
  for (const [from, to] of legacyRedirectSamples) {
    test(`${from} → ${to}`, async ({ request, baseURL }) => {
      const response = await request.get(from, { maxRedirects: 0 })
      expect(response.status()).toBe(301)
      const location = new URL(response.headers()['location'], baseURL)
      const expected = new URL(to, baseURL)
      expect(location.toString()).toBe(expected.toString())

      // Single hop: an internal target answers 200 itself (no second redirect).
      if (expected.origin === new URL(baseURL!).origin) {
        const target = await request.get(expected.pathname, { maxRedirects: 0 })
        expect(target.status(), `${expected.pathname} answers itself`).toBe(200)
      }
    })
  }

  test('a new-site path with a trailing slash loses it in one hop', async ({ request }) => {
    const response = await request.get('/fr/services/', { maxRedirects: 0 })
    expect(response.status()).toBe(308)
    expect(response.headers()['location']).toMatch(/\/fr\/services$/)
  })

  test('/blog and /shop without a slash still follow the visitor language', async ({ request }) => {
    for (const [path, target] of [
      ['/blog', '/fr/blog'],
      ['/shop', '/fr/boutique'],
    ]) {
      const response = await request.get(path, {
        maxRedirects: 0,
        headers: { 'accept-language': 'fr' },
      })
      expect(response.status()).toBeGreaterThanOrEqual(300)
      expect(response.status()).toBeLessThan(400)
      expect(new URL(response.headers()['location'], 'http://x').pathname).toBe(target)
    }
  })
})
