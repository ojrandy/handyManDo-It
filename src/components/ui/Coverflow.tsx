'use client'

import React, { useEffect, useRef, useState } from 'react'

import { useSlowData } from '@/lib/useLightData'

import { CoverflowView, type CoverflowProps, type Theme } from './CoverflowView'

export type { CoverflowProps, GallerySlide } from './CoverflowView'

const DRAG_THRESHOLD = 40
const AUTOPLAY_MS = 3500

/**
 * 3D coverflow of the real app screens (FR-HOME-10): it slides on its own and loops, while it is on
 * screen. Drag or swipe the stage, use the arrow keys on it, or the buttons. The light/dark toggle
 * swaps every screenshot. Autoplay holds under the mouse and on keyboard focus, stops with the pause
 * button (WCAG 2.2.2), and never starts under reduced motion or on Save-Data and slow connections,
 * where each new slide would be a download nobody asked for.
 * Only the current slide is exposed to assistive tech; the caption below announces manual changes.
 * The markup is CoverflowView; this code loads near the view (NearView, NFR-PERF-02).
 */
export function Coverflow({ slides, labels }: CoverflowProps) {
  const [active, setActive] = useState(0)
  const [theme, setTheme] = useState<Theme>('light')
  const [paused, setPaused] = useState(false)
  const [held, setHeld] = useState(false)
  const [inView, setInView] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(true)
  const slow = useSlowData()
  const rootRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; moved: boolean } | null>(null)
  const count = slides.length

  const go = (index: number) => setActive(((index % count) + count) % count)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.4,
    })
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  const canAutoplay = slow === false && !reducedMotion
  const rotating = canAutoplay && inView && !paused && !held

  // Restarts with `active`, so a manual move gets the full delay too.
  useEffect(() => {
    if (!rotating) return
    const id = setTimeout(() => {
      setActive((current) => (document.hidden ? current : (current + 1) % count))
    }, AUTOPLAY_MS)
    return () => clearTimeout(id)
  }, [rotating, active, count])

  const onKeyDown = (event: React.KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowLeft: active - 1,
      ArrowRight: active + 1,
      Home: 0,
      End: count - 1,
    }
    if (!(event.key in keys)) return
    event.preventDefault()
    go(keys[event.key])
  }

  return (
    <CoverflowView
      slides={slides}
      labels={labels}
      active={active}
      theme={theme}
      canAutoplay={canAutoplay}
      rotating={rotating}
      paused={paused}
      rootRef={rootRef}
      rootHandlers={{
        onPointerEnter: (event) => {
          if (event.pointerType === 'mouse') setHeld(true)
        },
        onPointerLeave: (event) => {
          if (event.pointerType === 'mouse') setHeld(false)
        },
        // Keyboard focus only: a tapped button keeps focus, which would stop a phone's slideshow.
        onFocus: (event) => {
          if (event.target.matches(':focus-visible')) setHeld(true)
        },
        onBlur: () => setHeld(false),
      }}
      stageHandlers={{
        onKeyDown,
        onPointerDown: (event) => {
          drag.current = { x: event.clientX, moved: false }
        },
        onPointerUp: (event) => {
          const start = drag.current
          if (!start) return
          const dx = event.clientX - start.x
          if (Math.abs(dx) > DRAG_THRESHOLD) {
            start.moved = true
            go(active + (dx < 0 ? 1 : -1))
          }
        },
        onPointerCancel: () => {
          drag.current = null
        },
      }}
      // A slide click right after a drag is the drag's own release, not a choice.
      onSelect={(index) => {
        if (!drag.current?.moved) go(index)
      }}
      onGo={go}
      onTheme={setTheme}
      onTogglePause={() => setPaused((value) => !value)}
    />
  )
}
