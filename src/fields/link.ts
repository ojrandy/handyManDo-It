import type { Field } from 'payload'

import { routing } from '@/i18n/routing'

// Fixed site pages, by their routing key, so the site resolves the translated URL per locale.
// Dynamic routes (/services/[slug] …) are linked through `doc` instead.
const pages = Object.keys(routing.pathnames).filter((key) => !key.includes('['))

const isExternalUrl = (value: string | null | undefined) =>
  Boolean(value && /^(https?:\/\/|mailto:|tel:)\S+$/.test(value))

type LinkOptions = {
  name?: string
  label?: boolean
}

export const linkField = ({ name = 'link', label = true }: LinkOptions = {}): Field => ({
  name,
  type: 'group',
  admin: { hideGutter: true },
  fields: [
    {
      type: 'row',
      fields: [
        ...(label
          ? [{ name: 'label', type: 'text', required: true, localized: true } as Field]
          : []),
        {
          name: 'type',
          type: 'radio',
          required: true,
          defaultValue: 'page',
          options: [
            { label: 'Site page', value: 'page' },
            { label: 'Document', value: 'doc' },
            { label: 'External', value: 'external' },
          ],
        },
      ],
    },
    {
      name: 'page',
      type: 'select',
      options: pages.map((value) => ({ label: value, value })),
      admin: { condition: (_, sibling) => sibling?.type === 'page' },
      validate: (value: unknown, { siblingData }: { siblingData: { type?: string } }) =>
        siblingData.type !== 'page' || Boolean(value) || 'Pick a page.',
    },
    {
      name: 'doc',
      type: 'relationship',
      relationTo: ['services', 'projects', 'posts', 'jobs'],
      admin: { condition: (_, sibling) => sibling?.type === 'doc' },
      validate: (value: unknown, { siblingData }: { siblingData: { type?: string } }) =>
        siblingData.type !== 'doc' || Boolean(value) || 'Pick a document.',
    },
    {
      name: 'url',
      type: 'text',
      admin: { condition: (_, sibling) => sibling?.type === 'external' },
      validate: (
        value: string | null | undefined,
        { siblingData }: { siblingData: { type?: string } },
      ) =>
        siblingData.type !== 'external' ||
        isExternalUrl(value) ||
        'Use a full https://, mailto: or tel: link.',
    },
  ],
})
