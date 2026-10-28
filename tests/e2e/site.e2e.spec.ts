import { expect, test } from '@playwright/test'

import en from '../../src/messages/en.json'
import fr from '../../src/messages/fr.json'

// QA-AUTO-03: public smoke checks in both locales.
test.describe('Public site', () => {
  test('/ redirects to the browser language', async ({ browser }) => {
    for (const locale of ['fr', 'en'] as const) {
      const context = await browser.newContext({ locale })
      const page = await context.newPage()
      await page.goto('/')
      await expect(page).toHaveURL(new RegExp(`/${locale}$`))
      await context.close()
    }
  })

  for (const [locale, messages] of [
    ['fr', fr],
    ['en', en],
  ] as const) {
    test(`/${locale} renders the home page in ${locale}`, async ({ page }) => {
      const response = await page.goto(`/${locale}`)
      expect(response?.status()).toBe(200)
      await expect(page.locator('html')).toHaveAttribute('lang', locale)
      await expect(page.getByRole('heading', { level: 1 })).toContainText(messages.hero.titleStart)
    })

    test(`unknown /${locale} path shows the localized 404`, async ({ page }) => {
      const response = await page.goto(`/${locale}/this-page-does-not-exist`)
      expect(response?.status()).toBe(404)
      await expect(page.locator('html')).toHaveAttribute('lang', locale)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(messages.notFound.title)
      await expect(page.getByRole('link', { name: messages.notFound.home })).toHaveAttribute(
        'href',
        `/${locale}`,
      )
    })
  }

  test('language switcher moves between the equivalent pages', async ({ page }) => {
    await page.goto('/fr')
    // The footer has a second switcher; use the header's.
    await page.getByRole('banner').getByRole('button', { name: fr.language.en }).click()
    await expect(page).toHaveURL(/\/en$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('sends the security headers (NFR-SEC-01)', async ({ request }) => {
    const response = await request.get('/fr')
    const headers = response.headers()
    expect(headers['content-security-policy']).toContain("frame-ancestors 'self'")
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['x-powered-by']).toBeUndefined()
  })

  test('the admin is not covered by the site CSP', async ({ request }) => {
    // Under `next dev` the first /admin/login compile takes about 30 s.
    test.slow()
    const response = await request.get('/admin/login', { timeout: 80_000 })
    expect(response.headers()['content-security-policy']).toBeUndefined()
    expect(response.headers()['x-frame-options']).toBe('SAMEORIGIN')
  })
})
