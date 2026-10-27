'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

type Props = {
  // id of the scroll-snap track these buttons drive.
  trackId: string
  labels: { previous: string; next: string }
}

// Previous/next buttons for a CSS scroll-snap track. The track itself is server-rendered and
// keyboard-scrollable, so the content works without JS; this island only adds the buttons.
// Never auto-advances (WCAG 2.2.2).
export function CarouselControls({ trackId, labels }: Props) {
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const track = useCallback(() => document.getElementById(trackId), [trackId])

  useEffect(() => {
    const element = track()
    if (!element) return
    const update = () => {
      setAtStart(element.scrollLeft <= 4)
      setAtEnd(element.scrollLeft + element.clientWidth >= element.scrollWidth - 4)
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
      left: direction * (slide.offsetWidth + 20),
      behavior: smooth ? 'smooth' : 'auto',
    })
  }

  const button =
    'grid size-11 place-items-center rounded-full border border-teal-600/30 text-teal-700 transition-colors hover:bg-teal-600 hover:text-white disabled:pointer-events-none disabled:opacity-40'

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => go(-1)}
        disabled={atStart}
        aria-controls={trackId}
        aria-label={labels.previous}
        className={button}
      >
        <ArrowLeft aria-hidden className="size-5" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        disabled={atEnd}
        aria-controls={trackId}
        aria-label={labels.next}
        className={button}
      >
        <ArrowRight aria-hidden className="size-5" />
      </button>
    </div>
  )
}
