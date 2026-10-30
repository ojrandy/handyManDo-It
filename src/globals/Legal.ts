import type { Field, GlobalConfig } from 'payload'

import { anyone, isEditor } from '@/access'
import { revalidateGlobal } from '@/hooks/revalidate'

// One tab per legal page (FR-PG-15, ADR-022): /legal/privacy, /legal/terms, /legal/disclaimer.
const page = (name: 'privacy' | 'terms' | 'disclaimer', label: string) => ({
  label,
  fields: [
    {
      name,
      type: 'group',
      fields: [
        { name: 'content', type: 'richText', required: true, localized: true },
        {
          name: 'lastUpdated',
          type: 'date',
          required: true,
          admin: {
            date: { pickerAppearance: 'dayOnly' },
            description: 'Shown on the page. Change it when the text changes.',
          },
        },
      ],
    } satisfies Field,
  ],
})

export const Legal: GlobalConfig = {
  slug: 'legal',
  admin: {
    group: 'Settings',
    description:
      'Privacy policy, terms of use and disclaimer. Have changes reviewed before saving.',
  },
  access: {
    read: anyone,
    update: isEditor,
  },
  hooks: {
    afterChange: revalidateGlobal('legal'),
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        page('privacy', 'Privacy policy'),
        page('terms', 'Terms of use'),
        page('disclaimer', 'Disclaimer'),
      ],
    },
  ],
}
