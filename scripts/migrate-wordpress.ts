// Imports the old WordPress blog into Payload (T-1.08, FR-PG-11, data-model.md §7).
//
//   npm run migrate:wordpress                 import posts that are not in the CMS yet
//   npm run migrate:wordpress -- --update     also overwrite posts imported before
//   npm run migrate:wordpress -- --force      allow a non-local DATABASE_URL (staging); think twice
//
// Safe to re-run: posts match on their old URL (`legacyUrl`), categories on their slug and media
// on the file name, so a second run creates nothing. Downloads are cached in .cache/wordpress.
// Set WORDPRESS_API to read another copy of the blog.
import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../src/payload.config'

import { assertSeedTarget } from './seed/guard'
import { formatSummary, totals } from './seed/run'
import { runImport } from './wordpress/run'
import { defaultApi, wordPressSource } from './wordpress/source'

const args = new Set(process.argv.slice(2))
const known = ['--force', '--update']
const unknown = [...args].filter((arg) => !known.includes(arg))

async function main(): Promise<number> {
  if (unknown.length) {
    console.error(`Unknown option(s): ${unknown.join(' ')}. Allowed: ${known.join(' ')}`)
    return 2
  }

  const target = assertSeedTarget(process.env.DATABASE_URL, args.has('--force'))
  const api = process.env.WORDPRESS_API || defaultApi
  const mode = args.has('--update') ? 'update existing' : 'create missing only'
  console.log(`Importing ${api} into ${target.host}/${target.database} (${mode})…`)

  const payload = await getPayload({ config })
  const summary = await runImport(payload, wordPressSource(api), { update: args.has('--update') })

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
