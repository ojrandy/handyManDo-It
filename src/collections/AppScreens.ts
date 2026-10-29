import type { CollectionConfig } from 'payload'

import { anyone, isEditor } from '@/access'
import { revalidateCollection } from '@/hooks/revalidate'

export const appScreenKeys = [
  'welcome',
  'home',
  'services',
  'category',
  'shop',
  'food',
  'help',
  'pro',
  'tracking',
  'wallet',
  'chat',
  'completion',
] as const

// Screenshots of the real app (FR-HOME-10), one document per screen × language × theme. The
// language is a plain field, not Payload localization: each locale's screenshot is a different
// image with its own theme, captured by scripts/capture-screens.ts.
export const AppScreens: CollectionConfig = {
  slug: 'app-screens',
  labels: { singular: 'App screen', plural: 'App screens' },
  admin: {
    useAsTitle: 'key',
    defaultColumns: ['key', 'lang', 'theme', 'image'],
    group: 'Marketing',
  },
  defaultSort: 'key',
  indexes: [{ fields: ['key', 'lang', 'theme'], unique: true }],
  access: {
    read: anyone,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  hooks: revalidateCollection('app-screens'),
  fields: [
    {
      name: 'key',
      type: 'select',
      required: true,
      options: appScreenKeys.map((value) => ({ label: value, value })),
    },
    {
      name: 'lang',
      type: 'select',
      required: true,
      options: [
        { label: 'Français', value: 'fr' },
        { label: 'English', value: 'en' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'theme',
      type: 'select',
      required: true,
      defaultValue: 'light',
      options: [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: 'Phone screenshot, 390×844 at 3× (1170×2532).' },
    },
    { name: 'caption', type: 'text', localized: true },
  ],
}
