import type { GlobalConfig } from 'payload'

import { anyone, isAdmin } from '@/access'
import { revalidateGlobal } from '@/hooks/revalidate'

// Site-wide SEO defaults and the Organization JSON-LD. Per-page meta lives in each document's
// SEO tab (plugin-seo); these fill the gaps.
export const Seo: GlobalConfig = {
  slug: 'seo',
  label: 'SEO',
  admin: { group: 'Settings' },
  access: {
    read: anyone,
    update: isAdmin,
  },
  hooks: {
    afterChange: revalidateGlobal('seo'),
  },
  fields: [
    {
      name: 'defaultTitle',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'HandyMan Do IT',
      admin: { description: 'Home page title, and the suffix of other page titles.' },
    },
    {
      name: 'defaultDescription',
      type: 'textarea',
      required: true,
      localized: true,
      maxLength: 160,
    },
    {
      name: 'ogImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Share image when a page has none. 1200×630.' },
    },
    {
      name: 'organization',
      type: 'group',
      admin: { description: 'Organization structured data (JSON-LD).' },
      fields: [
        { name: 'legalName', type: 'text', defaultValue: 'HandyMan Do IT' },
        { name: 'foundingDate', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
        {
          name: 'sameAs',
          type: 'array',
          admin: { description: 'Official profiles (social, app stores).' },
          fields: [
            {
              name: 'url',
              type: 'text',
              required: true,
              validate: (value: string | null | undefined) =>
                /^https:\/\/\S+$/.test(value ?? '') || 'Use a full https:// link.',
            },
          ],
        },
      ],
    },
  ],
}
