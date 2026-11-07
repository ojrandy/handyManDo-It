import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { chromium, type BrowserContext, type Page } from '@playwright/test'
import sharp from 'sharp'

import {
  appUrl,
  fileName,
  type Lang,
  safeArea,
  scale,
  type ScreenSpec,
  type Theme,
  viewport,
} from './data'

export type CaptureOptions = {
  outDir: string
  cacheDir: string
  log?: (line: string) => void
}

// The app's static files are content-hashed and its host is slow from some networks (a cold load
// took four minutes from the dev machine), so they are kept on disk between screenshots and runs.
export async function cacheStaticFiles(context: BrowserContext, cacheDir: string) {
  mkdirSync(cacheDir, { recursive: true })
  await context.route(
    /^https:\/\/app\.handymandoit\.com\/(_next\/static|fonts|assets)\//,
    async (route) => {
      const file = path.join(
        cacheDir,
        createHash('sha1').update(route.request().url()).digest('hex'),
      )
      if (existsSync(file)) {
        const { contentType } = JSON.parse(readFileSync(`${file}.json`, 'utf8')) as {
          contentType: string
        }
        return route.fulfill({ status: 200, contentType, body: readFileSync(file) })
      }
      const response = await route.fetch({ timeout: 300_000 })
      const body = await response.body()
      if (response.ok()) {
        writeFileSync(file, body)
        writeFileSync(
          `${file}.json`,
          JSON.stringify({ contentType: response.headers()['content-type'] ?? '' }),
        )
      }
      return route.fulfill({ response, body })
    },
  )
}

async function settle(page: Page) {
  await page
    .waitForFunction(() => [...document.images].every((image) => image.complete), undefined, {
      timeout: 120_000,
    })
    .catch(() => {})
  // Splash fade, skeletons and toasts.
  await page.waitForTimeout(2_500)
}

const currentTheme = (page: Page) => page.evaluate(() => document.documentElement.dataset.theme)

// "Switch to dark mode" / "Passer en mode sombre"; the bar renders it twice (one hidden).
const themeToggle = (page: Page) => page.locator('button[aria-label*="mode" i]:visible').first()

async function goTo(page: Page, hash: string, lang: Lang) {
  await page.goto(`${appUrl}/#${hash}`, { waitUntil: 'load', timeout: 400_000 })
  // The app renders in English first and switches to the browser language once hydrated.
  await page.waitForFunction((value) => document.documentElement.lang === value, lang, {
    timeout: 120_000,
  })
  await settle(page)
}

// The theme is a toggle in the app bar; it doesn't follow prefers-color-scheme. Screens without
// the bar (welcome) take the theme set on the home screen, which the app keeps across reloads.
async function setTheme(page: Page, hash: string, lang: Lang, theme: Theme) {
  if ((await currentTheme(page)) === theme) return
  if (!(await themeToggle(page).count())) {
    await goTo(page, 'home', lang)
    await setTheme(page, 'home', lang, theme)
    await goTo(page, hash, lang)
    if ((await currentTheme(page)) !== theme)
      throw new Error(`the app did not keep the ${theme} theme`)
    return
  }
  await themeToggle(page).click()
  await page.waitForFunction((value) => document.documentElement.dataset.theme === value, theme)
}

async function open(page: Page, spec: ScreenSpec, lang: Lang, theme: Theme) {
  await goTo(page, spec.hash, lang)
  await setTheme(page, spec.hash, lang, theme)
  if (spec.open === 'firstCategory') {
    // Service cards say how the price is set ("Professional visit estimate", "Quote after scope
    // review"); the category chips above them don't.
    await page
      .locator('main button')
      .filter({ hasText: /estimat|scope|devis|visite/i })
      .first()
      .click()
  }
  // The home screen lists featured pros; each card opens that pro's public profile.
  if (spec.open === 'firstPro') await page.locator('main button.tech-card').first().click()
  await settle(page)
}

