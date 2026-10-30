'use client'

import { useState } from 'react'

import type { ImageSource } from '@/lib/media'

import { CmsImage } from './CmsImage'

type Photo = { sources: ImageSource[]; alt: string }

type Props = {
  before: Photo
  after: Photo
  labels: { before: string; after: string; compare: string }
}

// Before/after comparison (FR-PG-07). A native range input does the work, so it is keyboard
// (arrows, Home/End) and screen-reader operable; the "after" photo is clipped above the
// "before" one. No animation, so nothing changes under reduced motion.
export function BeforeAfter({ before, after, labels }: Props) {
  const [position, setPosition] = useState(50)

  return (
    <figure className="relative aspect-[3/2] overflow-hidden rounded-panel bg-night-900 select-none has-[input:focus-visible]:ring-4 has-[input:focus-visible]:ring-teal-400">
      <CmsImage
        sources={before.sources}
        alt={`${labels.before}: ${before.alt}`}
        fill
        sizes="(min-width: 1024px) 66vw, 100vw"
        className="object-cover"
      />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
        <CmsImage
          sources={after.sources}
          alt={`${labels.after}: ${after.alt}`}
          fill
          sizes="(min-width: 1024px) 66vw, 100vw"
          className="object-cover"
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow"
        style={{ left: `${position}%` }}
      />
      <span className="absolute top-3 left-3 rounded-full bg-night-950/70 px-3 py-1 text-xs font-semibold text-white">
        {labels.before}
      </span>
      <span className="absolute top-3 right-3 rounded-full bg-night-950/70 px-3 py-1 text-xs font-semibold text-white">
        {labels.after}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        aria-label={labels.compare}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </figure>
  )
}
