// Imports the old WordPress blog into Payload (T-1.08, FR-PG-11, data-model.md §7).
//
//   npm run migrate:wordpress                 import posts that are not in the CMS yet
//   npm run migrate:wordpress -- --update     also overwrite posts imported before
//   npm run migrate:wordpress -- --force      allow a non-local DATABASE_URL (staging); think twice
//
// Safe to re-run: posts match on their old URL (`legacyUrl`), categories on their slug and media
// on their content, so a second run creates nothing.
//
// Reads the archive in data/wordpress (`npm run archive:wordpress`), because the old blog goes
// away at launch. Set WORDPRESS_API to read a live blog instead (downloads cached in
// .cache/wordpress).
import 'dotenv/config'

import path from 'node:path'

import { getPayload } from 'payload'

import config from '../src/payload.config'

import { assertSeedTarget } from './seed/guard'
import { formatSummary, totals } from './seed/run'
import { runImport } from './wordpress/run'
import { archiveDir, archiveSource, hasArchive, wordPressSource } from './wordpress/source'

const args = new Set(process.argv.slice(2))
const known = ['--force', '--update']
const unknown = [...args].filter((arg) => !known.includes(arg))

async function main(): Promise<number> {
  if (unknown.length) {
    console.error(`Unknown option(s): ${unknown.join(' ')}. Allowed: ${known.join(' ')}`)
    return 2
  }

  const target = assertSeedTarget(process.env.DATABASE_URL, args.has('--force'))
  const api = process.env.WORDPRESS_API
  if (!api && !hasArchive()) {
    console.error(
      `No archive in ${archiveDir}. Run npm run archive:wordpress, or set WORDPRESS_API.`,
    )
    return 2
  }
  const from = api || path.relative(process.cwd(), archiveDir)
  const mode = args.has('--update') ? 'update existing' : 'create missing only'
  console.log(`Importing ${from} into ${target.host}/${target.database} (${mode})…`)

  const payload = await getPayload({ config })
  const source = api ? wordPressSource(api) : archiveSource()
  const summary = await runImport(payload, source, { update: args.has('--update') })

  console.log(`\n${formatSummary(summary)}\n`)
  const { failed } = totals(summary)
  if (failed) console.error(`✗ ${failed} record(s) failed; see the messages above.`)
  else console.log('✓ Import complete.')
  return failed ? 1 : 0
}

// Payload keeps its database pool open, so the process must exit explicitly (CLAUDE.md §8).
main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    console.error(`✗ ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  })
