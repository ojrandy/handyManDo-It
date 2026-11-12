// Puts back media files that are missing from R2 (incident 2026-11-10).
//
//   npm run repair:media                    list the media whose files are missing, change nothing
//   npm run repair:media -- --apply         re-upload them from their original files
//   npm run repair:media -- --apply --force allow a non-local DATABASE_URL (production)
//
// The first production content load created 262 media documents but stored only the first one's
// files: the import scripts shared one `context` object, on which the storage plugin keeps
// per-upload state (fixed in scripts/seed/run.ts). The documents are fine and pages reference them
// by id, so each one gets its original file attached again: Payload regenerates every size and
// uploads them, and URLs are rebuilt from the stored names on read. Originals are found by
// `sourceHash` among the files the imports read (public/, data/screens, data/wordpress/files).
//
// Safe to re-run: a document whose files are all in the bucket is left alone.
import 'dotenv/config'

import { createHash } from 'node:crypto'
import { existsSync, readdirSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
import { getPayload } from 'payload'

import type { Media } from '@/payload-types'

import config from '../src/payload.config'

import { assertSeedTarget } from './seed/guard'

const args = new Set(process.argv.slice(2))
const known = ['--apply', '--force']
const unknown = [...args].filter((arg) => !known.includes(arg))
const apply = args.has('--apply')

// Same prefix as the media collection's s3Storage options (src/payload.config.ts).
const defaultPrefix = 'media'
const sourceDirs = ['public', 'data/screens', 'data/wordpress/files', '.cache/screens']
const mediaExtensions = /\.(webp|jpe?g|png|gif|avif|svg|mp4|webm|pdf)$/i

async function bucketKeys(bucket: string): Promise<Set<string>> {
  const client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: 'auto',
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
  })
  const keys = new Set<string>()
  let token: string | undefined
  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: `${defaultPrefix}/`,
        ContinuationToken: token,
      }),
    )
    for (const item of page.Contents ?? []) if (item.Key) keys.add(item.Key)
    token = page.IsTruncated ? page.NextContinuationToken : undefined
  } while (token)
  return keys
}

function* walk(dir: string): Generator<string> {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else if (mediaExtensions.test(entry.name)) yield full
  }
}

// sourceHash (SHA-256 of the original upload, src/collections/Media.ts) → a file holding it.
async function sourceIndex(): Promise<Map<string, string>> {
  const index = new Map<string, string>()
  for (const dir of sourceDirs) {
    for (const file of walk(path.resolve(dir))) {
      const hash = createHash('sha256')
        .update(await readFile(file))
        .digest('hex')
      if (!index.has(hash)) index.set(hash, file)
    }
  }
  return index
}

type Locale = 'fr' | 'en'
// `alt` read with `locale: 'all'`: one value per locale (a plain string from older reads).
type AltByLocale = Partial<Record<Locale, string | null>> | string | null | undefined

// The update must name a locale whose required `alt` is filled in: without one Payload writes the
// default locale (fr), and the WordPress imports have English alt only, so validation rejected
// every one of them ("The following field is invalid: Alt", Hostinger deploy 2026-11-12).
function altLocale(alt: AltByLocale): { locale: Locale; alt: string } | null {
  if (typeof alt === 'string') return alt.trim() ? { locale: 'fr', alt } : null
  for (const locale of ['fr', 'en'] as const) {
    const value = alt?.[locale]
    if (value?.trim()) return { locale, alt: value }
  }
  return null
}

const storedNames = (doc: Media) =>
  [doc.filename, ...Object.values(doc.sizes ?? {}).map((size) => size?.filename)].filter(
    (name): name is string => Boolean(name),
  )

// The storage plugin adds `prefix` only when R2 is configured, and the generated types are built
// without it, so the field is not on `Media`.
const isComplete = (doc: Media, keys: Set<string>) => {
  const prefix = (doc as Media & { prefix?: string | null }).prefix || defaultPrefix
  return storedNames(doc).every((name) => keys.has(`${prefix}/${name}`))
}

async function main(): Promise<number> {
  if (unknown.length) {
    console.error(`Unknown option(s): ${unknown.join(' ')}. Allowed: ${known.join(' ')}`)
    return 2
  }
  const bucket = process.env.S3_BUCKET
  if (!bucket) {
    console.error('S3_BUCKET is not set: media is on local disk, there is no bucket to repair.')
    return 2
  }

  const target = assertSeedTarget(process.env.DATABASE_URL, args.has('--force'))
  console.log(`Checking media of ${target.host}/${target.database} against bucket ${bucket}…`)

  const keys = await bucketKeys(bucket)
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'media',
    pagination: false,
    depth: 0,
    sort: 'id',
    locale: 'all',
  })
  const broken = docs.filter((doc) => !isComplete(doc, keys))
  console.log(`${docs.length} media documents, ${keys.size} files in the bucket.`)
  console.log(`${broken.length} document(s) with missing files.`)
  if (!broken.length) return 0

  const index = await sourceIndex()
  let repaired = 0
  let failed = 0
  for (const doc of broken) {
    const source = doc.sourceHash ? index.get(doc.sourceHash) : undefined
    if (!source) {
      failed++
      console.error(`  ✗ ${doc.id} ${doc.filename}: original file not found`)
      continue
    }
    const target = altLocale(doc.alt as AltByLocale)
    if (!target) {
      failed++
      console.error(`  ✗ ${doc.id} ${doc.filename}: no alt text in any locale`)
      continue
    }
    if (!apply) {
      console.log(
        `  · ${doc.id} ${doc.filename} ← ${path.relative(process.cwd(), source)} (${target.locale})`,
      )
      continue
    }
    try {
      const updated = await payload.update({
        collection: 'media',
        id: doc.id,
        locale: target.locale,
        data: { alt: target.alt },
        filePath: source,
        depth: 0,
        // A new object per call: a shared context skips every upload after the first.
        context: { disableRevalidate: true },
      })
      repaired++
      console.log(`  ✓ ${doc.id} ${updated.filename}`)
    } catch (error) {
      failed++
      console.error(
        `  ✗ ${doc.id} ${doc.filename}: ${error instanceof Error ? error.message : error}`,
      )
    }
  }

  if (!apply) {
    console.log('\nDry run: nothing changed. Re-run with --apply to re-upload.')
    return failed ? 1 : 0
  }
  // Check the bucket rather than trust the upload calls: that is what went wrong the first time.
  const after = await bucketKeys(bucket)
  const fresh = await payload.find({
    collection: 'media',
    where: { id: { in: broken.map((doc) => doc.id) } },
    pagination: false,
    depth: 0,
  })
  const stillMissing = fresh.docs.filter((doc) => !isComplete(doc, after))
  console.log(`\nRe-uploaded ${repaired}, failed ${failed}, still missing ${stillMissing.length}.`)
  for (const doc of stillMissing) console.error(`  ✗ ${doc.id} ${doc.filename} still incomplete`)
  return failed || stillMissing.length ? 1 : 0
}

// Payload keeps its database pool open, so the process must exit explicitly (CLAUDE.md §8).
main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    console.error(`✗ ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  })
