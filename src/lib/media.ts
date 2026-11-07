import type { Media } from '@/payload-types'

// An upload field holds an id at depth 0 and the populated document at depth 1 (or null when
// the media is missing or not readable).
type Upload = number | Media | null | undefined

export const asMedia = (value: Upload): Media | null =>
  value && typeof value === 'object' ? value : null

// Payload writes files on our own route as absolute to its server URL, and cached reads outlive
// that URL: on another port the browser gets a dead link, blocked by the CSP as well. A
// same-origin path works on any host. R2 files have their own origin and pass through.
const sameOrigin = (url: string) => url.replace(/^https?:\/\/[^/]+(?=\/api\/media\/file\/)/, '')

export const mediaUrl = (value: Upload): string | null => {
  const url = asMedia(value)?.url
  return url ? sameOrigin(url) : null
}

export type ImageSource = { url: string; width: number }

// The sizes generated at upload plus the original, narrowest first. Payload skips sizes wider
// than the original, so small uploads only have the original.
export function imageSources(value: Upload): ImageSource[] {
  const media = asMedia(value)
  if (!media?.url) return []
  const sizes = Object.values(media.sizes ?? {}).flatMap((size) =>
    size?.url && size.width ? [{ url: sameOrigin(size.url), width: size.width }] : [],
  )
  const original = {
    url: sameOrigin(media.url),
    width: media.width ?? Math.max(0, ...sizes.map((s) => s.width)),
  }
  return [...sizes.filter(({ width }) => width < original.width), original].sort(
    (a, b) => a.width - b.width,
  )
}
