import { expect, test } from '@playwright/test'

import en from '../../src/messages/en.json'
import fr from '../../src/messages/fr.json'

// Services index + detail (FR-PG-01/02, T-4.01). Needs the seeded CMS (npm run seed): the 11
// services with their localized slugs.
test.describe('Services', () => {
  test('index filters by group and announces the count', async ({ page }) => {
    await page.goto('/en/services')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.servicesPage.title)
    const filters = page.getByRole('group', { name: en.servicesPage.filter.label })
    const cards = page.locator('main ul li a[href^="/en/services/"]')
    await expect(cards).toHaveCount(11)

    const moving = filters.getByRole('button', { name: en.servicesPage.categories.moving })
    await moving.click()
    await expect(moving).toHaveAttribute('aria-pressed', 'true')
    await expect(cards).toHaveCount(3)
    await expect(page.getByText('3 services')).toBeVisible()

    await filters.getByRole('button', { name: en.servicesPage.filter.all }).click()
    await expect(cards).toHaveCount(11)
  })

  test('detail page has breadcrumbs, inclusions, the action bar and Service data', async ({
    page,
  }) => {
    const response = await page.goto('/en/services/interior-exterior-design')
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      en.services.interiorExteriorDesign.name,
    )
    const crumbs = page.getByRole('navigation', { name: en.breadcrumbs.label })
    await expect(crumbs.getByRole('link', { name: en.nav.services })).toHaveAttribute(
      'href',
      '/en/services',
    )
    await expect(crumbs.locator('[aria-current="page"]')).toHaveText(
      en.services.interiorExteriorDesign.name,
    )
    await expect(page.getByRole('heading', { name: en.servicesPage.detail.included })).toBeVisible()
    await expect(page.getByText('Space planning')).toBeVisible()

    const bar = page.getByRole('complementary', { name: en.servicesPage.detail.actions })
    await expect(bar.getByRole('link', { name: en.ctaBand.quote })).toHaveAttribute(
      'href',
      /\/en\/contact\?type=quote&service=interiorExteriorDesign/,
    )

    const types = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((scripts) => scripts.map((s) => JSON.parse(s.textContent ?? '{}')['@type']))
    expect(types).toEqual(expect.arrayContaining(['Service', 'BreadcrumbList']))
  })

  test('language switch follows the translated slug', async ({ page }) => {
    await page.goto('/fr/services/demenagement')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(fr.services.moving.name)
    await page.getByRole('banner').getByRole('button', { name: fr.language.en }).first().click()
    await expect(page).toHaveURL(/\/en\/services\/moving$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.services.moving.name)
  })

  test('an unknown service is a 404', async ({ page }) => {
    const response = await page.goto('/fr/services/nexiste-pas')
    expect(response?.status()).toBe(404)
  })

  test('phone width: no horizontal scroll, action bar keeps both actions', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/fr/services/demenagement')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
    const bar = page.getByRole('complementary', { name: fr.servicesPage.detail.actions })
    await expect(bar.getByRole('link', { name: fr.ctaBand.quote })).toBeVisible()
  })
})
