'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'

import type { ImageSource } from '@/lib/media'

type Props = Omit<ImageProps, 'src' | 'loader' | 'unoptimized'> & { sources: ImageSource[] }

// CMS images are resized once at upload (Media imageSizes), never per request (CLAUDE.md §6.3).
// The loader answers each srcset width with the narrowest generated size that covers it.
export function CmsImage({ sources, alt, className, onError, ...props }: Props) {
  // A file missing from storage (incident 2026-11-10) would show the browser's broken-image icon
  // and alt text over the card. Hiding the image keeps its box, so the frame's own background
  // shows instead and the layout does not move.
  const [failed, setFailed] = useState(false)
  const largest = sources.at(-1)
  if (!largest) return null
  const shared = {
    ...props,
    src: largest.url,
    className: failed ? `${className ?? ''} invisible` : className,
    onError: (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setFailed(true)
      onError?.(event)
    },
  }
  if (sources.length === 1) return <Image {...shared} alt={alt} unoptimized />
  return (
    <Image
      {...shared}
      alt={alt}
      loader={({ width }) => (sources.find((source) => source.width >= width) ?? largest).url}
    />
  )
}
