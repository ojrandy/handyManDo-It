import { gzipSync } from 'node:zlib'

import { expect, test } from '@playwright/test'

// NFR-PERF-02: home first-load JS under 170 KB gzip (T-3.16). Only meaningful on a production
// build, so it runs in CI (`next start`) or with E2E_BUDGET=1 against a built or deployed site;
// the dev server ships unminified code with HMR.
const BUDGET_KB = 170

test.describe('Performance budget', () => {
  test.skip(!process.env.CI && !process.env.E2E_BUDGET, 'needs a production build')

  for (const locale of ['fr', 'en']) {
    test(`/${locale} first-load JS is under ${BUDGET_KB} KB gzip`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      const scripts = new Map<string, Promise<number>>()
      page.on('response', (response) => {
        if (response.request().resourceType() !== 'script') return
        // Size as served compressed: gzip the body ourselves, so the result doesn't depend on
        // the server's (or Cloudflare's) compression settings.
        scripts.set(
          response.url(),
          response.body().then(
            (body) => gzipSync(body).length,
            () => 0,
          ),
        )
      })

      // No scrolling: on-view pieces (mini-demo) must not be in this count.
      await page.goto(`/${locale}`, { waitUntil: 'networkidle' })
      const sizes = await Promise.all(scripts.values())
      const totalKB = sizes.reduce((sum, size) => sum + size, 0) / 1024

      test.info().annotations.push({
        type: 'first-load JS',
        description: `${totalKB.toFixed(1)} KB gzip in ${sizes.length} files`,
      })
      console.log(`/${locale}: ${totalKB.toFixed(1)} KB gzip JS in ${sizes.length} files`)
      expect(totalKB).toBeLessThan(BUDGET_KB)
    })
  }
})
