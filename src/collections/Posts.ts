import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { isEditor, publishedOrEditor } from '@/access'
import { slugField } from '@/fields/slug'
import { revalidateCollection } from '@/hooks/revalidate'

// The first publish stamps the date unless the editor set one (imports keep the WordPress date).
const stampPublishedAt: CollectionBeforeChangeHook = ({ data }) => {
  if (data._status === 'published' && !data.publishedAt) data.publishedAt = new Date().toISOString()
  return data
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'categories', 'publishedAt', '_status'],
    group: 'Content',
  },
  defaultSort: '-publishedAt',
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
  hooks: {
    beforeChange: [stampPublishedAt],
    ...revalidateCollection('posts'),
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    // One slug for both locales: most migrated articles exist in a single language, and the
    // legacy redirects (PLAN.md §8) point at one URL per article.
    slugField(),
    { name: 'excerpt', type: 'textarea', localized: true },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    { name: 'content', type: 'richText', required: true, localized: true },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      index: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Set automatically on first publish.',
      },
    },
    {
      // Not public: user records are private, so pages credit the company (Article JSON-LD).
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      defaultValue: ({ user }) => user?.id,
      admin: { position: 'sidebar' },
    },
    {
      name: 'legacyUrl',
      type: 'text',
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'Old WordPress URL, for the redirect audit. Filled by the import.',
      },
    },
  ],
}
