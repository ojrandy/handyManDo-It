import { statSync } from 'node:fs'
import path from 'node:path'

import sharp from 'sharp'

import type { Payload } from 'payload'

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Width and height of an image file, or null for files sharp cannot read (video).
export async function imageSize(file: string): Promise<{ width: number; height: number } | null> {
  try {
    const { width, height } = await sharp(file).metadata()
    return width && height ? { width, height } : null
  } catch {
    return null
  }
}

// The media document already holding this file, so imports upload each file once. Matches the
// file name; a file already on disk under that name makes Payload store "name-1.webp", so the
// renamed copy is found too. Payload re-encodes some images on upload, so images match on their
// dimensions; other files (video) on their size.
export async function findMedia(payload: Payload, source: string): Promise<number | null> {
  const filename = path.basename(source)
  const exact = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    depth: 0,
  })
  if (exact.docs[0]) return exact.docs[0].id
  const ext = path.extname(filename)
  const stem = filename.slice(0, -ext.length || undefined)
  const renamedName = new RegExp(`^${escapeRegExp(stem)}-\\d+${escapeRegExp(ext)}$`)
  const size = await imageSize(source)
  const renamed = await payload.find({
    collection: 'media',
    where: { filename: { like: `${stem}-` } },
    limit: 50,
    depth: 0,
  })
  const match = renamed.docs.find(
    (doc) =>
      renamedName.test(doc.filename ?? '') &&
      (size
        ? doc.width === size.width && doc.height === size.height
        : doc.filesize === statSync(source).size),
  )
  return match?.id ?? null
}
