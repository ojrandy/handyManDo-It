import { ArrowLeft, ArrowRight, Moon, Pause, Play, Sun } from 'lucide-react'
import type React from 'react'

import { Phone } from '@/components/device/Phone'
import { CmsImage } from '@/components/ui/CmsImage'
import type { ImageSource } from '@/lib/media'

export type Theme = 'light' | 'dark'

export type GallerySlide = {
  key: string
  caption: string
  images: Record<Theme, { sources: ImageSource[]; alt: string }>
}

export type CoverflowProps = {
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

type ViewProps = CoverflowProps & {
  active: number
  theme: Theme
  // Autoplay is offered (pause button) / running (caption not announced).
  canAutoplay: boolean
  rotating: boolean
  paused: boolean
  rootRef?: React.Ref<HTMLDivElement>
  rootHandlers?: React.HTMLAttributes<HTMLDivElement>
  stageHandlers?: React.HTMLAttributes<HTMLDivElement>
  // A slide click (ignored right after a drag) and a previous/next button press.
  onSelect?: (index: number) => void
  onGo?: (index: number) => void
  onTheme?: (theme: Theme) => void
  onTogglePause?: () => void
}

// Slides further than this from the current one are hidden and load no image.
const REACH = 2

// Markup of the screens coverflow (FR-HOME-10), without state or effects. The server renders it
// at its first state (NearView); Coverflow renders it again with state and handlers once its code
// has loaded near the view, so the swap changes nothing on screen.
export function CoverflowView({
  slides,
  labels,
  active,
  theme,
  canAutoplay,
  rotating,
  paused,
  rootRef,
  rootHandlers,
  stageHandlers,
  onSelect,
  onGo,
  onTheme,
  onTogglePause,
}: ViewProps) {
  const count = slides.length
  const button =
    'grid size-11 place-items-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10'
  const current = slides[active]

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.label}
      {...rootHandlers}
    >
      <div role="group" aria-label={labels.theme} className="flex justify-center gap-1">
        {(['light', 'dark'] as const).map((value) => {
          const Icon = value === 'light' ? Sun : Moon
          return (
            <button
              key={value}
              type="button"
              aria-pressed={theme === value}
              onClick={onTheme && (() => onTheme(value))}
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
        {...stageHandlers}
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
              onClick={onSelect && (() => onSelect(index))}
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
            onClick={onGo && (() => onGo(active - 1))}
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
            onClick={onGo && (() => onGo(active + 1))}
            aria-label={labels.next}
            className={button}
          >
            <ArrowRight aria-hidden className="size-5" />
          </button>
          {canAutoplay ? (
            <button
              type="button"
              onClick={onTogglePause}
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
