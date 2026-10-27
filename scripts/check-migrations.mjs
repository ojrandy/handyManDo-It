// Schema/migration gate (data-model.md §6). Two checks:
//   1. drift: the Payload config has no schema change that lacks a committed migration
//   2. fresh: every committed migration applies to an empty database (scratch DB, dropped after)
// Usage: npm run migrate:check            (both)
//        npm run migrate:check -- --drift (drift only; CI runs migrate on its own empty DB)
// The Payload CLI can finish its work without exiting (open DB pool), so each call has a
// timeout and success is judged from files on disk / its output, not its exit code.
import 'dotenv/config'

import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import pg from 'pg'

const migrationsDir = path.resolve('src/migrations')
const payloadBin = path.resolve('node_modules/payload/bin.js')
const driftName = 'schema_drift_check'

const payload = (args, env = {}) => {
  const result = spawnSync(process.execPath, [payloadBin, ...args], {
    encoding: 'utf8',
    env: { ...process.env, NODE_OPTIONS: '--no-deprecation', ...env },
    timeout: 180_000,
  })
  return `${result.stdout}\n${result.stderr}`
}

const fail = (message, output) => {
  console.error(`\n✗ ${message}`)
  if (output) console.error(output.trim().split('\n').slice(-25).join('\n'))
  process.exit(1)
}

function checkDrift() {
  // migrate:create also adds the new file to index.ts; put it back as it was.
  const indexFile = path.join(migrationsDir, 'index.ts')
  const index = readFileSync(indexFile, 'utf8')
  payload(['migrate:create', driftName, '--skip-empty'])
  const created = readdirSync(migrationsDir).filter((file) => file.includes(driftName))
  if (created.length) {
    for (const file of created) rmSync(path.join(migrationsDir, file))
    writeFileSync(indexFile, index)
    fail(
      'Schema changed without a migration. Run `npm run migrate:create -- --name <change>` and commit src/migrations.',
    )
  }
  console.log('✓ no schema drift')
}

async function checkFresh() {
  const url = new URL(process.env.DATABASE_URL || '')
  if (!['localhost', '127.0.0.1', '::1'].includes(url.hostname)) {
    fail(`Refusing to create a scratch database on "${url.hostname}" (local databases only).`)
  }
  const scratch = `${url.pathname.slice(1)}_migration_check`
  const admin = new pg.Client({ connectionString: url.toString() })
  await admin.connect()
  const reset = async () => admin.query(`DROP DATABASE IF EXISTS "${scratch}" WITH (FORCE)`)
  await reset()
  await admin.query(`CREATE DATABASE "${scratch}"`)
  try {
    const scratchUrl = new URL(url)
    scratchUrl.pathname = `/${scratch}`
    const env = { DATABASE_URL: scratchUrl.toString(), NODE_ENV: 'production' }
    const migrateOutput = payload(['migrate'], env)
    const status = payload(['migrate:status'], env)
    const committed = readdirSync(migrationsDir).filter((f) => /^\d{8}_\d{6}_.+\.ts$/.test(f))
    const pending = committed.filter((file) => {
      const name = file.replace(/\.ts$/, '')
      const row = status.split('\n').find((line) => line.includes(name))
      return !row || !/Yes/.test(row)
    })
    if (pending.length) fail(`Migrations did not apply: ${pending.join(', ')}`, migrateOutput)
    console.log(`✓ ${committed.length} migration(s) apply to an empty database`)
  } finally {
    await reset()
    await admin.end()
  }
}

checkDrift()
if (!process.argv.includes('--drift')) await checkFresh()
