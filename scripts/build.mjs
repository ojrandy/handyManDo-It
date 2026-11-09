// `npm run build`. Pre-rendering reads Payload (T-1.15), so on a remote database (Neon, when
// Hostinger builds) pending migrations are applied first; a fresh database would otherwise fail
// the build on missing tables. Hostinger's build field only offers fixed commands, so this lives
// here rather than in its settings. Local and CI databases are left alone: dev uses schema push,
// and CI runs `npm run migrate` itself.
// The Payload CLI can finish without exiting (open DB pool), so migrate has a timeout and success
// is judged from `migrate:status`, as in check-migrations.mjs.
import 'dotenv/config'

import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import path from 'node:path'

const localHosts = ['localhost', '127.0.0.1', '::1', '[::1]']
const payloadBin = path.resolve('node_modules/payload/bin.js')
const nextBin = path.resolve('node_modules/next/dist/bin/next')

const payload = (args) => {
  const result = spawnSync(process.execPath, [payloadBin, ...args], {
    encoding: 'utf8',
    env: { ...process.env, NODE_OPTIONS: '--no-deprecation' },
    timeout: 300_000,
  })
  return `${result.stdout}\n${result.stderr}`
}

const fail = (message, output) => {
  console.error(`\n✗ ${message}`)
  if (output) console.error(output.trim().split('\n').slice(-25).join('\n'))
  process.exit(1)
}

function remoteHost() {
  try {
    const { hostname } = new URL(process.env.DATABASE_URL || '')
    return localHosts.includes(hostname) ? null : hostname
  } catch {
    return null
  }
}

const host = remoteHost()
if (host) {
  // Host only: the URL carries the password.
  console.log(`Applying pending migrations on ${host}…`)
  const output = payload(['migrate'])
  const status = payload(['migrate:status'])
  const pending = readdirSync(path.resolve('src/migrations'))
    .filter((file) => /^\d{8}_\d{6}_.+\.ts$/.test(file))
    .map((file) => file.replace(/\.ts$/, ''))
    .filter((name) => {
      const row = status.split('\n').find((line) => line.includes(name))
      return !row || !/Yes/.test(row)
    })
  if (pending.length) fail(`Migrations did not apply: ${pending.join(', ')}`, output)
  console.log('✓ database schema is current')
}

// Heap capped at 3 GB for Hostinger's Business plan (DEPLOY.md §4).
const build = spawnSync(process.execPath, [nextBin, 'build'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_OPTIONS: '--no-deprecation --max-old-space-size=3072' },
})
process.exit(build.status ?? 1)
