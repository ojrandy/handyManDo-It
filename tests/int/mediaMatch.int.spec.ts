import { randomBytes } from 'node:crypto'
import { copyFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

import { findMedia, hashFile } from '../../scripts/seed/media'

// Regression for duplicated seed photos (2026-11-07): leftover files in /media made Payload store
// photo-1.webp as photo-2.webp, so name matching missed it (a new copy on every --update) or,
// worse, matched photo-2.webp to the wrong picture.
let payload: Payload
let staticDir: string
const context = { disableRevalidate: true }
const alt = 'int-test-media-match'
const stem = `int-match-${randomBytes(4).toString('hex')}`
const work = mkdtempSync(path.join(tmpdir(), 'media-match-'))
const photos = 'public/images/projects/crystal-hair-challenge-2022/crystal-hair-challenge-2022'
const first = path.join(work, `${stem}-1.webp`)
const second = path.join(work, `${stem}-2.webp`)
const stray = () => path.join(staticDir, `${stem}-1.webp`)

const upload = (filePath: string) =>
  payload.create({ collection: 'media', data: { alt }, filePath, depth: 0, context })

describe('seed media matching', () => {
  beforeAll(async () => {
    // sharp's file cache keeps the temp images open, and Windows won't delete open files.
    sharp.cache(false)
    payload = await getPayload({ config })
    staticDir = payload.collections.media.config.upload.staticDir as string
    // Real photos, made unique by one random pixel: the seed test uploads the originals to the
    // same database, and an identical file would rightly match its row instead of ours.
    const unique = (from: string, to: string) =>
      sharp(from)
        .composite([
          { input: randomBytes(3), raw: { width: 1, height: 1, channels: 3 }, top: 0, left: 0 },
        ])
        .webp()
        .toFile(to)
    await unique(`${photos}-1.webp`, first)
    await unique(`${photos}-2.webp`, second)
  })

  afterAll(async () => {
    await payload.delete({ collection: 'media', where: { alt: { equals: alt } }, context })
    if (existsSync(stray())) rmSync(stray())
    rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  })

  it('records the hash of the original file, not of the re-encoded copy', async () => {
    const doc = await upload(second)
    expect(doc.sourceHash).toBe(await hashFile(second))
    expect(await findMedia(payload, second)).toBe(doc.id)
    await payload.delete({ collection: 'media', id: doc.id, context })
  })

  it('finds a renamed upload by content and never matches another photo by name', async () => {
    // A leftover file takes the name, so Payload stores the first photo as "-2".
    copyFileSync(`${photos}-3.webp`, stray())
    const doc = await upload(first)
    expect(doc.filename).toBe(`${stem}-2.webp`)

    expect(await findMedia(payload, first)).toBe(doc.id)
    // The second photo's own name now points at the first photo: it must not match.
    expect(await findMedia(payload, second)).toBeNull()
  })

  it('verifies a row uploaded before hashes existed, then stamps it', async () => {
    const doc = await upload(second)
    await payload.update({
      collection: 'media',
      id: doc.id,
      data: { sourceHash: null },
      depth: 0,
      context,
    })

    expect(await findMedia(payload, first)).not.toBe(doc.id)
    expect(await findMedia(payload, second)).toBe(doc.id)
    const stamped = await payload.findByID({ collection: 'media', id: doc.id, depth: 0 })
    expect(stamped.sourceHash).toBe(await hashFile(second))
  })
})
