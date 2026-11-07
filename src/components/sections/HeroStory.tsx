'use client'

import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { Phone } from '@/components/device/Phone'
import { PhoneSplash } from '@/components/device/PhoneSplash'
import type { HeroVideo, HeroVideoSource } from '@/lib/hero'
import { useLightData } from '@/lib/useLightData'

export type StoryCue = {
  key: string
  time: number
  icon: React.ReactNode
  title: string
  body: string
}

// One background photo. `image` is rendered on the server; the first one is preloaded (LCP).
export type HeroSlide = { key: string; image: React.ReactNode; caption: string }

type Props = {
  cues: StoryCue[]
  video: HeroVideo | null
  screen: React.ReactNode
  // The intro that plays in the phone before `screen`, like the app's launch screen (ADR-028).
  splash: { sources: HeroVideoSource[]; poster: string }
  // Below the phone on small screens, under `children` on large ones.
  trust: React.ReactNode
  // Background photos of our crews (home.hero.slides); empty keeps `backdrop`.
  slides?: HeroSlide[]
  // Still photo under the overlay (the video's poster) when there are no slides.
  backdrop?: React.ReactNode
  labels: {
    app: string
    now: string
    pause: string
    play: string
    slider: string
    previous: string
    next: string
    // "{n}" and "{total}" are replaced.
    show: string
  }
  children: React.ReactNode
}

// Hold the last notification for a few seconds before the timer loop restarts.
const LOOP_TAIL_SECONDS = 4
const TICK_SECONDS = 0.25
const VISIBLE_NOTIFICATIONS = 3
// How long each photo shows; the progress bars and the ken-burns animation follow it.
const SLIDE_MS = 6500

// True once the window has loaded. Later slides and the still backdrop wait for it, so they never
// share the connection with the first slide and the phone screenshot.
const onPageLoad = (callback: () => void) => {
  window.addEventListener('load', callback)
  return () => window.removeEventListener('load', callback)
}
const usePageLoaded = () =>
  useSyncExternalStore(
    onPageLoad,
    () => document.readyState === 'complete',
    () => false,
  )

/**
 * Client island of the synced-story hero (FR-HOME-01/02). Notifications follow the footage's
 * own clock (requestVideoFrameCallback) when video plays, and a timer otherwise. Without video,
 * photos of our crews crossfade behind the copy with a slow push-in, like a classic hero slider.
 * Light-data and reduced-motion visitors get the first photo only, still. The phone opens on the
 * app's intro (PhoneSplash), then Home and the notifications. One pause button stops everything
 * that moves (WCAG 2.2.2).
 */
