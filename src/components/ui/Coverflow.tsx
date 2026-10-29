'use client'

import { ArrowLeft, ArrowRight, Moon, Sun } from 'lucide-react'
import React, { useRef, useState } from 'react'

import { Phone } from '@/components/device/Phone'
import { CmsImage } from '@/components/ui/CmsImage'
import type { ImageSource } from '@/lib/media'

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
    theme: string
    light: string
    dark: string
  }
}

// Slides further than this from the current one are hidden and load no image.
const REACH = 2
const DRAG_THRESHOLD = 40

/**
 * 3D coverflow of the real app screens (FR-HOME-10): drag or swipe the stage, use the arrow
 * keys on it, or the buttons. The light/dark toggle swaps every screenshot. Never auto-advances.
 * Only the current slide is exposed to assistive tech; the caption below announces changes.
 */
export function Coverflow({ slides, labels }: Props) {
  const [active, setActive] = useState(0)
  const [theme, setTheme] = useState<Theme>('light')
  const drag = useRef<{ x: number; moved: boolean } | null>(null)
  const last = slides.length - 1

  const go = (index: number) => setActive(Math.min(last, Math.max(0, index)))

  const onKeyDown = (event: React.KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowLeft: active - 1,
      ArrowRight: active + 1,
      Home: 0,
      End: last,
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
    'grid size-11 place-items-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-40'
  const current = slides[active]

  return (
    <div role="region" aria-roledescription="carousel" aria-label={labels.label}>
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
        className="relative mt-10 h-[35.75rem] cursor-grab touch-pan-y [perspective:1400px] select-none [zoom:0.72] active:cursor-grabbing sm:h-[39rem] sm:[zoom:0.85] lg:[zoom:1]"
      >
        {slides.map(({ key, images }, index) => {
          const offset = index - active
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
                .replace('{total}', String(slides.length))}
              aria-hidden={offset !== 0}
              onClick={() => {
                if (!drag.current?.moved) go(index)
              }}
              style={{
                transform: `translateX(-50%) translateX(${offset * 70}%) rotateY(${
                  Math.sign(offset) * -38
                }deg) scale(${1 - distance * 0.14})`,
                zIndex: slides.length - distance,
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
        <p aria-live="polite" className="min-h-7 text-center text-lg font-semibold text-white">
          {current?.caption}
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => go(active - 1)}
            disabled={active === 0}
            aria-label={labels.previous}
            className={button}
          >
            <ArrowLeft aria-hidden className="size-5" />
          </button>
          <p aria-hidden className="w-16 text-center text-sm text-white/60 tabular-nums">
            {active + 1} / {slides.length}
          </p>
          <button
            type="button"
            onClick={() => go(active + 1)}
            disabled={active === last}
            aria-label={labels.next}
            className={button}
          >
            <ArrowRight aria-hidden className="size-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
