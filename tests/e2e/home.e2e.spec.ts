import { expect, test } from '@playwright/test'

import en from '../../src/messages/en.json'
import fr from '../../src/messages/fr.json'

// Phase 3 home sections (FR-HOME-05/06/08/12/13/15) and global footer + WhatsApp (FR-GLB-02/03).
test.describe('Home sections', () => {
  test('every section heading renders in both locales', async ({ page }) => {
    for (const [locale, m] of [
      ['fr', fr],
      ['en', en],
    ] as const) {
      await page.goto(`/${locale}`)
      for (const title of [
        m.trustedBy.label,
        m.servicesSection.title,
        m.pillars.title,
        m.numbers.title,
        m.howItWorks.title,
        m.testimonials.title,
        m.audiences.title,
        m.earn.title,
        m.faq.title,
        m.download.title,
      ]) {
        await expect(page.getByRole('heading', { level: 2, name: title })).toBeVisible()
      }
    }
  })

  test('counters ship their real values in the HTML (no-JS, screen readers)', async ({
    request,
  }) => {
    const html = await (await request.get('/en')).text()
    for (const value of ['120+', '6+', '79+', '38+']) expect(html).toContain(value)
  })

  test('earn tabs follow the ARIA tabs keyboard pattern', async ({ page }) => {
    await page.goto('/en')
    const tabs = page.getByRole('tablist', { name: en.earn.tabsLabel }).getByRole('tab')
    await tabs.first().focus()
    await page.keyboard.press('ArrowRight')
    await expect(tabs.nth(1)).toBeFocused()
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tabpanel')).toContainText(en.earn.tabs.sellers.title)
    await page.keyboard.press('End')
    await expect(tabs.last()).toHaveAttribute('aria-selected', 'true')
  })
})

// Batch 2: trusted by, services bento, testimonials, FAQ (FR-HOME-03/04/11/14).
test.describe('Home content sections', () => {
  test('services bento links every service to its localized page', async ({ page }) => {
    await page.goto('/fr')
    const bento = page.getByRole('region', { name: fr.servicesSection.title })
    await expect(
      bento.getByRole('link', { name: new RegExp(fr.services.moving.name) }),
    ).toHaveAttribute('href', '/fr/services/demenagement')
    await expect(bento.getByRole('img', { name: fr.servicesSection.photos.events })).toBeVisible()
  })

  test('named partner logos have their names as alt text', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByRole('img', { name: 'KUKWA Constructions' })).toBeAttached()
    await expect(page.getByRole('img', { name: 'Spectron Magazine' })).toBeAttached()
  })

  test('testimonials scroll with the next button and keep all quotes in the page', async ({
    page,
  }) => {
    await page.goto('/en')
    const track = page.getByRole('list', { name: en.testimonials.label })
    await expect(track.getByRole('listitem')).toHaveCount(4)
    await track.scrollIntoViewIfNeeded()
    const before = await track.evaluate((el) => el.scrollLeft)
    await page.getByRole('button', { name: en.testimonials.next }).click()
    await expect.poll(() => track.evaluate((el) => el.scrollLeft)).toBeGreaterThan(before)
  })

  test('FAQ opens from the keyboard and ships FAQPage structured data', async ({ page }) => {
    await page.goto('/en')
    const question = page.getByText(en.faq.items.payment.q, { exact: true })
    await question.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByText(en.faq.items.payment.a)).toBeVisible()

    const data = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((scripts) => scripts.map((s) => JSON.parse(s.textContent || '{}')))
    const faq = data.find((d) => d['@type'] === 'FAQPage')
    expect(faq?.mainEntity).toHaveLength(8)
  })
})

test.describe('Footer and WhatsApp', () => {
  test('footer has working contact links and localized columns', async ({ page }) => {
    await page.goto('/fr')
    const footer = page.getByRole('contentinfo')
    await expect(footer.locator('a[href^="tel:+237"]')).toBeVisible()
    await expect(footer.locator('a[href^="mailto:"]')).toBeVisible()
    await expect(footer.getByRole('link', { name: fr.footer.links.privacy })).toHaveAttribute(
      'href',
      '/fr/mentions/confidentialite',
    )
  })

  test('WhatsApp button appears after scrolling past the hero', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/en')
    const fab = page.getByRole('link', { name: en.whatsapp.label })
    await expect(fab).toBeHidden()
    await page.evaluate(() => window.scrollTo(0, 2000))
    await expect(fab).toBeVisible()
    await expect(fab).toHaveAttribute('href', /^https:\/\/wa\.me\//)
  })
})
