import type { CollectionConfig } from 'payload'

import { anyone, isEditor } from '@/access'
import { slugField } from '@/fields/slug'
import { revalidateCollection } from '@/hooks/revalidate'

// Blog categories. The slug is shared by both locales (used as a filter, not a page URL).
export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug'],
    group: 'Content',
  },
  access: {
    read: anyone,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  // Post pages show category names, so they refresh too.
  hooks: revalidateCollection('categories', 'posts'),
  fields: [{ name: 'title', type: 'text', required: true, localized: true }, slugField()],
}
