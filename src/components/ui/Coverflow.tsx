'use client'

import { ArrowLeft, ArrowRight, Moon, Pause, Play, Sun } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

import { Phone } from '@/components/device/Phone'
import { CmsImage } from '@/components/ui/CmsImage'
import type { ImageSource } from '@/lib/media'
import { useSlowData } from '@/lib/useLightData'

type Theme = 'light' | 'dark'

export type GallerySlide = {
  key: string
  caption: string
  images: Record<Theme, { sources: ImageSource[]; alt: string }>
}

type Props = {
  slides: GallerySlide[]
  labels: {
    label: string
    // Contains "{n}" and "{total}", filled in here: the client has no message formatter.
    slide: string
    previous: string
    next: string
    pause: string
    play: string
    theme: string
    light: string
    dark: string
  }
}

// Slides further than this from the current one are hidden and load no image.
const REACH = 2
const DRAG_THRESHOLD = 40
const AUTOPLAY_MS = 3500

/**
 * 3D coverflow of the real app screens (FR-HOME-10): it slides on its own and loops, while it is on
 * screen. Drag or swipe the stage, use the arrow keys on it, or the buttons. The light/dark toggle
 * swaps every screenshot. Autoplay holds under the mouse and on keyboard focus, stops with the pause
 * button (WCAG 2.2.2), and never starts under reduced motion or on Save-Data and slow connections,
 * where each new slide would be a download nobody asked for.
 * Only the current slide is exposed to assistive tech; the caption below announces manual changes.
 */
export function Coverflow({ slides, labels }: Props) {
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

  const onPointerDown = (event: React.PointerEvent) => {
    drag.current = { x: event.clientX, moved: false }
  }
  const onPointerUp = (event: React.PointerEvent) => {
    const start = drag.current
    if (!start) return
    const dx = event.clientX - start.x
    if (Math.abs(dx) > DRAG_THRESHOLD) {
      start.moved = true
      go(active + (dx < 0 ? 1 : -1))
    }
  }

  const button =
    'grid size-11 place-items-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10'
  const current = slides[active]

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.label}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setHeld(true)
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') setHeld(false)
      }}
      // Keyboard focus only: a tapped button keeps focus, which would stop a phone's slideshow.
      onFocus={(event) => {
        if (event.target.matches(':focus-visible')) setHeld(true)
      }}
      onBlur={() => setHeld(false)}
    >
      <div role="group" aria-label={labels.theme} className="flex justify-center gap-1">
        {(['light', 'dark'] as const).map((value) => {
          const Icon = value === 'light' ? Sun : Moon
          return (
            <button
              key={value}
              type="button"
              aria-pressed={theme === value}
              onClick={() => setTheme(value)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white/75 ring-1 ring-white/20 transition-colors hover:text-white aria-pressed:bg-gold-500 aria-pressed:text-night-950 aria-pressed:ring-gold-500"
            >
              <Icon aria-hidden className="size-4" />
              {labels[value]}
            </button>
          )
        })}
      </div>

      {/* Focusable so the arrow keys work on it; the slides themselves are images. */}
      <div
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (drag.current = null)}
        className="relative mt-10 h-[34.375rem] cursor-grab touch-pan-y [perspective:1400px] select-none [zoom:0.72] active:cursor-grabbing sm:h-[37.5rem] sm:[zoom:0.85] lg:[zoom:1]"
      >
        {slides.map(({ key, images }, index) => {
          // Shortest way round the loop, so the first and last screens are neighbours.
          const raw = index - active
          const offset = Math.abs(raw) > count / 2 ? raw - Math.sign(raw) * count : raw
          const distance = Math.abs(offset)
          const hidden = distance > REACH
          const image = images[theme]
          return (
            <div
              key={key}
              role="group"
              aria-roledescription="slide"
              aria-label={labels.slide
                .replace('{n}', String(index + 1))
                .replace('{total}', String(count))}
              aria-hidden={offset !== 0}
              onClick={() => {
                if (!drag.current?.moved) go(index)
              }}
              style={{
                transform: `translateX(-50%) translateX(${offset * 70}%) rotateY(${
                  Math.sign(offset) * -38
                }deg) scale(${1 - distance * 0.14})`,
                zIndex: count - distance,
                opacity: hidden ? 0 : 1 - distance * 0.25,
                visibility: hidden ? 'hidden' : undefined,
              }}
              className="absolute top-0 left-1/2 transition-[transform,opacity] duration-500 ease-out-expo"
            >
              <Phone>
                {hidden ? null : (
                  <CmsImage
                    sources={image.sources}
                    alt={offset === 0 ? image.alt : ''}
                    fill
                    sizes="(min-width: 640px) 268px, 244px"
                    loading="lazy"
                    draggable={false}
                    className="object-cover object-top"
                  />
                )}
              </Phone>
            </div>
          )
        })}
      </div>

      <div className="mt-8 flex flex-col items-center gap-5">
        <p
          aria-live={rotating ? 'off' : 'polite'}
          className="min-h-7 text-center text-lg font-semibold text-white"
        >
          {current?.caption}
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => go(active - 1)}
            aria-label={labels.previous}
            className={button}
          >
            <ArrowLeft aria-hidden className="size-5" />
          </button>
          <p aria-hidden className="w-16 text-center text-sm text-white/60 tabular-nums">
            {active + 1} / {count}
          </p>
          <button
            type="button"
            onClick={() => go(active + 1)}
            aria-label={labels.next}
            className={button}
          >
            <ArrowRight aria-hidden className="size-5" />
          </button>
          {canAutoplay ? (
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              aria-label={paused ? labels.play : labels.pause}
              className={button}
            >
              {paused ? (
                <Play aria-hidden className="size-5" />
              ) : (
                <Pause aria-hidden className="size-5" />
              )}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
