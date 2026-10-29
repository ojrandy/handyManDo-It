import React from 'react'

import { CmsImage } from '@/components/ui/CmsImage'
import { imageSources } from '@/lib/media'
import type { AppScreen } from '@/payload-types'

type Props = {
  screen: AppScreen | undefined
  // Shown while the screen hasn't been captured into the CMS (fresh database).
  fallback: React.ReactNode
  // Above the fold. In the hero on wide screens the screenshot is the largest image, so it is the
  // LCP element there: fetch it first (about 40 KB at 480 px).
  eager?: boolean
}

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
      sizes="18rem"
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'low'}
      className="object-cover object-top"
    />
  )
}
