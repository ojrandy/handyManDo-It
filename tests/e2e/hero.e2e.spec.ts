import { expect, test, type Page } from '@playwright/test'

import en from '../../src/messages/en.json'
import fr from '../../src/messages/fr.json'

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

  for (const width of [1280, 1440]) {
    test(`services mega-menu is a full 12-tile grid at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('/en')
      const trigger = page.getByRole('button', { name: en.nav.services, exact: true })
      await trigger.focus()
      await page.keyboard.press('Enter')
      const panelId = await trigger.getAttribute('aria-controls')
      const tiles = page.locator(`[id="${panelId}"] a`)
      await expect(tiles).toHaveCount(12)
      await expect(tiles.last()).toContainText(en.nav.allServices)

      const boxes = await tiles.evaluateAll((links) =>
        links.map((link) => {
          const { x, y, width, height } = link.getBoundingClientRect()
          return { x, y, width, height }
        }),
      )
      expect(new Set(boxes.map(({ x }) => x)).size).toBe(4)
      expect(new Set(boxes.map(({ y }) => y)).size).toBe(3)
      expect(new Set(boxes.map(({ width }) => width)).size).toBe(1)
      expect(new Set(boxes.map(({ height }) => height)).size).toBe(1)
    })
  }

  // French has the longest labels: this row used to wrap and clip its CTA at 1024 px.
  for (const [locale, m] of [
    ['fr', fr],
    ['en', en],
  ] as const) {
    test(`header row fits without wrapping or clipping in ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}`)
      const banner = page.getByRole('banner')
      const row = banner.locator('> div').first()
      const openMenu = page.getByRole('button', { name: m.nav.openMenu })
      const navLink = banner.getByRole('link', { name: m.nav.becomeAPro })

      for (const width of [768, 1024, 1279, 1280, 1440]) {
        await page.setViewportSize({ width, height: 800 })
        expect(await row.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
        if (width < 1280) {
          await expect(openMenu).toBeVisible()
          await expect(navLink).toBeHidden()
        } else {
          await expect(openMenu).toBeHidden()
          // One line: a wrapped label would grow past the links' 44 px minimum.
          expect((await navLink.boundingBox())?.height).toBe(44)
        }
      }
    })
  }

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
    // Notifications wait for the phone's intro, then the second one comes 4 s after the first.
    await expect(phone).toContainText(en.hero.cues.paid.title, { timeout: 20_000 })

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
// A stable connection: Chrome's own estimate changes under load and fires 'change' events.
// Passed as a string: the test loader (tsx/esbuild) adds a `__name` helper to functions, which
// does not exist in the page, so a function here threw and the stub never applied.
const fastNetwork = (page: Page) =>
  page.addInitScript({
    content: `{
      const connection = Object.assign(new EventTarget(), {
        effectiveType: '4g',
        saveData: false,
        type: 'wifi',
      })
      Object.defineProperty(Navigator.prototype, 'connection', { get: () => connection })
    }`,
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

// The hero phone: size, place on small screens, and the app's intro before Home (ADR-028).
test.describe('Hero phone', () => {
  const hero = (page: Page) => page.locator('section[aria-labelledby="hero-title"]')
  const splash = (page: Page) => page.locator('[data-phone-splash]')
  const notifications = (page: Page) => hero(page).locator('.animate-notification-in')
  // offsetWidth: the frame's own width, without the tilt of its parents.
  const phoneWidth = (page: Page) =>
    page.locator('.phone-hero').evaluate((element) => (element as HTMLElement).offsetWidth)

  const connection = (page: Page, values: string) =>
    page.addInitScript({
      content: `{
        const connection = Object.assign(new EventTarget(), ${values})
        Object.defineProperty(Navigator.prototype, 'connection', { get: () => connection })
      }`,
    })

  const videoRequests = (page: Page) => {
    const urls: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('brand-splash.mp4')) urls.push(request.url())
    })
    return urls
  }

  // Playwright's own Chromium has no H.264 and goes straight to Home, which the failure tests
  // below cover. Real playback needs Chrome: E2E_CHANNEL=chrome npm run test:e2e.
  const skipWithoutH264 = async (page: Page) => {
    const type = await page.evaluate(`document.createElement('video').canPlayType('video/mp4')`)
    test.skip(!type, 'this browser has no H.264; run with E2E_CHANNEL=chrome')
  }

  for (const [width, height, expected] of [
    [1280, 800, 323],
    [1440, 900, 371],
    [1920, 1080, 384],
  ] as const) {
    test(`is about ${expected} px wide at ${width}×${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      await page.goto('/en')
      expect(Math.abs((await phoneWidth(page)) - expected)).toBeLessThanOrEqual(1)
    })
  }

  for (const [locale, m] of [
    ['fr', fr],
    ['en', en],
  ] as const) {
    for (const width of [360, 390]) {
      test(`is on the first screen under the CTAs at ${width} px in ${locale}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 844 })
        await page.goto(`/${locale}`, { waitUntil: 'load' })
        const phone = page.locator('.phone-hero')
        const cta = hero(page).getByRole('link', { name: m.hero.primaryCta })
        await expect(cta).toBeInViewport()
        await expect(phone).toBeInViewport()
        expect((await phone.boundingBox())!.y).toBeGreaterThan((await cta.boundingBox())!.y)
        // Longer French copy can leave too little of it in view for the intro to start: it waits
        // for the visitor to scroll, so it is never missed.
        await phone.scrollIntoViewIfNeeded()
        // The only notifications on phones are the ones inside the phone.
        await expect(notifications(page).first()).toBeVisible({ timeout: 15_000 })
        expect(
          await notifications(page)
            .first()
            .evaluate((element) => Boolean(element.closest('.phone-hero'))),
        ).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width,
        )
      })
    }
  }

  test('plays the intro, then opens Home and the notifications', async ({ page }) => {
    await skipWithoutH264(page)
    await fastNetwork(page)
    const requested = videoRequests(page)
    await page.goto('/en', { waitUntil: 'load' })
    const video = splash(page).locator('video')
    await expect(video).toHaveJSProperty('paused', false)
    await expect(video).toHaveJSProperty('muted', true)
    expect(requested.length).toBeGreaterThan(0)
    // While it plays, the app has not opened yet. Read in one go: on a slow machine the clip can
    // end between two separate checks.
    const state = (await page.evaluate(`({
      playing: document.querySelector('[data-phone-splash]').dataset.phoneSplash === 'on',
      count: document.querySelectorAll('.phone-hero .animate-notification-in').length,
    })`)) as { playing: boolean; count: number }
    if (state.playing) expect(state.count).toBe(0)
    // A 4 s clip: no lingering on its last frame. A clip whose `ended` never fired failed here.
    await expect(splash(page)).toHaveAttribute('data-phone-splash', 'done', { timeout: 6_500 })
    await expect(notifications(page).first()).toBeVisible()
  })

  test('plays once per visit', async ({ page }) => {
    await fastNetwork(page)
    await page.goto('/en', { waitUntil: 'load' })
    await expect(splash(page)).toHaveAttribute('data-phone-splash', 'done', { timeout: 15_000 })
    const requested = videoRequests(page)
    await page.reload({ waitUntil: 'load' })
    await expect(splash(page)).toHaveAttribute('data-phone-splash', 'done')
    await expect(notifications(page).first()).toBeVisible()
    expect(requested).toEqual([])
  })

  test('a video that cannot load opens Home instead', async ({ page }) => {
    await fastNetwork(page)
    await page.route('**/brand-splash.mp4', (route) => route.abort())
    await page.goto('/en', { waitUntil: 'load' })
    await expect(splash(page)).toHaveAttribute('data-phone-splash', 'done', { timeout: 6_000 })
    await expect(notifications(page).first()).toBeVisible()
  })

  test('a video that never starts opens Home instead', async ({ page }) => {
    await fastNetwork(page)
    // Never answered: a stalled connection.
    await page.route('**/brand-splash.mp4', () => {})
    await page.goto('/en', { waitUntil: 'commit' })
    await expect(splash(page)).toHaveAttribute('data-phone-splash', 'done', { timeout: 10_000 })
  })

  test('a slow connection gets the poster and downloads no video', async ({ page }) => {
    const requested = videoRequests(page)
    await connection(page, `{ effectiveType: '3g', saveData: false }`)
    await page.goto('/en', { waitUntil: 'load' })
    await expect(splash(page)).toHaveAttribute('data-phone-splash', 'done', { timeout: 6_000 })
    await expect(splash(page).locator('video')).toHaveCount(0)
    expect(requested).toEqual([])
  })

  test('4G on mobile data still plays the intro', async ({ page }) => {
    await connection(page, `{ effectiveType: '4g', saveData: false, type: 'cellular' }`)
    const requested = videoRequests(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/en', { waitUntil: 'load' })
    await expect(splash(page).locator('video')).toBeAttached()
    await expect.poll(() => requested.length).toBeGreaterThan(0)
  })

  test('pause holds the intro', async ({ page }) => {
    await skipWithoutH264(page)
    await fastNetwork(page)
    // Held back until paused: on a slow machine the 4 s clip could end before the click.
    let release = () => {}
    const paused = new Promise<void>((resolve) => (release = resolve))
    await page.route('**/brand-splash.mp4', async (route) => {
      await paused
      await route.continue()
    })
    await page.goto('/en', { waitUntil: 'commit' })
    await page.getByRole('button', { name: en.hero.story.pause }).click()
    release()
    await page.waitForTimeout(7_000)
    await expect(splash(page)).toHaveAttribute('data-phone-splash', 'on')
    await expect(notifications(page)).toHaveCount(0)
    await page.getByRole('button', { name: en.hero.story.play }).click()
    await expect(splash(page)).toHaveAttribute('data-phone-splash', 'done', { timeout: 15_000 })
  })

  test('reduced motion goes straight to Home with no video', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    const requested = videoRequests(page)
    await page.goto('/en', { waitUntil: 'load' })
    await expect(splash(page)).toBeHidden()
    await expect(notifications(page).first()).toBeVisible()
    expect(requested).toEqual([])
    await context.close()
  })
})
