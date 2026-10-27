import type { CollectionConfig } from 'payload'

import { anyone, isEditor } from '@/access'
import { orderField } from '@/fields/order'
import { revalidateCollection } from '@/hooks/revalidate'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'city', 'service', 'rating', 'featured', 'order'],
    group: 'Marketing',
  },
  defaultSort: 'order',
  access: {
    read: anyone,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  hooks: revalidateCollection('testimonials'),
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'city', type: 'text', required: true },
    { name: 'quote', type: 'textarea', required: true, localized: true },
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'rating',
      type: 'number',
      min: 1,
      max: 5,
      admin: { position: 'sidebar', step: 1, description: 'Stars, 1–5. Empty hides the stars.' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar', description: 'Shown on the home page.' },
    },
    orderField,
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'projectPhoto', type: 'upload', relationTo: 'media' },
  ],
}
