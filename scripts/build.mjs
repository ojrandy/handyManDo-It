// `npm run build`. Pre-rendering reads Payload (T-1.15), so on a remote database (Neon, when
// Hostinger builds) pending migrations are applied first; a fresh database would otherwise fail
// the build on missing tables. Hostinger's build field only offers fixed commands, so this lives
// here rather than in its settings. Local and CI databases are left alone: dev uses schema push,
// and CI runs `npm run migrate` itself.
// The Payload CLI can finish without exiting (open DB pool), so migrate has a timeout and success
// is judged from `migrate:status`, as in check-migrations.mjs.
import 'dotenv/config'

import { spawn, spawnSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import os from 'node:os'
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

// Hostinger's log shows nothing between "Creating an optimized production build" and its own
// failure message, so the build reports the box's state itself.
const mb = (bytes) => `${Math.round(bytes / 2 ** 20)} MB`
const cgroup = (file) => {
  try {
    const value = readFileSync(`/sys/fs/cgroup/${file}`, 'utf8').trim()
    return /^\d+$/.test(value) ? mb(Number(value)) : value
  } catch {
    return null
  }
}
const started = Date.now()
const minutes = () => `${((Date.now() - started) / 60_000).toFixed(1)} min`
const status = () => {
  const limit = cgroup('memory.max')
  const used = cgroup('memory.current')
  const box = limit ? `, cgroup ${used} of ${limit}` : ''
  const load = os
    .loadavg()
    .map((n) => n.toFixed(1))
    .join(' ')
  return `${mb(os.totalmem() - os.freemem())} used of ${mb(os.totalmem())}${box}, load ${load}`
}
if (host) console.log(`[build] ${os.cpus().length} CPUs, ${status()}`)
const heartbeat = host
  ? setInterval(() => console.log(`[build] ${minutes()}: ${status()}`), 30_000)
  : null

const run = (bin, args, env) =>
  new Promise((resolve) => {
    const child = spawn(process.execPath, [bin, ...args], {
      stdio: 'inherit',
      env: { ...process.env, ...env },
    })
    child.on('exit', (code, signal) => resolve({ code, signal }))
  })

// One-time content load (owner, 2026-11-10): the production CMS is filled on Hostinger, whose
// network is fast and which already holds the keys. LOAD_CONTENT=all, or a list of seed, screens,
// blog. Each step only creates what is missing, so a deploy cut off by Hostinger's time limit is
// finished by the next one. Remove the variable once a deploy reports every step done.
const contentSteps = {
  seed: ['scripts/seed.ts', '--force'],
  screens: ['scripts/capture-screens.ts', '--upload-only', '--force'],
  blog: ['scripts/migrate-wordpress.ts', '--force'],
}
const requested = (process.env.LOAD_CONTENT || '')
  .split(',')
  .map((step) => step.trim())
  .filter(Boolean)
  .flatMap((step) => (step === 'all' ? Object.keys(contentSteps) : [step]))
if (requested.length && !host) {
  console.log('LOAD_CONTENT is for a remote database; locally run npm run seed etc. instead.')
} else if (requested.length && !process.env.S3_BUCKET) {
  // Without R2 the uploads would land on the build box's disk and vanish with it.
  console.error('✗ LOAD_CONTENT skipped: S3_BUCKET is not set, so uploads would be lost.')
} else if (requested.length) {
  const tsx = path.resolve('node_modules/tsx/dist/cli.mjs')
  const results = []
  for (const step of [...new Set(requested)]) {
    if (!contentSteps[step]) {
      console.error(`✗ LOAD_CONTENT: unknown step "${step}" (seed, screens, blog or all)`)
      continue
    }
    console.log(`\n[content] ${step}: starting at ${minutes()}`)
    const { code, signal } = await run(tsx, contentSteps[step], {
      NODE_OPTIONS: '--no-deprecation',
    })
    const ok = code === 0
    results.push(`${step} ${ok ? 'done' : `FAILED (code ${code}, signal ${signal})`}`)
    console.log(`[content] ${step}: ${ok ? 'done' : 'failed'} at ${minutes()}`)
  }
  console.log(`\n[content] ${results.join(', ')}`)
}

// Hostinger (remote database) builds lean (DEPLOY.md §4): two Turbopack builds there stopped at
// the same point (~16 min, no output), at full speed and with a third less memory, which looks
// like its build time limit with the compile stalled. So it builds with webpack (plain Node, heap
// capped), one page worker and no type check (next.config.ts `leanBuild`); BUILD_BUNDLER=turbopack
// switches back without a commit. Local and CI builds are unchanged.
const bundler = process.env.BUILD_BUNDLER || (host ? 'webpack' : 'turbopack')
const env = host
  ? { LEAN_BUILD: '1', NODE_OPTIONS: '--no-deprecation --max-old-space-size=2048' }
  : { NODE_OPTIONS: '--no-deprecation --max-old-space-size=3072' }
if (host) console.log(`Lean build: ${bundler}, 1 worker, 2 GB heap, no type check`)

const { code, signal } = await run(
  nextBin,
  ['build', ...(bundler === 'webpack' ? ['--webpack'] : [])],
  { NEXT_TELEMETRY_DISABLED: '1', ...env },
)
if (heartbeat) clearInterval(heartbeat)
if (code !== 0) {
  console.error(`[build] next build stopped after ${minutes()}: code ${code}, signal ${signal}`)
  if (host) console.error(`[build] ${status()}`)
}
process.exit(code ?? 1)
