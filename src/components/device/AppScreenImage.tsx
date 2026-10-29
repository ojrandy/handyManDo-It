import React from 'react'

import { CmsImage } from '@/components/ui/CmsImage'
import { imageSources } from '@/lib/media'
import type { AppScreen } from '@/payload-types'

type Props = {
  screen: AppScreen | undefined
  // Shown while the screen hasn't been captured into the CMS (fresh database).
  fallback: React.ReactNode
  // Above the fold. In the hero on wide screens the screenshot is the largest image, so it is the
  // LCP element there: preloaded from the head, at high priority.
  eager?: boolean
}

// The screen inside a Phone frame is 268 px wide from `sm` up (244 px below). Phones get the
// 560 px file at 3× too (2.3× density, indistinguishable on UI text) instead of the 960 px one:
// under the hero copy there, it should cost ~40 KB, not ~95 KB.
const sizes = '(min-width: 640px) 268px, 186px'

// A captured app screenshot filling a Phone frame. Decorative: the frames that hold it are
// aria-hidden, and the surrounding copy says what the app does.
export function AppScreenImage({ screen, fallback, eager = false }: Props) {
  const sources = imageSources(screen?.image)
  if (!sources.length) return <>{fallback}</>
  return (
    <CmsImage
      sources={sources}
      alt=""
      fill
      sizes={sizes}
      preload={eager}
      loading={eager ? undefined : 'lazy'}
      fetchPriority={eager ? 'high' : 'low'}
      className="object-cover object-top"
    />
  )
}