// Reserves the safe areas before the app renders. An adopted sheet, because hydration rewrites the
// <html> style attribute and head children; a string, not a function: see CLAUDE.md §8.
const safeAreaScript = `{
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(':root { --hm-inset-top: ${safeArea.top}px; --hm-inset-bottom: ${safeArea.bottom}px; }');
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
}`

const signalBars = [4, 6, 8, 10]
  .map((h, i) => `<rect x="${i * 4.5}" y="${11 - h}" width="3" height="${h}" rx="0.8"/>`)
  .join('')

// The clock, signal and battery in the status bar, and the home indicator: what a screenshot taken
// on the phone would show. Drawn in the page so they use the app's font and follow its theme.
const deviceChromeScript = `(() => {
  const ink = document.documentElement.dataset.theme === 'dark' ? '#ffffff' : '#0f1f26';
  const root = document.createElement('div');
  root.dataset.deviceChrome = '';
  root.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;color:' + ink;
  root.innerHTML =
    '<span style="position:absolute;top:15px;left:32px;font:600 16px/20px system-ui,sans-serif">9:41</span>' +
    '<svg style="position:absolute;top:19px;right:26px" width="60" height="12" viewBox="0 0 60 12" fill="currentColor">${signalBars}' +
    '<path d="M27 3.6a7.6 7.6 0 0 1 10 0l-1.2 1.4a5.8 5.8 0 0 0-7.6 0zM29.3 6.3a4.2 4.2 0 0 1 5.4 0l-1.2 1.4a2.4 2.4 0 0 0-3 0zM32 8.3l1.3 1.5L32 11l-1.3-1.2z"/>' +
    '<rect x="41.5" y="1.5" width="15" height="9" rx="2.5" fill="none" stroke="currentColor" opacity=".45"/>' +
    '<rect x="43" y="3" width="12" height="6" rx="1.2"/><rect x="57.5" y="4.5" width="1.5" height="3" rx=".7" opacity=".5"/></svg>' +
    '<span style="position:absolute;bottom:8px;left:50%;width:134px;height:5px;margin-left:-67px;border-radius:3px;background:currentColor"></span>';
  document.body.append(root);
})()`

export type Captured = { spec: ScreenSpec; lang: Lang; theme: Theme; file: string }

export async function captureScreens(
  specs: readonly ScreenSpec[],
  langs: readonly Lang[],
  themes: readonly Theme[],
  { outDir, cacheDir, log = console.log }: CaptureOptions,
): Promise<{ captured: Captured[]; failed: string[] }> {
  mkdirSync(outDir, { recursive: true })
  const browser = await chromium.launch()
  const captured: Captured[] = []
  const failed: string[] = []
  try {
    for (const lang of langs) {
      const context = await browser.newContext({
        viewport,
        deviceScaleFactor: scale,
        isMobile: true,
        hasTouch: true,
        locale: lang === 'fr' ? 'fr-FR' : 'en-US',
        // Carousels hold still, so the shot shows their first slide.
        reducedMotion: 'reduce',
      })
      await cacheStaticFiles(context, cacheDir)
      await context.addInitScript({ content: safeAreaScript })
      const page = await context.newPage()
      for (const theme of themes) {
        for (const spec of specs) {
          const label = `${spec.key} ${lang} ${theme}`
          try {
            await open(page, spec, lang, theme)
            await page.evaluate(deviceChromeScript)
            const png = await page.screenshot({ animations: 'disabled' })
            // Screens that differ by hash only share a document, and the next one has its own theme.
            await page.evaluate(() => document.querySelector('[data-device-chrome]')?.remove())
            const file = path.join(outDir, fileName(spec.key, lang, theme))
            await sharp(png).webp({ quality: 90 }).toFile(file)
            captured.push({ spec, lang, theme, file })
            log(`  ✓ ${label}`)
          } catch (error) {
            failed.push(label)
            log(`  ✗ ${label}: ${error instanceof Error ? error.message.split('\n')[0] : error}`)
          }
        }
      }
      await context.close()
    }
  } finally {
    await browser.close()
  }
  return { captured, failed }
}
