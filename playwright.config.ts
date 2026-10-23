import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

// CI tests the production build; locally the dev server is used (or reused if already running).
// Set E2E_PORT to run beside another server, e.g. a `next start` already on 3000.
// Set E2E_BASE_URL to test a deployed site (staging gate); no local server is started then.
const port = Number(process.env.E2E_PORT || 3000)
const externalURL = process.env.E2E_BASE_URL?.replace(/\/$/, '')
const baseURL = externalURL || `http://localhost:${port}`
const isCI = Boolean(process.env.CI)
// 'chrome' uses the installed Google Chrome when Playwright's own Chromium is not downloaded.
const channel = process.env.E2E_CHANNEL || 'chromium'

export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // The admin spec seeds a shared user, so keep runs serial.
  workers: 1,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel },
    },
  ],
  webServer: externalURL
    ? undefined
    : {
        command: `npm run ${isCI ? 'start' : 'dev'} -- --port ${port}`,
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 180_000,
        // Payload's admin calls its API at serverURL, which must be this server.
        env: { NEXT_PUBLIC_SITE_URL: baseURL },
      },
})
