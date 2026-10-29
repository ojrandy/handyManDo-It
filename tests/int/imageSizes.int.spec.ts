import { describe, expect, it } from 'vitest'

import nextConfig from '../../next.config'
import { Media } from '@/collections/Media'

// CmsImage answers each srcset width with the narrowest Media size covering it. If the widths
// Next lists differ from the sizes we generate, the srcset names a 960 px file "640w" and 2×
// screens download twice the bytes they need (the hero's LCP image did, until 2026-10-29).
describe('srcset widths', () => {
  it('match the Media sizes generated at upload', () => {
    const widths = (Media.upload as { imageSizes: { width: number }[] }).imageSizes.map(
      (size) => size.width,
    )
    expect(nextConfig.images?.deviceSizes).toEqual([...widths].sort((a, b) => a - b))
  })
})
