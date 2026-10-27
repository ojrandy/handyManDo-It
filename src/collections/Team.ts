import type { CollectionConfig } from 'payload'

import { anyone, isEditor } from '@/access'
import { orderField } from '@/fields/order'
import { revalidateCollection } from '@/hooks/revalidate'

export const Team: CollectionConfig = {
  slug: 'team',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'order'],
    group: 'Company',
  },
  defaultSort: 'order',
  access: {
    read: anyone,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  hooks: revalidateCollection('team'),
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'role', type: 'text', required: true, localized: true },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'bio', type: 'textarea', localized: true },
    orderField,
  ],
}
