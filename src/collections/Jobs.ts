import type { CollectionConfig } from 'payload'

import { anyone, isEditor } from '@/access'
import { slugField } from '@/fields/slug'
import { revalidateCollection } from '@/hooks/revalidate'

export const Jobs: CollectionConfig = {
  slug: 'jobs',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'location', 'type', 'open', 'closesAt'],
    group: 'Company',
  },
  defaultSort: '-createdAt',
  access: {
    read: anyone,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  hooks: revalidateCollection('jobs'),
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    // /careers/[slug] is a translated route, so each language has its own slug.
    slugField({ localized: true }),
    { name: 'location', type: 'text', required: true, admin: { position: 'sidebar' } },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'full-time',
      options: [
        { label: 'Full-time', value: 'full-time' },
        { label: 'Part-time', value: 'part-time' },
        { label: 'Contract', value: 'contract' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'open',
      type: 'checkbox',
      defaultValue: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Closed roles stay visible but take no applications.',
      },
    },
    {
      name: 'closesAt',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' } },
    },
    { name: 'description', type: 'richText', required: true, localized: true },
  ],
}
