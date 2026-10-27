import type { CollectionConfig } from 'payload'

import { isEditor, publishedOrEditor } from '@/access'
import { orderField } from '@/fields/order'
import { slugField } from '@/fields/slug'
import { revalidateCollection } from '@/hooks/revalidate'
import { serviceIcons, serviceKeys } from '@/lib/service-keys'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'fromPrice', 'featuredOnHome', 'order', '_status'],
    group: 'Content',
  },
  defaultSort: 'order',
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
  hooks: revalidateCollection('services'),
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    slugField({ localized: true }),
    {
      name: 'key',
      type: 'select',
      unique: true,
      options: serviceKeys.map((value) => ({ label: value, value })),
      admin: {
        position: 'sidebar',
        description:
          'Links one of the 11 built-in services to its site assets. Leave empty for new ones.',
      },
    },
    {
      name: 'icon',
      type: 'select',
      required: true,
      options: serviceIcons.map((value) => ({ label: value, value })),
      admin: { position: 'sidebar' },
    },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    { name: 'summary', type: 'textarea', required: true, localized: true },
    { name: 'body', type: 'richText', localized: true },
    {
      // Localized as a whole: each language may list a different number of items.
      name: 'inclusions',
      type: 'array',
      localized: true,
      labels: { singular: 'Inclusion', plural: "What's included" },
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'process',
      type: 'array',
      localized: true,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea' },
      ],
    },
    {
      name: 'fromPrice',
      type: 'number',
      min: 0,
      admin: {
        position: 'sidebar',
        description: 'FCFA. Empty shows "Clear price before you book".',
      },
    },
    {
      name: 'featuredOnHome',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'size',
      type: 'select',
      defaultValue: 'small',
      options: [
        { label: 'Large tile', value: 'large' },
        { label: 'Small tile', value: 'small' },
      ],
      admin: { position: 'sidebar', description: 'Tile size in the home services grid.' },
    },
    orderField,
  ],
}
