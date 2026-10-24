import { expect, test, type Page } from '@playwright/test'

import { login } from '../helpers/login'
import { cleanupTestUser, seedTestUser, testUser } from '../helpers/seedUser'

test.describe('Admin panel', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    // Seeding plus the first admin render can exceed the default 30 s on a cold server.
    test.setTimeout(120_000)
    await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('can navigate to dashboard', async () => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin$/)
    await expect(page.locator('span[title="Dashboard"]').first()).toBeVisible()
  })

  test('can navigate to list view', async () => {
    await page.goto('/admin/collections/users')
    // Payload appends list preferences (?limit=…) to the URL after load.
    await expect(page).toHaveURL(/\/admin\/collections\/users(\?|$)/)
    await expect(page.locator('h1', { hasText: 'Users' }).first()).toBeVisible()
  })

  test('can open the site settings global', async () => {
    await page.goto('/admin/globals/site')
    await expect(page.locator('input[name="phone"]')).toBeVisible()
  })
})
