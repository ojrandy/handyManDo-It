import type { CollectionConfig } from 'payload'

import { isEditor } from '@/access'
import { revalidateCollection } from '@/hooks/revalidate'

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
  hooks: revalidateCollection('media'),
  fields: [
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
