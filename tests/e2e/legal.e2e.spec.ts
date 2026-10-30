import { expect, test } from '@playwright/test'

import en from '../../src/messages/en.json'
import fr from '../../src/messages/fr.json'

// Legal pages and the smart store link (FR-PG-14, FR-PG-15, FR-ANA-03; T-4.05, T-4.10). Needs the
// seeded `legal` global (npm run seed).

const android =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'
const iphone =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const desktop =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

test.describe('Legal pages', () => {
  const pages = [
    ['/fr/mentions/confidentialite', fr.legalPage.privacy.title],
    ['/en/legal/privacy', en.legalPage.privacy.title],
    ['/fr/mentions/conditions', fr.legalPage.terms.title],
    ['/en/legal/terms', en.legalPage.terms.title],
    ['/fr/mentions/avertissement', fr.legalPage.disclaimer.title],
    ['/en/legal/disclaimer', en.legalPage.disclaimer.title],
  ] as const

  test('each page renders its CMS text, date and the other two', async ({ page }) => {
    test.setTimeout(120_000)
    for (const [path, title] of pages) {
      const response = await page.goto(path)
      expect(response?.status(), path).toBe(200)
      await expect(page.getByRole('heading', { level: 1 }), path).toHaveText(title)
      expect(await page.locator('main section h2').count(), path).toBeGreaterThan(3)
      const legal = (path.startsWith('/fr') ? fr : en).legalPage
      await expect(
        page.getByRole('navigation', { name: legal.others }).getByRole('link'),
      ).toHaveCount(2)
    }
  })

  test('the footer reaches the privacy policy, and form consent links to it', async ({ page }) => {
    await page.goto('/en/contact')
    await page.locator('main form').getByRole('link', { name: 'privacy policy' }).click()
    await expect(page).toHaveURL(/\/en\/legal\/privacy$/)
  })

  test('an unknown legal page is a 404', async ({ page }) => {
    expect((await page.goto('/en/legal/cookies'))?.status()).toBe(404)
  })
})

test.describe('Smart store link', () => {
  test('Android goes to Google Play with the campaign as referrer', async ({ request }) => {
    const response = await request.get('/download?utm_source=flyer&utm_campaign=buea', {
      headers: { 'user-agent': android },
      maxRedirects: 0,
    })
    expect(response.status()).toBe(302)
    const location = new URL(response.headers().location)
    expect(location.host).toBe('play.google.com')
    expect(location.searchParams.get('id')).toBe('com.handymandoit.app')
    expect(location.searchParams.get('referrer')).toBe('utm_source=flyer&utm_campaign=buea')
    expect(response.headers()['cache-control']).toContain('no-store')
  })

  test('iPhone goes to the web app while there is no App Store link', async ({ request }) => {
    const response = await request.get('/download', {
      headers: { 'user-agent': iphone },
      maxRedirects: 0,
    })
    expect(response.status()).toBe(302)
    expect(response.headers().location).toMatch(
      /^https:\/\/(app\.handymandoit\.com|apps\.apple\.com)/,
    )
  })

  test('desktop goes to the QR page in the browser language', async ({ request, page }) => {
    const response = await request.get('/download?utm_source=site', {
      headers: { 'user-agent': desktop, 'accept-language': 'en-GB,en;q=0.9' },
      maxRedirects: 0,
    })
    expect(response.status()).toBe(302)
    expect(response.headers().location).toBe('/en/get-the-app?utm_source=site')

    const french = await request.get('/download', {
      headers: { 'user-agent': desktop, 'accept-language': 'fr-CM,fr;q=0.9' },
      maxRedirects: 0,
    })
    expect(french.headers().location).toBe('/fr/telecharger')

    await page.goto('/en/get-the-app')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.appPage.title)
    await expect(page.getByRole('img', { name: en.appPage.qrAlt }).locator('svg')).toHaveCount(1)
    await expect(page.getByRole('link', { name: en.appPage.webCta })).toBeVisible()
  })
})
