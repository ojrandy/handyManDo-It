// Screenshots the real app into the `app-screens` collection (T-1.09, FR-HOME-10).
//
//   npm run capture:screens                    capture every screen (fr/en × light/dark), upload new ones
//   npm run capture:screens -- --update        also replace screenshots already in the CMS
//   npm run capture:screens -- --only=home,shop
//   npm run capture:screens -- --capture-only  write .cache/screens/*.webp, don't touch the CMS
//   npm run capture:screens -- --upload-only   upload what .cache/screens already holds
//   npm run capture:screens -- --force         allow a non-local DATABASE_URL (staging); think twice
//
// Captures are 390×844 at 3× from https://app.handymandoit.com, signed out. The app's static files
// are cached in .cache/app-assets, so only the first run waits for the (slow) host.
import 'dotenv/config'

import { existsSync } from 'node:fs'
import path from 'node:path'

import { getPayload } from 'payload'

import config from '../src/payload.config'

import { type Captured, captureScreens } from './screens/capture'
import { fileName, langs, screens, themes } from './screens/data'
import { uploadScreens } from './screens/run'
import { assertSeedTarget } from './seed/guard'
import { type Counts, formatSummary, totals } from './seed/run'

const flags = ['--force', '--update', '--capture-only', '--upload-only']
const args = process.argv.slice(2)
const only = args
  .find((arg) => arg.startsWith('--only='))
  ?.slice('--only='.length)
  .split(',')
const unknown = args.filter((arg) => !flags.includes(arg) && !arg.startsWith('--only='))
const has = (flag: string) => args.includes(flag)

const outDir = path.resolve('.cache/screens')
const cacheDir = path.resolve('.cache/app-assets')

async function main(): Promise<number> {
  if (unknown.length) {
    console.error(`Unknown option(s): ${unknown.join(' ')}. Allowed: ${flags.join(' ')} --only=a,b`)
    return 2
  }
  const specs = only ? screens.filter(({ key }) => only.includes(key)) : screens
  if (!specs.length) {
    console.error(`No screen matches --only. Screens: ${screens.map(({ key }) => key).join(', ')}`)
    return 2
  }
  if (has('--capture-only') && has('--upload-only')) {
    console.error('--capture-only and --upload-only exclude each other.')
    return 2
  }

  let captured: Captured[]
  let failed: string[] = []
  if (has('--upload-only')) {
    captured = specs.flatMap((spec) =>
      langs.flatMap((lang) =>
        themes.map((theme) => ({
          spec,
          lang,
          theme,
          file: path.join(outDir, fileName(spec.key, lang, theme)),
        })),
      ),
    )
    const missing = captured.filter(({ file }) => !existsSync(file))
    if (missing.length) {
      console.error(
        `Missing captures: ${missing.map(({ file }) => path.basename(file)).join(', ')}`,
      )
      return 1
    }
  } else {
    console.log(
      `Capturing ${specs.length} screen(s) × ${langs.length} languages × ${themes.length} themes…`,
    )
    ;({ captured, failed } = await captureScreens(specs, langs, themes, { outDir, cacheDir }))
    console.log(`Saved ${captured.length} capture(s) in ${outDir}.`)
  }
  if (has('--capture-only')) return failed.length ? 1 : 0

  const target = assertSeedTarget(process.env.DATABASE_URL, has('--force'))
  console.log(`Uploading to ${target.host}/${target.database}…`)
  const payload = await getPayload({ config })
  const uploaded = await uploadScreens(payload, captured, { update: has('--update') })
  const summary: Record<string, Counts> = has('--upload-only')
    ? { 'app-screens': uploaded }
    : {
        capture: { created: captured.length, updated: 0, skipped: 0, failed: failed.length },
        'app-screens': uploaded,
      }
  console.log(`\n${formatSummary(summary)}\n`)
  const total = totals(summary).failed
  if (total) console.error(`✗ ${total} failed; see the messages above.`)
  else console.log('✓ Screens captured and uploaded.')
  return total ? 1 : 0
}

// Payload keeps its database pool open, so the process must exit explicitly (CLAUDE.md §8).
main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    console.error(`✗ ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  })
