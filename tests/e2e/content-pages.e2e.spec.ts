import { expect, test, type Page } from '@playwright/test'

import en from '../../src/messages/en.json'
import fr from '../../src/messages/fr.json'

// Our work, reviews, about, FAQ, buildings, shop, food (FR-PG-04/05/07/08/09/12; T-4.02,
// T-4.04, T-4.05). Needs the seeded CMS (npm run seed): 9 projects, 4 reviews, 9 FAQs, 3 team.

const jsonLd = (page: Page) =>
  page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((scripts) => scripts.map((s) => JSON.parse(s.textContent ?? '{}')))

test.describe('Content pages', () => {
  const pages = [
    ['/fr/nos-realisations', fr.workPage.title],
    ['/en/our-work', en.workPage.title],
    ['/fr/avis', fr.reviewsPage.title],
    ['/en/reviews', en.reviewsPage.title],
    ['/fr/a-propos', fr.aboutPage.title],
    ['/en/about', en.aboutPage.title],
    ['/fr/faq', fr.faqPage.title],
    ['/en/faq', en.faqPage.title],
    ['/fr/immeubles', fr.buildingsPage.title],
    ['/en/buildings', en.buildingsPage.title],
    ['/fr/boutique', fr.shopPage.title],
    ['/en/shop', en.shopPage.title],
    ['/fr/repas', fr.foodPage.title],
    ['/en/food', en.foodPage.title],
  ] as const

  test('every page renders with its H1, breadcrumbs and hreflang alternates', async ({ page }) => {
    // 14 pages in one test; the dev server compiles each on first visit.
    test.setTimeout(180_000)
    for (const [path, title] of pages) {
      const response = await page.goto(path)
      expect(response?.status(), path).toBe(200)
      await expect(page.getByRole('heading', { level: 1 }), path).toHaveText(title)
      const label = (path.startsWith('/fr') ? fr : en).breadcrumbs.label
      const crumbs = page.getByRole('navigation', { name: label })
      await expect(crumbs.locator('[aria-current="page"]'), path).toHaveCount(1)
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]'), path).toHaveCount(1)
    }
  })

  test('our work filters by service and opens a case study', async ({ page }) => {
    await page.goto('/en/our-work')
    const cards = page.locator('main ul li a[href^="/en/our-work/"]')
    await expect(cards).toHaveCount(9)
    const events = page
      .getByRole('group', { name: en.workPage.filter.label })
      .getByRole('button', { name: en.services.events.name })
    await events.click()
    await expect(events).toHaveAttribute('aria-pressed', 'true')
    await expect(cards).toHaveCount(4)

    await page.getByRole('link', { name: /Welfare Aid Future/ }).click()
    await expect(page).toHaveURL(/\/en\/our-work\/welfare-aid-future-donation$/)
    await expect(page.getByText('Douala').first()).toBeVisible()
    await expect(page.getByRole('heading', { name: en.workPage.detail.photos })).toBeVisible()
  })

  test('case study language switch follows the translated slug', async ({ page }) => {
    await page.goto('/fr/nos-realisations/studio-dash-media')
    await page.getByRole('banner').getByRole('button', { name: fr.language.en }).first().click()
    await expect(page).toHaveURL(/\/en\/our-work\/dash-media-news-studio$/)
  })

  test('an unknown project is a 404', async ({ page }) => {
    expect((await page.goto('/en/our-work/nope'))?.status()).toBe(404)
  })

  test('reviews carry Review data and no rating until real figures exist', async ({ page }) => {
    await page.goto('/en/reviews')
    await expect(page.locator('main blockquote')).toHaveCount(4)
    const organization = (await jsonLd(page)).find((data) => data['@type'] === 'Organization')
    expect(organization.review).toHaveLength(4)
    expect(organization.aggregateRating).toBeUndefined()
  })

  test('about has the team, #partners and #csr', async ({ page }) => {
    await page.goto('/en/about')
    await expect(page.getByText('Chief Operations')).toBeVisible()
    await expect(page.locator('#partners')).toBeVisible()
    await expect(page.locator('#csr')).toBeVisible()
    await expect(
      page.getByRole('link', {
        name: en.aboutPage.partners.visit.replace('{name}', 'Web Spectron'),
      }),
    ).toHaveAttribute('href', 'https://webspectron.com/')
  })

  test('FAQ groups questions by topic under one FAQPage block', async ({ page }) => {
    await page.goto('/fr/faq')
    await expect(
      page.getByRole('heading', { level: 2, name: fr.faqPage.categories.payments }),
    ).toBeVisible()
    const faqPages = (await jsonLd(page)).filter((data) => data['@type'] === 'FAQPage')
    expect(faqPages).toHaveLength(1)
    expect(faqPages[0].mainEntity).toHaveLength(await page.locator('main details').count())
  })

  test('shop and food link sellers and kitchens to become a pro', async ({ page }) => {
    await page.goto('/en/shop')
    await expect(page.getByRole('link', { name: en.shopPage.sell.cta })).toHaveAttribute(
      'href',
      '/en/become-a-pro',
    )
    await page.goto('/fr/repas')
    await expect(page.getByRole('link', { name: fr.foodPage.sell.cta })).toHaveAttribute(
      'href',
      '/fr/devenir-pro',
    )
  })
})
