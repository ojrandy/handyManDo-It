import { expect, test } from '@playwright/test'

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
