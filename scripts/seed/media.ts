import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

import type { Payload } from 'payload'

import type { Media } from '@/payload-types'

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Width and height of an image file, or null for files sharp cannot read (video).
export async function imageSize(
  file: string | Buffer,
): Promise<{ width: number; height: number } | null> {
  try {
    const { width, height } = await sharp(file).metadata()
    return width && height ? { width, height } : null
  } catch {
    return null
  }
}

const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex')

// Same digest as the Media collection's `sourceHash` (src/collections/Media.ts).
export async function hashFile(file: string): Promise<string> {
  return sha256(await readFile(file))
}

// A 32×32 greyscale thumbnail. Payload's re-encoding moves it by well under 1 level on average;
// two different photos of the same event differ by 40 or more (measured 2026-11-07).
const thumbnail = (image: string | Buffer) =>
  sharp(image).resize(32, 32, { fit: 'fill' }).greyscale().raw().toBuffer()
const SAME_PICTURE = 4

async function samePicture(source: string, stored: Buffer): Promise<boolean> {
  const [a, b] = await Promise.all([imageSize(source), imageSize(stored)])
  if (!a || !b) return false
  if (a.width !== b.width || a.height !== b.height) return false
  const [x, y] = await Promise.all([thumbnail(source), thumbnail(stored)])
  let total = 0
  for (let i = 0; i < x.length; i++) total += Math.abs((x[i] ?? 0) - (y[i] ?? 0))
  return total / x.length <= SAME_PICTURE
}

// A media document's stored file, or null when it can't be read.
async function storedFile(payload: Payload, doc: Media): Promise<Buffer | null> {
  if (!doc.filename) return null
  const staticDir = payload.collections.media.config.upload.staticDir
  const local = staticDir ? path.resolve(staticDir, doc.filename) : null
  if (local && existsSync(local)) return readFile(local)
  // R2: Payload stores an absolute URL (MEDIA_PUBLIC_URL); a relative one is the local file route.
  if (!doc.url || !/^https?:\/\//.test(doc.url)) return null
  try {
    const response = await fetch(doc.url, { signal: AbortSignal.timeout(30_000) })
    return response.ok ? Buffer.from(await response.arrayBuffer()) : null
  } catch {
    return null
  }
}

// The media document already holding this file, so imports upload each file once.
//
// Matched on content, never on the name alone: Payload renames a clashing upload by bumping its
// trailing number (with photo-1…photo-6 already in /media, a new photo-1.webp is stored as
// photo-7.webp), so a name can point at another photo. Every upload records the SHA-256 of the
// original file in `sourceHash`, which is the first and normal match.
//
// Rows uploaded before that field existed have no hash, and their stored bytes differ from the
// source (Payload re-encodes images). Such a row, under a name derived from the source's, is
// accepted when it is the same picture (same size, near-identical thumbnail) or, for video and
// PDF, the same bytes; the hash is then written on it so the next run matches it directly. A row
// whose file can't be read is skipped: one spare upload beats a page showing the wrong photo.
export async function findMedia(payload: Payload, source: string): Promise<number | null> {
  const hash = await hashFile(source)
  const byHash = await payload.find({
    collection: 'media',
    where: { sourceHash: { equals: hash } },
    sort: 'id',
    limit: 1,
    depth: 0,
  })
  if (byHash.docs[0]) return byHash.docs[0].id

  const filename = path.basename(source)
  const ext = path.extname(filename)
  // "photo-1.webp" may be stored as "photo-1.webp", "photo-1-1.webp" or "photo-7.webp".
  const base = filename.slice(0, -ext.length || undefined).replace(/-\d+$/, '')
  const candidateName = new RegExp(`^${escapeRegExp(base)}(-\\d+)*${escapeRegExp(ext)}$`)
  const legacy = await payload.find({
    collection: 'media',
    where: { and: [{ filename: { like: base } }, { sourceHash: { exists: false } }] },
    sort: 'id',
    pagination: false,
    depth: 0,
  })
  const isImage = (await imageSize(source)) !== null
  for (const doc of legacy.docs) {
    if (!doc.filename || !candidateName.test(doc.filename)) continue
    const stored = await storedFile(payload, doc)
    if (!stored) continue
    if (isImage ? !(await samePicture(source, stored)) : sha256(stored) !== hash) continue
    await payload.update({
      collection: 'media',
      id: doc.id,
      data: { sourceHash: hash },
      depth: 0,
      context: { disableRevalidate: true },
    })
    return doc.id
  }
  return null
}
