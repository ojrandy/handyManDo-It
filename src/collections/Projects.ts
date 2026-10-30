import type { CollectionConfig } from 'payload'

import { isEditor, publishedOrEditor } from '@/access'
import { slugField } from '@/fields/slug'
import { revalidateCollection } from '@/hooks/revalidate'

// Case studies for "Our work" (FR-PG-04). Each belongs to one service; the service lists its
// projects through a join field (ADR-017).
export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'service', 'city', 'featured', 'date', '_status'],
    group: 'Content',
  },
  defaultSort: '-date',
  versions: {
    drafts: true,
    maxPerDoc: 20,
  },
  access: {
    read: publishedOrEditor,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  hooks: revalidateCollection('projects'),
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    slugField({ localized: true }),
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
      required: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      // Optional: the old site's gallery names no locations. Empty hides the city on the site.
      name: 'city',
      type: 'text',
      index: true,
      admin: { position: 'sidebar' },
    },
    { name: 'client', type: 'text', admin: { position: 'sidebar' } },
    {
      name: 'date',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'monthOnly' } },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Shown on the home page.' },
    },
    { name: 'cover', type: 'upload', relationTo: 'media', required: true },
    { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true },
    {
      name: 'beforeAfter',
      type: 'group',
      admin: { description: 'Both images enable the before/after slider.' },
      fields: [
        { name: 'before', type: 'upload', relationTo: 'media' },
        { name: 'after', type: 'upload', relationTo: 'media' },
      ],
    },
    { name: 'story', type: 'richText', localized: true },
  ],
}
