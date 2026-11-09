import { expect, test, type Page } from '@playwright/test'

import en from '../../src/messages/en.json'

// FR-ANA-01..03. The runtime loads after the load event; these wait for its listener by checking
// that a click is recorded.

const queued = (page: Page) =>
  page.evaluate(() => (window.hmEvents ?? []).map(([event, params]) => ({ event, ...params })))

test.describe('Analytics and consent', () => {
  test('nothing reaches Google and no cookie is set before consent', async ({ page, context }) => {
    const thirdParty: string[] = []
    page.on('request', (request) => {
      if (/google-analytics|googletagmanager/.test(request.url())) thirdParty.push(request.url())
    })
    await page.goto('/en')
    await page.waitForLoadState('load')
    await page.waitForTimeout(1500)
    expect(thirdParty).toEqual([])
    const cookies = (await context.cookies()).map(({ name }) => name)
    expect(cookies.filter((name) => name.startsWith('_ga'))).toEqual([])
  })

  test('campaign tags ride along on store links and clicks are queued', async ({ page }) => {
    // Keep the browser on the site: store links are opened, not followed.
    await page.route(/play\.google\.com|apps\.apple\.com/, (route) =>
      route.fulfill({ status: 204, body: '' }),
    )
    await page.goto('/en/get-the-app?utm_source=flyer&utm_medium=print&utm_campaign=douala-nov')
    await page.waitForLoadState('load')

    const play = page.locator('main a[href*="play.google.com"]').first()
    await expect
      .poll(async () => {
        await play.dispatchEvent('click')
        return (await play.getAttribute('href')) ?? ''
      })
      .toContain('referrer=')
    const href = new URL((await play.getAttribute('href'))!)
    expect(new URLSearchParams(href.searchParams.get('referrer')!).get('utm_campaign')).toBe(
      'douala-nov',
    )

    const apple = page.locator('main a[href*="apps.apple.com"]').first()
    await apple.dispatchEvent('click')
    expect(new URL((await apple.getAttribute('href'))!).searchParams.get('ct')).toBe('douala-nov')

    const events = await queued(page)
    expect(events).toContainEqual(expect.objectContaining({ event: 'store_click', store: 'play' }))
    expect(events).toContainEqual(
      expect.objectContaining({ event: 'store_click', store: 'appstore' }),
    )
  })

  test('FAQ opens and the language switch are queued as events', async ({ page }) => {
    await page.goto('/en/faq')
    await page.waitForLoadState('load')
    const first = page.locator('details[data-track-faq] summary').first()
    await expect
      .poll(async () => {
        await first.click()
        return (await queued(page)).some(({ event }) => event === 'faq_open')
      })
      .toBe(true)

    await page.getByRole('button', { name: en.language.fr }).first().click()
    await expect(page).toHaveURL(/\/fr\/faq$/)
    // Client-side navigation: the queue survives.
    expect(await queued(page)).toContainEqual({ event: 'lang_switch', from: 'en', to: 'fr' })
  })
})