export function HeroStory({
  cues,
  video,
  screen,
  splash,
  trust,
  slides = [],
  backdrop = null,
  labels,
  children,
}: Props) {
  const light = useLightData()
  const playVideo = light === false && video !== null
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  // Notifications belong to the app's Home screen, so they wait for the intro to end.
  const [appOpen, setAppOpen] = useState(false)
  const openApp = useCallback(() => setAppOpen(true), [])
  const pageLoaded = usePageLoaded()
  const videoRef = useRef<HTMLVideoElement>(null)
  const timeRef = useRef(cues[0]?.time ?? 0)
  const loopLength = (cues.at(-1)?.time ?? 0) + LOOP_TAIL_SECONDS

  // Slider state: the current photo and the one fading out (it keeps its motion while it fades).
  const useSlides = !playVideo && slides.length > 0
  // Light-data mode keeps to the first photo: no extra downloads, no controls.
  const slideCount = light === false ? slides.length : Math.min(slides.length, 1)
  const [slide, setSlide] = useState(0)
  const [previous, setPrevious] = useState<number | null>(null)

  const goTo = useCallback(
    (index: number) => {
      if (slideCount < 2) return
      const next = ((index % slideCount) + slideCount) % slideCount
      if (next === slide) return
      setPrevious(slide)
      setSlide(next)
    },
    [slide, slideCount],
  )

  // Index of the latest cue that has fired by `seconds`, or -1 before the first one.
  const indexAt = useCallback(
    (seconds: number) => {
      let index = -1
      cues.forEach((cue, i) => {
        if (seconds >= cue.time) index = i
      })
      return index
    },
    [cues],
  )

  // Timer mode.
  useEffect(() => {
    if (light === null || playVideo || paused || !appOpen) return
    const id = setInterval(() => {
      timeRef.current = (timeRef.current + TICK_SECONDS) % loopLength
      setActive(indexAt(timeRef.current))
    }, TICK_SECONDS * 1000)
    return () => clearInterval(id)
  }, [light, playVideo, paused, appOpen, loopLength, indexAt])

  // Video mode.
  useEffect(() => {
    const element = videoRef.current
    if (!playVideo || !element) return
    // Older Firefox/Safari lack requestVideoFrameCallback; timeupdate (~4 Hz) stays within ±250 ms.
    if (typeof element.requestVideoFrameCallback === 'function') {
      let handle = 0
      const onFrame: VideoFrameRequestCallback = (_now, metadata) => {
        setActive(indexAt(metadata.mediaTime))
        handle = element.requestVideoFrameCallback(onFrame)
      }
      handle = element.requestVideoFrameCallback(onFrame)
      return () => element.cancelVideoFrameCallback(handle)
    }
    const onTime = () => setActive(indexAt(element.currentTime))
    element.addEventListener('timeupdate', onTime)
    return () => element.removeEventListener('timeupdate', onTime)
  }, [playVideo, indexAt])

  useEffect(() => {
    const element = videoRef.current
    if (!element) return
    if (paused) element.pause()
    else element.play().catch(() => setPaused(true))
  }, [paused, playVideo])

  // Slider autoplay: only once the page has loaded (later photos are mounted then), never under
  // reduced motion, and not while the tab is hidden.
  const [reducedMotion, setReducedMotion] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  const autoplay = useSlides && pageLoaded && slideCount > 1 && !paused && !reducedMotion
  useEffect(() => {
    if (!autoplay) return
    const id = setTimeout(() => {
      if (!document.hidden) goTo(slide + 1)
    }, SLIDE_MS)
    return () => clearTimeout(id)
  }, [autoplay, slide, goTo])

  const visible =
    !appOpen || active < 0
      ? []
      : cues.slice(Math.max(0, active - VISIBLE_NOTIFICATIONS + 1), active + 1).reverse()
  const hasPhoto = playVideo || useSlides || Boolean(backdrop)

  return (
    <>
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        {/* Phones: the hero is taller than the screen, so the photo covers the first screen only
            and melts into the section's background behind the phone. */}
        <div className="absolute inset-x-0 top-0 h-svh lg:h-full">
          {useSlides
            ? slides.slice(0, slideCount).map(({ key, image }, index) => {
                const current = index === slide
                // Later photos mount after load; the first one is server-rendered and preloaded.
                if (index > 0 && !pageLoaded) return null
                const moving = current || index === previous
                return (
                  <div
                    key={key}
                    className={`absolute inset-0 transition-opacity duration-[1200ms] ease-in-out ${
                      current ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <div
                      className={`absolute inset-0 ${
                        moving
                          ? index % 2
                            ? 'motion-safe:animate-ken-burns-b'
                            : 'motion-safe:animate-ken-burns-a'
                          : ''
                      }`}
                    >
                      {image}
                    </div>
                  </div>
                )
              })
            : pageLoaded
              ? backdrop
              : null}
          {playVideo && video ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              poster={video.poster}
              className="absolute inset-0 size-full object-cover"
            >
              {video.sources.map(({ src, type, media }) => (
                <source key={src} src={src} type={type} media={media} />
              ))}
            </video>
          ) : null}
          {hasPhoto ? (
            <>
              {/* Phones: dark enough behind the copy at the top, fading into the section below.
                Desktops: dark behind the copy on the left, the photo opens up to the right. */}
              <div className="absolute inset-0 bg-gradient-to-b from-night-950/85 from-0% via-night-950/70 via-55% to-night-900 lg:bg-gradient-to-r lg:from-night-950/95 lg:from-0% lg:via-night-900/65 lg:via-45% lg:to-night-900/15" />
              <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-night-950/70 to-transparent" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(55%_50%_at_78%_35%,rgb(28_93_112/0.6),transparent_70%),radial-gradient(40%_40%_at_12%_90%,rgb(231_171_52/0.16),transparent_70%)]" />
              <svg className="absolute inset-0 size-full text-white/[0.04] [mask-image:radial-gradient(70%_60%_at_70%_40%,black,transparent)]">
                <defs>
                  <pattern id="hero-hex" width="56" height="48" patternUnits="userSpaceOnUse">
                    <path d="M14 0h28l14 24-14 24H14L0 24z" fill="none" stroke="currentColor" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hero-hex)" />
              </svg>
            </>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-night-900 to-transparent" />
      </div>

      {/* Phones: copy, phone, then the film and trust rows, so the first screen has the CTAs and
          the phone. Desktops: both text blocks stay together in the left column, centred. */}
      <div className="container-site grid min-h-svh content-start gap-y-10 pt-24 pb-24 sm:pt-28 lg:grid-cols-[1.1fr_0.9fr] lg:content-center lg:gap-x-8 lg:gap-y-6 lg:pt-24">
        {/* Phones: a soft shadow keeps the copy readable over bright parts of a photo. */}
        <div className="[text-shadow:0_1px_14px_rgb(10_28_37/0.75)] lg:self-end lg:[text-shadow:none]">
          {children}
        </div>

        <div
          aria-hidden
          className="relative flex justify-center lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:items-center lg:justify-end"
        >
          <div className="absolute top-1/2 -right-6 hidden size-80 -translate-y-1/2 rounded-full bg-teal-500/30 blur-3xl lg:block" />
          <div className="lg:[perspective:1600px]">
            <div className="lg:motion-safe:animate-float">
              <div className="transition-transform duration-700 ease-out-expo lg:[transform:rotateY(-8deg)_rotateX(3deg)]">
                <Phone
                  size="hero"
                  overlay={
                    <ol
                      className={`-mx-[0.625em] space-y-[0.5em] px-[0.625em] pb-[1em] ${
                        visible.length
                          ? 'bg-gradient-to-b from-mist-50 from-85% to-transparent'
                          : ''
                      }`}
                    >
                      {/* Sizes in em follow the phone (Phone, `--phone-em`). */}
                      {visible.map((cue, index) => (
                        <li
                          key={cue.key}
                          className={`flex animate-notification-in items-start gap-[0.625em] rounded-[1em] bg-white p-[0.625em] shadow-lg ring-1 ring-black/5 transition-transform duration-500 ${
                            index > 0 ? 'scale-[0.96]' : ''
                          }`}
                        >
                          <span className="grid size-[2em] shrink-0 place-items-center rounded-[0.5em] bg-night-900 text-gold-300">
                            {cue.icon}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-[0.5em] text-[0.5625em] text-slate-500">
                              <span className="font-semibold tracking-wide uppercase">
                                {labels.app}
                              </span>
                              {labels.now}
                            </span>
                            <span className="block text-[0.6875em] leading-tight font-semibold text-ink">
                              {cue.title}
                            </span>
                            <span className="block text-[0.625em] leading-snug text-slate-500">
                              {cue.body}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  }
                >
                  {screen}
                  <PhoneSplash
                    sources={splash.sources}
                    poster={splash.poster}
                    paused={paused}
                    onDone={openApp}
                  />
                </Phone>
              </div>
            </div>
          </div>
        </div>

        <div className="[text-shadow:0_1px_14px_rgb(10_28_37/0.75)] lg:col-start-1 lg:row-start-2 lg:self-start lg:[text-shadow:none]">
          {trust}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-5 z-10">
        <div className="container-site flex items-center justify-between gap-4">
          {useSlides && slideCount > 1 ? (
            <div
              role="group"
              aria-label={labels.slider}
              className="flex min-w-0 items-center gap-3"
            >
              <button
                type="button"
                onClick={() => goTo(slide - 1)}
                aria-label={labels.previous}
                className="hidden size-11 shrink-0 place-items-center rounded-full border border-white/15 bg-night-900/60 text-white/80 backdrop-blur transition-colors hover:text-white sm:grid"
              >
                <ChevronLeft aria-hidden className="size-4" />
              </button>
              <ol className="flex items-center gap-1.5">
                {slides.slice(0, slideCount).map(({ key, caption }, index) => (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => goTo(index)}
                      aria-label={labels.show
                        .replace('{n}', String(index + 1))
                        .replace('{total}', String(slideCount))
                        .concat(caption ? `: ${caption}` : '')}
                      aria-current={index === slide ? 'true' : undefined}
                      className="group flex h-11 items-center"
                    >
                      <span className="relative block h-1 w-8 overflow-hidden rounded-full bg-white/25 transition-[width] duration-300 group-aria-[current=true]:w-14 sm:w-10 sm:group-aria-[current=true]:w-16">
                        <span
                          key={index === slide ? `on-${slide}` : 'off'}
                          className={`absolute inset-0 origin-left rounded-full bg-gold-500 ${
                            index === slide
                              ? autoplay
                                ? 'animate-slide-progress'
                                : 'scale-x-100'
                              : 'scale-x-0'
                          }`}
                          style={{ '--slide-ms': `${SLIDE_MS}ms` } as React.CSSProperties}
                        />
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                onClick={() => goTo(slide + 1)}
                aria-label={labels.next}
                className="hidden size-11 shrink-0 place-items-center rounded-full border border-white/15 bg-night-900/60 text-white/80 backdrop-blur transition-colors hover:text-white sm:grid"
              >
                <ChevronRight aria-hidden className="size-4" />
              </button>
              <p className="hidden truncate text-sm text-white/70 md:block">
                {slides[slide]?.caption}
              </p>
            </div>
          ) : (
            <span />
          )}

          {/* WCAG 2.2.2: anything that moves automatically for more than 5 s needs a pause control. */}
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? labels.play : labels.pause}
            className="grid size-11 shrink-0 place-items-center rounded-full border border-white/15 bg-night-900/60 text-white/80 backdrop-blur transition-colors hover:text-white"
          >
            {paused ? (
              <Play aria-hidden className="size-4" />
            ) : (
              <Pause aria-hidden className="size-4" />
            )}
          </button>
        </div>
      </div>
    </>
  )
}
