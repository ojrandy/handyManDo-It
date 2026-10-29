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

// Batch 3: scroll story, mini-demo, screens gallery, latest posts (FR-HOME-07/09/10/16).
test.describe('Home showcase sections', () => {
  test('scroll story pins on desktop and follows the chapter in view', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/en')
    await expect(page.getByRole('heading', { level: 2, name: en.story.title })).toBeVisible()
    const chapters = page.getByRole('list', { name: en.story.label }).getByRole('listitem')
    await expect(chapters).toHaveCount(7)

    const pay = chapters.nth(2)
    await pay.scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollBy(0, 1))
    await expect(pay).toHaveAttribute('data-current', '')
    await expect(page.locator('#scroll-story [data-for="2"]').first()).toHaveAttribute(
      'data-current',
      '',
    )
  })

  test('scroll story is a horizontal swipe on phones, with no pinning', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/fr')
    const track = page.getByRole('list', { name: fr.story.label })
    await track.scrollIntoViewIfNeeded()
    expect(await track.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
    const stagePosition = await page
      .locator('#scroll-story [aria-hidden]')
      .first()
      .evaluate((el) => getComputedStyle(el).position)
    expect(stagePosition).not.toBe('sticky')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  })

  test('mini-demo works from the keyboard and reports each step', async ({ page }) => {
    await page.goto('/en')
    // The demo's code loads only once its section nears the viewport, so scroll to the section.
    await page.locator('section[aria-labelledby="demo-title"]').scrollIntoViewIfNeeded()
    const demo = page.getByRole('group', { name: en.demo.label })
    await demo.getByRole('button', { name: en.services.moving.short }).press('Enter')
    await expect(page.getByRole('heading', { name: en.demo.prosTitle })).toBeFocused()
    await demo.getByRole('button').nth(1).press('Enter')
    await demo.getByRole('button', { name: en.demo.slots.tomorrow }).click()
    await expect(demo.getByRole('button', { name: en.demo.slots.tomorrow })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await demo.getByRole('button', { name: en.demo.confirm }).click()
    await expect(page.getByRole('heading', { name: en.demo.doneTitle })).toBeFocused()
    await expect(demo.getByRole('link', { name: en.demo.cta })).toBeVisible()

    const steps = await page.evaluate(() =>
      (window.dataLayer ?? []).filter((e) => e.event === 'demo_interact').map((e) => e.step),
    )
    expect(steps).toEqual(['pros', 'booking', 'done'])
  })

  test('screens gallery moves with the arrow keys and swaps theme', async ({ page }) => {
    await page.goto('/en')
    const gallery = page.getByRole('region', { name: en.gallery.label })
    // Hidden until the app screens are captured (`npm run capture:screens`).
    test.skip((await gallery.count()) === 0, 'no captured app screens in this database')
    await gallery.scrollIntoViewIfNeeded()
    const caption = gallery.locator('[aria-live="polite"]')
    const first = await caption.textContent()
    await gallery.locator('[tabindex="0"]').focus()
    await page.keyboard.press('ArrowRight')
    await expect(caption).not.toHaveText(first ?? '')
    await gallery.getByRole('button', { name: en.gallery.dark }).click()
    await expect(gallery.getByRole('button', { name: en.gallery.dark })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(gallery.getByRole('img', { name: /dark theme/ })).toBeVisible()
  })

  test('latest posts link to their articles', async ({ page }) => {
    await page.goto('/fr')
    const section = page.getByRole('region', { name: fr.blog.title })
    // Hidden until posts exist (`npm run migrate:wordpress`).
    test.skip((await section.count()) === 0, 'no published posts in this database')
    const cards = section.getByRole('listitem')
    expect(await cards.count()).toBeLessThanOrEqual(3)
    await expect(cards.first().getByRole('link')).toHaveAttribute('href', /^\/fr\/blog\/.+/)
  })
})
