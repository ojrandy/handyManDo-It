import type { Field, GlobalConfig } from 'payload'

import { anyone, isEditor } from '@/access'
import { revalidateGlobal } from '@/hooks/revalidate'

// Lucide names the home sections can show next to a cue, pillar or trust point.
const homeIcons = [
  'badge-check',
  'shield-check',
  'navigation',
  'circle-check',
  'key-round',
  'clock',
  'handshake',
  'sparkles',
  'wallet',
  'smartphone',
] as const

const iconField: Field = {
  name: 'icon',
  type: 'select',
  options: homeIcons.map((value) => ({ label: value, value })),
}

const text = (name: string, required = false, localized = true): Field => ({
  name,
  type: 'text',
  localized,
  required,
})

const textarea = (name: string, required = false, localized = true): Field => ({
  name,
  type: 'textarea',
  localized,
  required,
})

// Fields inside a localized array pass localized = false: the array is already per language.

// Every section opens with an eyebrow and a title. Section copy is optional: while a field is
// empty the site keeps its messages/*.json copy (T-1.15), so sections can be filled one by one.
const heading = (): Field[] => [text('eyebrow'), text('title')]

// Lists are localized as a whole: a language may have a different number of items.
const titledItems = (name: string, maxRows: number, withIcon = false): Field => ({
  name,
  type: 'array',
  localized: true,
  maxRows,
  fields: [
    ...(withIcon ? [iconField] : []),
    text('title', true, false),
    textarea('body', false, false),
  ],
})

const section = (name: string, label: string, fields: Field[]) => ({
  label,
  fields: [{ name, type: 'group', fields } as Field],
})

// Home page copy, one tab per section (PLAN.md §5.2–5.16). Buttons, aria labels and other UI
// chrome stay in messages/*.json; counters come from the `site` global.
export const Home: GlobalConfig = {
  slug: 'home',
  admin: { group: 'Content' },
  versions: { drafts: true, max: 20 },
  access: {
    read: anyone,
    update: isEditor,
  },
  hooks: {
    afterChange: revalidateGlobal('home'),
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        section('hero', 'Hero', [
          text('eyebrow'),
          text('titleStart'),
          text('titleHighlight'),
          textarea('subtitle'),
          text('values'),
          {
            name: 'video',
            type: 'group',
            admin: {
              description:
                'Empty MP4 ⇒ designed background, timer-driven cues. Files come from `npm run encode:hero`.',
            },
            fields: [
              { name: 'mp4', type: 'upload', relationTo: 'media', label: 'MP4 (720p)' },
              { name: 'webm', type: 'upload', relationTo: 'media', label: 'WebM (720p)' },
              // Screens ≥ 1280 px get 1080p, phones and small tablets 480p (PLAN.md §2: 3 sizes).
              { name: 'mp4Large', type: 'upload', relationTo: 'media', label: 'MP4 (1080p)' },
              { name: 'webmLarge', type: 'upload', relationTo: 'media', label: 'WebM (1080p)' },
              { name: 'mp4Small', type: 'upload', relationTo: 'media', label: 'MP4 (480p)' },
              { name: 'webmSmall', type: 'upload', relationTo: 'media', label: 'WebM (480p)' },
              {
                name: 'poster',
                type: 'upload',
                relationTo: 'media',
                admin: { description: 'AVIF under 120 KB (NFR-PERF-02).' },
              },
            ],
          },
          {
            name: 'film',
            type: 'group',
            admin: { description: '"Watch the film" lightbox.' },
            fields: [
              { name: 'video', type: 'upload', relationTo: 'media' },
              { name: 'poster', type: 'upload', relationTo: 'media' },
              { name: 'captions', type: 'upload', relationTo: 'media' },
            ],
          },
          {
            // Notifications synced to the footage (FR-HOME-01), in the app's job order.
            name: 'cues',
            type: 'array',
            localized: true,
            maxRows: 8,
            fields: [
              {
                name: 'time',
                type: 'number',
                required: true,
                min: 0,
                admin: { description: 'Seconds into the video.' },
              },
              iconField,
              text('title', true, false),
              text('body', false, false),
            ],
          },
        ]),
        section('pillars', 'Why us', [
          ...heading(),
          titledItems('values', 4, true),
          text('trustTitle'),
          titledItems('trust', 6, true),
        ]),
        section('numbers', 'Numbers', [...heading(), textarea('body')]),
        section('howItWorks', 'How it works', [...heading(), titledItems('steps', 5)]),
        section('audiences', 'Audiences', [
          ...heading(),
          {
            name: 'items',
            type: 'array',
            localized: true,
            maxRows: 3,
            fields: [
              {
                name: 'audience',
                type: 'select',
                required: true,
                options: [
                  { label: 'Homes', value: 'homes' },
                  { label: 'Businesses', value: 'businesses' },
                  { label: 'Buildings', value: 'buildings' },
                ],
              },
              text('title', true, false),
              { name: 'points', type: 'array', maxRows: 6, fields: [text('text', true, false)] },
            ],
          },
        ]),
        section('earn', 'Earn', [
          ...heading(),
          textarea('body'),
          {
            name: 'tabs',
            type: 'array',
            localized: true,
            maxRows: 4,
            fields: [
              text('label', true, false),
              text('title', true, false),
              { name: 'points', type: 'array', maxRows: 6, fields: [text('text', true, false)] },
            ],
          },
          {
            name: 'steps',
            type: 'array',
            localized: true,
            maxRows: 6,
            fields: [text('text', true, false)],
          },
        ]),
        section('services', 'Services', heading()),
        section('testimonials', 'Testimonials', heading()),
        section('faq', 'FAQ', heading()),
        section('download', 'Download', [
          ...heading(),
          textarea('bodyAndroid'),
          textarea('bodyAll'),
        ]),
        section('blog', 'Blog', heading()),
      ],
    },
  ],
}
