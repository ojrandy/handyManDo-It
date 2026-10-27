import type { Field, FieldHook } from 'payload'

// "Réparations & Installations" → "reparations-installations"
export const toSlug = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// Runs per locale: on a localized slug, `data` holds the locale being edited, so each
// language gets its slug from its own title.
const fillSlug =
  (from: string): FieldHook =>
  ({ value, data, originalDoc }) => {
    if (typeof value === 'string' && value.trim()) return toSlug(value)
    const source = data?.[from] ?? originalDoc?.[from]
    return typeof source === 'string' ? toSlug(source) : value
  }

type SlugOptions = {
  from?: string
  localized?: boolean
}

export const slugField = ({ from = 'title', localized = false }: SlugOptions = {}): Field => ({
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  localized,
  admin: {
    position: 'sidebar',
    description: 'URL segment. Filled from the title when empty; changing it changes the URL.',
  },
  hooks: { beforeValidate: [fillSlug(from)] },
})
