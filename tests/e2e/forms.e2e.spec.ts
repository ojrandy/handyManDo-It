import { expect, test } from '@playwright/test'

import en from '../../src/messages/en.json'
import fr from '../../src/messages/fr.json'

// Contact, businesses, become a pro, careers and their forms (FR-PG-03/06/10/13, FR-FORM-*;
// T-4.02, T-4.03, T-4.06, T-4.08, T-4.09). The submit test stores one real "E2E Visitor"
// contact entry in the database it runs against.

test.describe('Form pages', () => {
  const pages = [
    ['/fr/contact', fr.contactPage.title],
    ['/en/contact', en.contactPage.title],
    ['/fr/entreprises', fr.businessesPage.title],
    ['/en/businesses', en.businessesPage.title],
    ['/fr/devenir-pro', fr.proPage.title],
    ['/en/become-a-pro', en.proPage.title],
    ['/fr/carrieres', fr.careersPage.title],
    ['/en/careers', en.careersPage.title],
  ] as const

  test('every page renders with its H1, a form and hreflang alternates', async ({ page }) => {
    test.setTimeout(150_000)
    for (const [path, title] of pages) {
      const response = await page.goto(path)
      expect(response?.status(), path).toBe(200)
      await expect(page.getByRole('heading', { level: 1 }), path).toHaveText(title)
      await expect(page.locator('main form'), path).toHaveCount(1)
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]'), path).toHaveCount(1)
    }
  })

  test('errors are announced, linked to their field, and focus the first one', async ({ page }) => {
    await page.goto('/en/contact')
    await page.getByRole('button', { name: en.forms.submit.default }).click()

    await expect(page.getByText(/fields need your attention/)).toBeVisible()
    const name = page.getByLabel(en.forms.fields.name)
    await expect(name).toBeFocused()
    await expect(name).toHaveAttribute('aria-invalid', 'true')
    const errorId = await name.getAttribute('aria-describedby')
    await expect(page.locator(`[id="${errorId}"]`)).toHaveText(en.forms.errors.required)
    await expect(page.getByText(en.forms.errors.consent)).toBeVisible()
  })

  test('a valid message is sent and the success message takes focus', async ({ page }) => {
    await page.goto('/en/contact', { waitUntil: 'load' })
    await page.getByLabel(en.forms.fields.name).fill('E2E Visitor')
    await page.getByLabel(en.forms.fields.email).fill('e2e@example.test')
    await page.getByLabel(en.forms.fields.message).fill('Hello from the end-to-end test.')
    await page.getByRole('checkbox').check()
    // The time-to-submit check refuses forms sent within 3 s of loading.
    await page.waitForTimeout(3_500)
    await page.getByRole('button', { name: en.forms.submit.default }).click()

    const success = page.getByRole('status').filter({ hasText: en.forms.success.title })
    await expect(success).toBeVisible()
    await expect(success).toBeFocused()
  })

  test('a quote link opens the quote form with its service chosen', async ({ page }) => {
    await page.goto('/en/contact?type=quote&service=moving', { waitUntil: 'load' })
    await expect(
      page.getByRole('radio', { name: en.contactPage.chooser['quote-home'] }),
    ).toBeChecked()
    await expect(page.getByLabel(en.forms.labels['quote-home'].message)).toBeVisible()
    await expect(page.getByLabel(en.forms.fields.service)).not.toHaveValue('')
  })

  test('careers takes an open application with a CV; phones get no sideways scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/fr/carrieres')
    const cv = page.getByLabel(fr.forms.fields.cv)
    await expect(cv).toHaveAttribute('type', 'file')
    await expect(cv).toHaveAttribute('accept', '.pdf,.doc,.docx')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  })
})
