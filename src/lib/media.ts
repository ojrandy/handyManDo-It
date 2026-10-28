import type { Media } from '@/payload-types'

// An upload field holds an id at depth 0 and the populated document at depth 1 (or null when
// the media is missing or not readable).
type Upload = number | Media | null | undefined

export const asMedia = (value: Upload): Media | null =>
  value && typeof value === 'object' ? value : null

export const mediaUrl = (value: Upload): string | null => asMedia(value)?.url ?? null

export type ImageSource = { url: string; width: number }

// The sizes generated at upload plus the original, narrowest first. Payload skips sizes wider
// than the original, so small uploads only have the original.
export function imageSources(value: Upload): ImageSource[] {
  const media = asMedia(value)
  if (!media?.url) return []
  const sizes = Object.values(media.sizes ?? {}).flatMap((size) =>
    size?.url && size.width ? [{ url: size.url, width: size.width }] : [],
  )
  const original = {
    url: media.url,
    width: media.width ?? Math.max(0, ...sizes.map((s) => s.width)),
  }
  return [...sizes.filter(({ width }) => width < original.width), original].sort(
    (a, b) => a.width - b.width,
  )
}
