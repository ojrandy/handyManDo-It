import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

import type { CollectionBeforeOperationHook, CollectionConfig } from 'payload'

import { isEditor } from '@/access'
import { revalidateCollection } from '@/hooks/revalidate'

// Fingerprint of the file as it was uploaded. Imports find a file they already uploaded by its
// content: the stored name is not reliable (Payload renames a clashing upload by bumping its
// trailing number, so photo-1.webp can be stored as photo-7.webp), and neither are the stored
// bytes (Payload re-encodes images). So this runs before the operation, while `req.file` still
// holds the original bytes; by `beforeChange` they are already re-encoded.
const stampSourceHash: CollectionBeforeOperationHook = async ({ args, operation, req }) => {
  const file = req.file
  if (!file || (operation !== 'create' && operation !== 'update')) return args
  const bytes = file.data?.length
    ? file.data
    : file.tempFilePath
      ? await readFile(file.tempFilePath)
      : null
  if (!bytes) return args
  const sourceHash = createHash('sha256').update(bytes).digest('hex')
  return { ...args, data: { ...args.data, sourceHash } }
}

const revalidate = revalidateCollection('media')

// Sizes are generated once at upload so the Hostinger server never resizes
// images per request (docs/PLAN.md §2).
export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  // Pages embed media (alt, sizes) through depth-1 reads, which are tagged 'media' too.
  hooks: { ...revalidate, beforeOperation: [stampSourceHash] },
  fields: [
    {
      // SHA-256 of the original upload, set by stampSourceHash; scripts/seed/media.ts matches on it.
      name: 'sourceHash',
      type: 'text',
      index: true,
      admin: { hidden: true },
    },
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'caption',
      type: 'text',
      localized: true,
    },
  ],
  upload: {
    mimeTypes: ['image/*', 'video/mp4', 'video/webm', 'application/pdf'],
    focalPoint: true,
    // Without this a repeat visit downloads every local file again. A day, not immutable: a
    // re-upload can reuse a filename. R2 files skip this route.
    modifyResponseHeaders: ({ headers }) => {
      headers.set('Cache-Control', 'public, max-age=86400')
      return headers
    },
    imageSizes: [
      { name: 'thumb', width: 480, formatOptions: { format: 'webp', options: { quality: 78 } } },
      // A phone frame's screen at 2× (268 px): the hero's LCP image on desktop.
      { name: 'phone', width: 560, formatOptions: { format: 'webp', options: { quality: 70 } } },
      { name: 'card', width: 960, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'wide', width: 1600, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'hero', width: 2400, formatOptions: { format: 'webp', options: { quality: 78 } } },
    ],
  },
}
