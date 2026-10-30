import { expect, test, type Page } from '@playwright/test'

import en from '../../src/messages/en.json'
import fr from '../../src/messages/fr.json'

// Blog index and article (FR-PG-11, T-4.07). Needs the WordPress import (npm run
// migrate:wordpress): 20 English-only posts in 2 categories.

const jsonLd = (page: Page) =>
  page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((scripts) => scripts.map((s) => JSON.parse(s.textContent ?? '{}')))

const upholsteryGuide =
  'upholstery-mastery-how-to-revitalize-your-furniture-with-expert-craftsmanship'

test.describe('Blog', () => {
  test('index lists every post and filters by search and category', async ({ page }) => {
    await page.goto('/en/blog', { waitUntil: 'load' })
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.blogPage.title)
    const cards = page.locator('main ul > li article')
    await expect(cards).toHaveCount(20)
    await expect(page.getByText('20 articles')).toBeVisible()

    // Accent- and case-insensitive.
    await page.getByLabel(en.blogPage.search).fill('UPHOLSTERY')
    await expect(cards).toHaveCount(3)
    await expect(page.getByText('3 articles')).toBeVisible()

    await page.getByLabel(en.blogPage.search).fill('')
    await page
      .getByRole('group', { name: en.blogPage.filter.label })
      .getByRole('button', { name: 'Handyman Infos' })
      .click()
    await expect(cards).toHaveCount(2)
  })

  test('French index marks English-only posts', async ({ page }) => {
    await page.goto('/fr/blog')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(fr.blogPage.title)
    const first = page.locator('main ul > li article').first()
    await expect(first.getByText(fr.blogPage.englishOnly)).toBeVisible()
    await expect(first.locator('h2')).toHaveAttribute('lang', 'en')
  })

  test('article has its content, related posts and Article data', async ({ page }) => {
    await page.goto(`/en/blog/${upholsteryGuide}`)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Upholstery Mastery')
    await expect(page.locator('article p').first()).toBeVisible()
    await expect(page.getByRole('heading', { name: en.blogPage.detail.related })).toBeVisible()
    const article = (await jsonLd(page)).find((data) => data['@type'] === 'Article')
    expect(article).toMatchObject({ headline: expect.stringContaining('Upholstery Mastery') })
    expect(article.datePublished).toBeTruthy()
    await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute(
      'href',
      new RegExp(`/fr/blog/${upholsteryGuide}$`),
    )
  })

  test('French article page says the text is English and marks its language', async ({ page }) => {
    await page.goto(`/fr/blog/${upholsteryGuide}`)
    await expect(page.getByText(fr.blogPage.detail.englishOnly)).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveAttribute('lang', 'en')
    await expect(page.locator('article div[lang="en"]')).toHaveCount(1)
  })

  test('inline images use the sizes made at upload, lazily', async ({ page }) => {
    await page.goto(
      '/en/blog/professional-carpentry-installations-design-services-for-homes-and-businesses-in-cameroon',
    )
    const images = page.locator('article img')
    expect(await images.count()).toBeGreaterThan(0)
    const first = images.first()
    await expect(first).toHaveAttribute('loading', 'lazy')
    await expect(first).toHaveAttribute('srcset', /\.webp \d+w/)
    await expect(first).not.toHaveAttribute('alt', '')
  })

  test('unknown article is a 404', async ({ page }) => {
    const response = await page.goto('/en/blog/no-such-article')
    expect(response?.status()).toBe(404)
  })
})
