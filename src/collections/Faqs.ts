import type { CollectionConfig } from 'payload'

import { anyone, isEditor } from '@/access'
import { orderField } from '@/fields/order'
import { revalidateCollection } from '@/hooks/revalidate'

export const faqCategories = [
  'payments',
  'coverage',
  'quotes',
  'cancellations',
  'guarantee',
  'safety',
  'pros',
  'business',
] as const

export const Faqs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'category', 'service', 'showOnHome', 'order'],
    group: 'Content',
  },
  defaultSort: 'order',
  access: {
    read: anyone,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  hooks: revalidateCollection('faqs'),
  fields: [
    { name: 'question', type: 'text', required: true, localized: true },
    // Rendered on the page and as FAQPage JSON-LD; keep answers short and factual.
    { name: 'answer', type: 'richText', required: true, localized: true },
    {
      name: 'category',
      type: 'select',
      required: true,
      index: true,
      options: faqCategories.map((value) => ({ label: value, value })),
      admin: { position: 'sidebar' },
    },
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
      index: true,
      admin: { position: 'sidebar', description: 'Also shown on this service page.' },
    },
    {
      name: 'showOnHome',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    orderField,
  ],
}
