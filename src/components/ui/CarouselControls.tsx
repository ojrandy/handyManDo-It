'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

type Props = {
  // id of the scroll-snap track these buttons drive.
  trackId: string
  labels: { previous: string; next: string }
  // Number of slides: shows that many position dots, spread out against the buttons.
  dots?: number
  className?: string
}

// Previous/next buttons for a CSS scroll-snap track. The track itself is server-rendered and
// keyboard-scrollable, so the content works without JS; this island only adds the buttons.
// Never auto-advances (WCAG 2.2.2).
export function CarouselControls({ trackId, labels, dots = 0, className = '' }: Props) {
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

  const button =
    'grid size-11 place-items-center rounded-full border border-teal-600/30 text-teal-700 transition-colors hover:bg-teal-600 hover:text-white disabled:pointer-events-none disabled:opacity-40'

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {dots ? (
        // Decorative: the slides are all in the page, and the buttons say where they lead.
        <div aria-hidden className="flex items-center gap-1.5">
          {Array.from({ length: dots }, (_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === current ? 'w-6 bg-teal-600' : 'w-1.5 bg-teal-600/25'
              }`}
            />
          ))}
        </div>
      ) : null}
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
    </div>
  )
}
