import type { CollectionConfig } from 'payload'

import { anyone, isEditor } from '@/access'
import { orderField } from '@/fields/order'
import { revalidateCollection } from '@/hooks/revalidate'

export const Partners: CollectionConfig = {
  slug: 'partners',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'logo', 'url', 'order'],
    group: 'Marketing',
  },
  defaultSort: 'order',
  access: {
    read: anyone,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  hooks: revalidateCollection('partners'),
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: "The logo's alt text should be the partner's name." },
    },
    {
      name: 'url',
      type: 'text',
      validate: (value: string | null | undefined) =>
        !value || /^https?:\/\/\S+$/.test(value) || 'Use a full link starting with https://',
    },
    orderField,
  ],
}
