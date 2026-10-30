import { expect, test, type Page } from '@playwright/test'

import en from '../../src/messages/en.json'

// Phase 2: header (FR-GLB-01/04) and synced-story hero (FR-HOME-01/02).
test.describe('Header', () => {
  test('services mega-menu opens and closes from the keyboard', async ({ page }) => {
    await page.goto('/en')
    const trigger = page.getByRole('button', { name: en.nav.services, exact: true })
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    // Scoped to the header: the home services grid has the same link.
    await expect(
      page.getByRole('banner').getByRole('link', { name: new RegExp(en.services.moving.name) }),
    ).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()
  })

  test('mobile menu opens as a dialog and closes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/en')
    await page.getByRole('button', { name: en.nav.openMenu }).click()
    const menu = page.getByRole('dialog', { name: en.nav.main })
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('link', { name: en.nav.becomeAPro })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
  })

  test('"Get the app" opens the QR popover on desktop', async ({ page }) => {
    await page.goto('/en')
    await page.getByRole('banner').getByRole('button', { name: en.nav.getTheApp }).click()
    // Scoped to the popover: the download band shows the same QR further down the page.
    await expect(
      page.locator('[popover]').getByRole('img', { name: en.getTheApp.qrAlt }),
    ).toBeVisible()
  })
})

test.describe('Hero', () => {
  test('lifecycle notifications arrive in order and pause stops them', async ({ page }) => {
    await page.goto('/en')
    // The animated list lives in the aria-hidden phone; the sr-only list is static.
    // Scoped to the hero: the scroll story further down has its own decorative phone list.
    const phone = page.locator('section[aria-labelledby="hero-title"] div[aria-hidden="true"] ol')
    await expect(phone).toContainText(en.hero.cues.paid.title, { timeout: 10_000 })

    await page.getByRole('button', { name: en.hero.story.pause }).click()
    const frozen = await phone.textContent()
    await page.waitForTimeout(5_000)
    expect(await phone.textContent()).toBe(frozen)
    await expect(page.getByRole('button', { name: en.hero.story.play })).toBeVisible()
  })

  test('screen readers get the job story as a list', async ({ page }) => {
    await page.goto('/en')
    const story = page.getByRole('heading', { name: en.hero.story.label })
    await expect(story).toBeAttached()
    await expect(
      page.getByRole('listitem').filter({ hasText: en.hero.cues.released.body }),
    ).toHaveCount(1)
  })

  test('reduced motion requests no video (FR-HOME-02)', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    const media: string[] = []
    page.on('request', (request) => {
      if (request.resourceType() === 'media') media.push(request.url())
    })
    await page.goto('/en', { waitUntil: 'networkidle' })
    // The background footage autoplays; the film lightbox's <video> is preload="none".
    await expect(page.locator('video[autoplay]')).toHaveCount(0)
    expect(media).toEqual([])
    await context.close()
  })
})

// Hero slider of our crews (home.hero.slides, ADR-026). Needs the seeded CMS: 4 slides.
// Headless Chromium reports a 3G connection, which is light-data mode (one still photo, no
// controls, FR-HOME-02); these tests stand in for a 4G visitor.
const fastNetwork = (page: Page) =>
  page.addInitScript(() => {
    // A stable connection: Chrome's own estimate changes under load and fires 'change' events.
    const connection = Object.assign(new EventTarget(), {
      effectiveType: '4g',
      saveData: false,
      type: 'wifi',
    })
    Object.defineProperty(Navigator.prototype, 'connection', { get: () => connection })
  })

test.describe('Hero slider', () => {
  const slider = (page: Page) => page.getByRole('group', { name: en.hero.slider.label })
  const bullet = (page: Page, n: number) =>
    slider(page).getByRole('button', { name: new RegExp(`^Show photo ${n} of 4`) })

  test('bullets switch photos and show the caption', async ({ page }) => {
    await fastNetwork(page)
    await page.goto('/en', { waitUntil: 'load' })
    // Paused, so autoplay can't move between a click and its assertion.
    await page.getByRole('button', { name: en.hero.story.pause }).click()
    await bullet(page, 3).click()
    await expect(bullet(page, 3)).toHaveAttribute('aria-current', 'true')
    await expect(bullet(page, 1)).not.toHaveAttribute('aria-current', 'true')
    await expect(slider(page)).toContainText('Our team after a signage installation')
    await slider(page).getByRole('button', { name: en.hero.slider.next }).click()
    await expect(bullet(page, 4)).toHaveAttribute('aria-current', 'true')
  })

  test('autoplay advances, and pause stops it (WCAG 2.2.2)', async ({ page }) => {
    await fastNetwork(page)
    await page.goto('/en', { waitUntil: 'load' })
    // Autoplay starts once the page has loaded, then shows each photo for 6.5 s.
    await expect(bullet(page, 2)).toHaveAttribute('aria-current', 'true', { timeout: 20_000 })
    await page.getByRole('button', { name: en.hero.story.pause }).click()
    await page.waitForTimeout(8_000)
    await expect(bullet(page, 2)).toHaveAttribute('aria-current', 'true')
  })

  test('phones get the photo and a floating notification, not the phone mock-up', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/en', { waitUntil: 'load' })
    const hero = page.locator('section[aria-labelledby="hero-title"]')
    await expect(hero.locator('ol.space-y-2')).toBeHidden()
    await expect(hero.locator('.animate-notification-in').first()).toBeVisible({ timeout: 10_000 })
    await expect(hero.getByRole('link', { name: en.hero.primaryCta })).toBeInViewport()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  })

  test('reduced motion shows one still photo and no slider controls', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await fastNetwork(page)
    await page.goto('/en', { waitUntil: 'load' })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(slider(page)).toHaveCount(0)
    await expect(
      page.locator('section[aria-labelledby="hero-title"] img[src*="crew-"]'),
    ).toHaveCount(1)
    await context.close()
  })
})
