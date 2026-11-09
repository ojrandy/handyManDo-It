import { expect, test, type Page } from '@playwright/test'

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

  test('every service tile shows a real photo that loads', async ({ page }) => {
    await page.goto('/en')
    const tiles = page
      .getByRole('region', { name: en.servicesSection.title })
      .locator('a[href*="/services/"]:has(img)')
    await expect(tiles).toHaveCount(Object.keys(en.servicesSection.photos).length)
    for (const img of await tiles.locator('img').all()) {
      await img.scrollIntoViewIfNeeded()
      await expect(img).toHaveAttribute('alt', /\S/)
      await expect
        .poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth))
        .toBeGreaterThan(0)
    }
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

  test('footer links the sister companies and credits Web Spectron', async ({ page }) => {
    for (const [locale, m] of [
      ['fr', fr],
      ['en', en],
    ] as const) {
      await page.goto(`/${locale}`)
      const footer = page.getByRole('contentinfo')
      const group = footer.getByRole('region', { name: m.footer.group.title })
      for (const [name, url] of [
        ['Spectron Limited LLC', 'https://spectronlimitedllc.com/'],
        ['Spectron Magazine', 'https://spectronmagazine.com/'],
        ['Web Spectron', 'https://webspectron.com/'],
        ['Kenta Beauty Clinic', 'https://kentabeautyclinic.com/'],
      ]) {
        const link = group.getByRole('link', { name: m.footer.group.visit.replace('{name}', name) })
        await expect(link).toHaveAttribute('href', url)
        await expect(link).toHaveAttribute('target', '_blank')
      }
      await expect(footer).not.toContainText('Web Spectron LTD')
    }
  })

  test('download band has no QR code', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/en')
    const band = page.getByRole('region', { name: en.download.title })
    await expect(band).toBeVisible()
    await expect(band.getByRole('img', { name: en.getTheApp.qrAlt })).toHaveCount(0)
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
  // Scrolls to where chapter `index` rests on the pinned stage and waits for the scrub to settle.
  const goToChapter = async (page: Page, index: number) => {
    await page.evaluate((chapter) => {
      const wrapper = document.querySelector<HTMLElement>('[data-story-scroll]')!
      const stage = document.querySelector<HTMLElement>('[data-story-stage]')!
      const top = parseFloat(getComputedStyle(stage).top)
      const range = wrapper.offsetHeight - stage.offsetHeight
      const start = wrapper.getBoundingClientRect().top + window.scrollY - top
      window.scrollTo({ top: start + (range * chapter) / 6, behavior: 'instant' })
    }, index)
    await page.waitForTimeout(1500)
  }

  test('scroll story changes text, picture and phone on a pinned stage', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/en')
    await expect(page.getByRole('heading', { level: 2, name: en.story.title })).toBeVisible()
    const chapters = page.getByRole('list', { name: en.story.label }).getByRole('listitem')
    await expect(chapters).toHaveCount(7)

    await goToChapter(page, 2)
    await expect(page.locator('#scroll-story')).toHaveAttribute('data-gsap', '')
    const pay = chapters.nth(2)
    await expect(pay).toHaveAttribute('data-current', '')
    await expect(page.locator('#scroll-story [data-for="2"]').first()).toHaveAttribute(
      'data-current',
      '',
    )
    await expect(pay.getByRole('heading', { name: en.story.chapters.pay.title })).toBeVisible()
    await expect(pay.getByRole('img', { name: en.story.chapters.pay.photoAlt })).toBeVisible()
    await expect(pay.getByText(en.story.chapters.pay.caption)).toBeVisible()
    // Chapters not showing are transparent, not hidden: screen readers still get all seven.
    await expect(chapters.nth(1).locator('h3')).toHaveCSS('opacity', '0')
    await expect(chapters.nth(3).locator('h3')).toHaveCSS('opacity', '0')

    // Keyboard focus in a chapter that isn't showing brings it up.
    await chapters.nth(6).getByRole('link').focus()
    await expect(chapters.nth(6)).toHaveAttribute('data-current', '')
    await expect(chapters.nth(6).locator('h3')).toHaveCSS('opacity', '1')
    await expect(chapters.nth(6).getByRole('img')).toHaveCount(0)
  })

  for (const [width, height] of [
    [1440, 900],
    [1280, 720],
    [1024, 768],
    [820, 1100],
  ]) {
    test(`scroll story phone lines up with the picture at ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      await page.goto('/fr')
      for (let index = 0; index < 7; index++) {
        await goToChapter(page, index)
        const box = await page.evaluate((chapter) => {
          const root = document.querySelector('#scroll-story')!
          const item = root.querySelectorAll('[data-story-chapter]')[chapter]
          const phone = root.querySelector('[data-story-phone]')!.getBoundingClientRect()
          const text = item.querySelector('[data-story-reveal]')!.getBoundingClientRect()
          const picture = item.querySelector('figure')!.getBoundingClientRect()
          return {
            phoneTop: phone.top,
            phoneBottom: phone.bottom,
            textTop: text.top,
            pictureBottom: picture.bottom,
            pictureHeight: picture.height,
            overflow: document.documentElement.scrollWidth - window.innerWidth,
          }
        }, index)
        expect(Math.abs(box.phoneBottom - box.pictureBottom)).toBeLessThan(2)
        expect(Math.abs(box.phoneTop - box.textTop)).toBeLessThan(2)
        expect(box.pictureHeight).toBeGreaterThan(150)
        expect(box.phoneTop).toBeGreaterThan(60)
        expect(box.phoneBottom).toBeLessThanOrEqual(height)
        expect(box.overflow).toBeLessThanOrEqual(0)
      }
    })
  }

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

    // No consent choice yet, so the events wait in the queue (FR-ANA-01).
    const steps = await page.evaluate(() =>
      (window.hmEvents ?? [])
        .filter(([event]) => event === 'demo_interact')
        .map(([, params]) => params.step),
    )
    expect(steps).toEqual(['pros', 'booking', 'done'])
  })

  test('screens gallery moves with the arrow keys and swaps theme', async ({ page }) => {
    await page.goto('/en')
    const gallery = page.getByRole('region', { name: en.gallery.label })
    // Hidden until the app screens are captured (`npm run capture:screens`).
    test.skip((await gallery.count()) === 0, 'no captured app screens in this database')
    await gallery.scrollIntoViewIfNeeded()
    const caption = gallery.locator('[aria-live]')
    // Keyboard focus holds the autoplay, so only the key press moves it from here.
    await page.keyboard.press('Tab')
    await gallery.locator('[tabindex="0"]').focus()
    const first = await caption.textContent()
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
