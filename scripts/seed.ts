// Seeds the CMS with the old site's content (T-1.07, data-model.md §7).
//
//   npm run seed                 create what is missing, leave existing records alone
//   npm run seed -- --update     also overwrite seeded fields on existing records
//   npm run seed -- --force      allow a non-local DATABASE_URL (staging); think twice
//
// Safe to re-run: records are matched on a stable key (service key, name, logo file, French
// question) and media on its file name, so a second run creates nothing.
import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../src/payload.config'

import { assertSeedTarget } from './seed/guard'
import { formatSummary, runSeed, totals } from './seed/run'

const args = new Set(process.argv.slice(2))
const known = ['--force', '--update']
const unknown = [...args].filter((arg) => !known.includes(arg))

async function main(): Promise<number> {
  if (unknown.length) {
    console.error(`Unknown option(s): ${unknown.join(' ')}. Allowed: ${known.join(' ')}`)
    return 2
  }

  const target = assertSeedTarget(process.env.DATABASE_URL, args.has('--force'))
  const mode = args.has('--update') ? 'update existing' : 'create missing only'
  console.log(`Seeding ${target.host}/${target.database} (${mode})…`)

  const payload = await getPayload({ config })
  const summary = await runSeed(payload, { update: args.has('--update') })

  console.log(`\n${formatSummary(summary)}\n`)
  const { failed } = totals(summary)
  if (failed) console.error(`✗ ${failed} record(s) failed; see the messages above.`)
  else console.log('✓ Seed complete.')
  return failed ? 1 : 0
}

// Payload keeps its database pool open, so the process must exit explicitly (CLAUDE.md §8).
main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    console.error(`✗ ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  })
