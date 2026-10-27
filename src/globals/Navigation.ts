import type { GlobalConfig } from 'payload'

import { anyone, isEditor } from '@/access'
import { linkField } from '@/fields/link'
import { serviceIcons } from '@/lib/service-keys'
import { revalidateGlobal } from '@/hooks/revalidate'

// Header and footer menus (FR-GLB-01/02). Contact details, socials and store links stay in the
// `site` global.
export const Navigation: GlobalConfig = {
  slug: 'navigation',
  admin: { group: 'Settings' },
  access: {
    read: anyone,
    update: isEditor,
  },
  hooks: {
    afterChange: revalidateGlobal('navigation'),
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Header',
          fields: [
            {
              name: 'header',
              type: 'array',
              maxRows: 8,
              admin: { initCollapsed: true },
              fields: [
                linkField(),
                {
                  // A non-empty list turns the item into a mega-menu.
                  name: 'children',
                  type: 'array',
                  maxRows: 16,
                  admin: { initCollapsed: true },
                  fields: [
                    linkField(),
                    { name: 'description', type: 'text', localized: true },
                    {
                      name: 'icon',
                      type: 'select',
                      options: serviceIcons.map((value) => ({ label: value, value })),
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Footer',
          fields: [
            {
              name: 'footerColumns',
              type: 'array',
              maxRows: 4,
              admin: { initCollapsed: true },
              fields: [
                { name: 'title', type: 'text', required: true, localized: true },
                {
                  name: 'links',
                  type: 'array',
                  maxRows: 12,
                  fields: [linkField()],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
