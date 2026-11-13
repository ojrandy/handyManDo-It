'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'

import type { ImageSource } from '@/lib/media'

type Props = Omit<ImageProps, 'src' | 'loader' | 'unoptimized'> & {
  sources: ImageSource[]
  // Inline images in running text have no frame of their own: a hidden one leaves a blank gap
  // as tall as the photo, so it is removed instead.
  removeOnError?: boolean
}

// CMS images are resized once at upload (Media imageSizes), never per request (CLAUDE.md §6.3).
// The loader answers each srcset width with the narrowest generated size that covers it.
export function CmsImage({ sources, alt, className, onError, removeOnError, ...props }: Props) {
  // Files missing from storage (incident 2026-11-10) can be one generated size while the original
  // is there, so a failed size retries with the original first. If that fails too, the image is
  // hidden and keeps its box, so the frame's own background shows instead of the browser's
  // broken-image icon, and the layout does not move.
  const [stage, setStage] = useState<'sizes' | 'original' | 'failed'>('sizes')
  const largest = sources.at(-1)
  if (!largest) return null
  if (stage === 'failed' && removeOnError) return null
  const single = sources.length === 1 || stage !== 'sizes'
  const shared = {
    ...props,
    src: largest.url,
    className: stage === 'failed' ? `${className ?? ''} invisible` : className,
    onError: (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setStage(single ? 'failed' : 'original')
      onError?.(event)
    },
  }
  // A new key gives the original its own <img>, so the browser drops the failed srcset.
  if (single) return <Image key="original" {...shared} alt={alt} unoptimized />
  return (
    <Image
      key="sizes"
      {...shared}
      alt={alt}
      loader={({ width }) => (sources.find((source) => source.width >= width) ?? largest).url}
    />
  )
}
