'use client'

import { useCallback, useEffect, useState } from 'react'

import { CarouselControlsView, type CarouselControlsProps } from './CarouselControlsView'

// Previous/next buttons for a CSS scroll-snap track. The track itself is server-rendered and
// keyboard-scrollable, so the content works without JS; this island only adds the buttons, and
// loads near the view (NearView) to keep it out of the home's first load (NFR-PERF-02).
// Never auto-advances (WCAG 2.2.2).
export function CarouselControls({ trackId, labels, dots = 0 }: CarouselControlsProps) {
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const [current, setCurrent] = useState(0)

  const track = useCallback(() => document.getElementById(trackId), [trackId])

  useEffect(() => {
    const element = track()
    if (!element) return
    const update = () => {
      const end = element.scrollLeft + element.clientWidth >= element.scrollWidth - 4
      const slide = element.firstElementChild as HTMLElement | null
      setAtStart(element.scrollLeft <= 4)
      setAtEnd(end)
      if (slide) {
        const step = slide.offsetWidth + parseFloat(getComputedStyle(element).columnGap)
        // The last slide can't reach the track's start, so the end of the scroll stands for it.
        setCurrent(end ? element.children.length - 1 : Math.round(element.scrollLeft / step))
      }
    }
    // First measurement after layout; later ones come from scroll/resize events.
    const frame = requestAnimationFrame(update)
    element.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      element.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [track])

  const go = (direction: 1 | -1) => {
    const element = track()
    const slide = element?.firstElementChild as HTMLElement | null
    if (!element || !slide) return
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    element.scrollBy({
      left: direction * (slide.offsetWidth + parseFloat(getComputedStyle(element).columnGap)),
      behavior: smooth ? 'smooth' : 'auto',
    })
  }

  return (
    <CarouselControlsView
      trackId={trackId}
      labels={labels}
      dots={dots}
      current={current}
      atStart={atStart}
      atEnd={atEnd}
      onPrevious={() => go(-1)}
      onNext={() => go(1)}
    />
  )
}
