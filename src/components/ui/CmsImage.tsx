'use client'

import Image, { type ImageProps } from 'next/image'

import type { ImageSource } from '@/lib/media'

type Props = Omit<ImageProps, 'src' | 'loader' | 'unoptimized'> & { sources: ImageSource[] }

// CMS images are resized once at upload (Media imageSizes), never per request (CLAUDE.md §6.3).
// The loader answers each srcset width with the narrowest generated size that covers it.
export function CmsImage({ sources, alt, ...props }: Props) {
  const largest = sources.at(-1)
  if (!largest) return null
  if (sources.length === 1) return <Image {...props} alt={alt} src={largest.url} unoptimized />
  return (
    <Image
      {...props}
      alt={alt}
      src={largest.url}
      loader={({ width }) => (sources.find((source) => source.width >= width) ?? largest).url}
    />
  )
}
