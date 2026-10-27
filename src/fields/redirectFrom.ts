import type { Field, FieldHook } from 'payload'

// "https://handymandoit.com/Old-Page/?x=1" → "/Old-Page"; old URLs are matched on the path only.
export const toRedirectPath = (value: string): string => {
  let path = value.trim()
  try {
    path = new URL(path, 'https://handymandoit.com').pathname
  } catch {
    // Not URL-shaped; validation below reports it.
  }
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}

const normalise: FieldHook = ({ value }) =>
  typeof value === 'string' && value ? toRedirectPath(value) : value

// Wraps the plugin's `from` field: same name/uniqueness, plus normalising and validation so
// "/blog/x/" and "https://handymandoit.com/blog/x" can't become two rules for one URL.
export const redirectFromPath = (field: Field): Field =>
  ({
    ...field,
    admin: {
      ...('admin' in field ? field.admin : {}),
      description: 'Old path on this site, e.g. /blog/old-article. Domain and query are dropped.',
    },
    hooks: { beforeValidate: [normalise] },
    validate: (value: string | null | undefined) =>
      (typeof value === 'string' && /^\/\S*$/.test(value) && value !== '/') ||
      'Use a path starting with /, other than the home page.',
  }) as Field
