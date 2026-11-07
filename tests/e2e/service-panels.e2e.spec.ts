import { expect, test, type Page } from '@playwright/test'

import en from '../../src/messages/en.json'
import fr from '../../src/messages/fr.json'

// Service panels on phones (FR-HOME-04, ADR-031).
const phone = { width: 390, height: 844 }
// Only the on-demand timeline chunk selects tiles; the island in first-load JS does not.
const timelineMarker = '[data-panel-tile]'

const section = (page: Page) => page.locator('#services')

// Scrolls to where panel `index` rests.
const scrollToPanel = async (page: Page, index: number) => {
  await page.evaluate((target) => {
    const wrapper = document.querySelector<HTMLElement>('[data-panels-scroll]')
    const stage = document.querySelector<HTMLElement>('[data-panels-stage]')
    if (!wrapper || !stage) throw new Error('panels not found')
    const panels = document.querySelectorAll('[data-panel]').length
    const start = wrapper.getBoundingClientRect().top + window.scrollY - stage.offsetTop
    const top = parseFloat(getComputedStyle(stage).top)
    const range = wrapper.offsetHeight - stage.offsetHeight
    window.scrollTo({ top: start + stage.offsetTop - top + (range * target) / (panels - 1) })
  }, index)
}

const expectShowing = async (page: Page, title: string) => {
  const panel = section(page).locator('[data-panel][data-current]')
  await expect(panel.locator('[data-panel-title]')).toHaveText(title)
  // The scrubbed timeline has settled: the panel's tiles are fully visible.
  await expect
    .poll(() =>
      panel
        .locator('[data-panel-tile]')
        .evaluateAll((tiles) => tiles.every((tile) => getComputedStyle(tile).opacity === '1')),
    )
    .toBe(true)
}

test.describe('Service panels on a phone', () => {
  test.use({ viewport: phone, hasTouch: true })

  for (const [locale, m] of [
    ['fr', fr],
    ['en', en],
  ] as const) {
    test(`scrolling changes panels, both ways, in ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}`)
      await expect(section(page).locator('[data-panel]')).toHaveCount(4)
      await section(page).scrollIntoViewIfNeeded()
      await expect(section(page)).toHaveAttribute('data-gsap', '')

      const titles = [
        m.servicesSection.groups.home,
        m.servicesSection.groups.projects,
        m.servicesSection.groups.moving,
        m.servicesSection.alsoInApp,
      ]
      for (const [index, title] of titles.entries()) {
        await scrollToPanel(page, index)
        await expectShowing(page, title)
      }
      for (const index of [2, 1, 0]) {
        await scrollToPanel(page, index)
        await expectShowing(page, titles[index]!)
      }

      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(phone.width)
    })
  }

  test('the stage fits the screen and the tile on show opens its page', async ({ page }) => {
    await page.goto('/en')
    await section(page).scrollIntoViewIfNeeded()
    await expect(section(page)).toHaveAttribute('data-gsap', '')
    await scrollToPanel(page, 2)
    await expectShowing(page, en.servicesSection.groups.moving)

    const box = await section(page).locator('[data-panels-stage]').boundingBox()
    expect(box!.y).toBeGreaterThanOrEqual(71)
    expect(box!.y + box!.height).toBeLessThanOrEqual(phone.height + 1)

    await section(page)
      .getByRole('link', { name: new RegExp(en.services.packing.name) })
      .tap()
    await expect(page).toHaveURL(/\/en\/services\/packing$/)
  })

  test('photos of far panels wait until their panel is close', async ({ page }) => {
    await page.goto('/en')
    // Straight to the first panel: scrolling the tall section into view can land on a later one,
    // which rightly loads these photos.
    await scrollToPanel(page, 0)
    await expectShowing(page, en.servicesSection.groups.home)
    const moving = section(page).getByRole('img', { name: en.servicesSection.photos.moving })
    await expect(moving).toHaveJSProperty('complete', false)
    await scrollToPanel(page, 1)
    await expect
      .poll(() => moving.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0)
  })

  test('keyboard focus brings a hidden panel up', async ({ page }) => {
    await page.goto('/en')
    await section(page).scrollIntoViewIfNeeded()
    await expect(section(page)).toHaveAttribute('data-gsap', '')
    await scrollToPanel(page, 0)
    await section(page)
      .getByRole('link', { name: new RegExp(en.servicesSection.food.name) })
      .focus()
    await expectShowing(page, en.servicesSection.alsoInApp)
  })

  test('the panels still change if GSAP fails to load', async ({ page }) => {
    await page.route('**/_next/**/*.js*', async (route) => {
      const response = await route.fetch()
      const body = await response.text()
      if (body.includes(timelineMarker)) return route.abort()
      return route.fulfill({ response, body })
    })
    await page.goto('/en')
    await section(page).scrollIntoViewIfNeeded()
    await scrollToPanel(page, 1)
    await expectShowing(page, en.servicesSection.groups.projects)
    await expect(section(page)).not.toHaveAttribute('data-gsap', '')
    // Later chunks may still be in flight when the page closes.
    await page.unrouteAll({ behavior: 'ignoreErrors' })
  })
})

test.describe('Service panels stay out of the way', () => {
  const expectPlainGrid = async (page: Page) => {
    const wrapper = section(page).locator('[data-panels-scroll]')
    await expect(section(page).locator('[data-panel-title]').first()).toBeHidden()
    await expect(section(page).locator('[data-panels-stage]')).not.toHaveCSS('position', 'sticky')
    await expect(section(page).locator('[data-panel]').first()).toHaveCSS('display', 'contents')
    // Every tile is on the page without scroll-driven hiding.
    await expect(wrapper.locator('[data-panel-tile]')).toHaveCount(14)
    for (const tile of await wrapper.locator('[data-panel-tile]').all()) {
      await expect(tile).toBeVisible()
    }
  }

  test.describe('reduced motion', () => {
    test.use({ viewport: phone, contextOptions: { reducedMotion: 'reduce' } })
    test('keeps the plain grid', async ({ page }) => {
      await page.goto('/en')
      await expectPlainGrid(page)
    })
  })

  test.describe('no JavaScript', () => {
    test.use({ viewport: phone, javaScriptEnabled: false })
    test('keeps the plain grid', async ({ page }) => {
      await page.goto('/en')
      await expectPlainGrid(page)
    })
  })

  test.describe('phone on its side', () => {
    test.use({ viewport: { width: 740, height: 360 } })
    test('keeps the plain grid', async ({ page }) => {
      await page.goto('/en')
      await expectPlainGrid(page)
    })
  })

  test.describe('desktop', () => {
    test.use({ viewport: { width: 1280, height: 800 } })
    test('keeps the bento grid and does not fetch the panels timeline', async ({ page }) => {
      const chunks: string[] = []
      page.on('response', async (response) => {
        if (!response.url().endsWith('.js')) return
        const body = await response.text().catch(() => '')
        if (body.includes(timelineMarker)) chunks.push(response.url())
      })
      await page.goto('/en')
      await section(page).scrollIntoViewIfNeeded()
      await expectPlainGrid(page)
      expect(chunks).toEqual([])
    })
  })
})
