import type { CollectionConfig } from 'payload'

import { anyone, isEditor } from '@/access'
import { orderField } from '@/fields/order'
import { revalidateCollection } from '@/hooks/revalidate'

export const Partners: CollectionConfig = {
  slug: 'partners',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'logo', 'url', 'sisterProduct', 'order'],
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
      validate: (
        value: string | null | undefined,
        { siblingData }: { siblingData: Partial<{ sisterProduct: boolean | null }> },
      ) => {
        if (!value) {
          // A footer logo is a link to the product; without one it would lead nowhere.
          return siblingData.sisterProduct ? 'A sister product needs its website link' : true
        }
        return /^https?:\/\/\S+$/.test(value) || 'Use a full link starting with https://'
      },
    },
    {
      // Footer "Sister Products" row (FR-GLB-02, owner 2026-11-07). Ticked partners show there
      // as logo links, in partner order.
      name: 'sisterProduct',
      type: 'checkbox',
      defaultValue: false,
      label: {
        en: 'Show in footer (Sister Products)',
        fr: 'Afficher dans le pied de page (Produits frères)',
      },
      admin: {
        position: 'sidebar',
        description: {
          en: 'The logo links to the website above, opening in a new tab.',
          fr: 'Le logo renvoie vers le site ci-dessus, dans un nouvel onglet.',
        },
      },
    },
    orderField,
  ],
}
