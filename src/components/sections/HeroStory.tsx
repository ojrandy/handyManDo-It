'use client'

import { Pause, Play } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { Phone } from '@/components/device/Phone'
import type { HeroVideo } from '@/lib/hero'
import { useLightData } from '@/lib/useLightData'

export type StoryCue = {
  key: string
  time: number
  icon: React.ReactNode
  title: string
  body: string
}

type Props = {
  cues: StoryCue[]
  video: HeroVideo | null
  screen: React.ReactNode
  labels: { app: string; now: string; pause: string; play: string }
  children: React.ReactNode
}

// Hold the last notification for a few seconds before the timer loop restarts.
const LOOP_TAIL_SECONDS = 4
const TICK_SECONDS = 0.25
const VISIBLE_NOTIFICATIONS = 3

/**
 * Client island of the synced-story hero (FR-HOME-01/02). Notifications follow the footage's
 * own clock (requestVideoFrameCallback, so within a frame of each cue) when video plays, and a
 * timer in light-data mode, where the video element is never rendered and never requested.
 */
export function HeroStory({ cues, video, screen, labels, children }: Props) {
  const light = useLightData()
  const playVideo = light === false && video !== null
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timeRef = useRef(cues[0]?.time ?? 0)
  const loopLength = (cues.at(-1)?.time ?? 0) + LOOP_TAIL_SECONDS

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
    if (light === null || playVideo || paused) return
    const id = setInterval(() => {
      timeRef.current = (timeRef.current + TICK_SECONDS) % loopLength
      setActive(indexAt(timeRef.current))
    }, TICK_SECONDS * 1000)
    return () => clearInterval(id)
  }, [light, playVideo, paused, loopLength, indexAt])

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

  const visible =
    active < 0
      ? []
      : cues.slice(Math.max(0, active - VISIBLE_NOTIFICATIONS + 1), active + 1).reverse()

  return (
    <>
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
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
            {video.webm ? <source src={video.webm} type="video/webm" /> : null}
            <source src={video.mp4} type="video/mp4" />
          </video>
        ) : null}
        <div
          className={`absolute inset-0 ${
            playVideo
              ? 'bg-gradient-to-r from-night-950/95 via-night-900/80 to-teal-600/40'
              : 'bg-[radial-gradient(55%_50%_at_78%_35%,rgb(28_93_112/0.6),transparent_70%),radial-gradient(40%_40%_at_12%_90%,rgb(231_171_52/0.16),transparent_70%)]'
          }`}
        />
        <svg className="absolute inset-0 size-full text-white/[0.04] [mask-image:radial-gradient(70%_60%_at_70%_40%,black,transparent)]">
          <defs>
            <pattern id="hero-hex" width="56" height="48" patternUnits="userSpaceOnUse">
              <path d="M14 0h28l14 24-14 24H14L0 24z" fill="none" stroke="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-hex)" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-night-900 to-transparent" />
      </div>

      <div className="container-site grid min-h-dvh items-center gap-14 pt-28 pb-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:pt-24">
        <div>{children}</div>

        <div aria-hidden className="relative flex justify-center lg:justify-end">
          <div className="absolute top-1/2 left-1/2 size-80 -translate-1/2 rounded-full bg-teal-500/30 blur-3xl lg:left-auto lg:-right-6 lg:translate-x-0" />
          <div className="[perspective:1600px]">
            <div className="motion-safe:animate-float">
              <div className="transition-transform duration-700 ease-out-expo lg:[transform:rotateY(-14deg)_rotateX(5deg)]">
                <Phone
                  overlay={
                    <ol
                      className={`-mx-2.5 space-y-2 px-2.5 pb-4 ${
                        visible.length
                          ? 'bg-gradient-to-b from-mist-50 from-85% to-transparent'
                          : ''
                      }`}
                    >
                      {visible.map((cue, index) => (
                        <li
                          key={cue.key}
                          className={`flex animate-notification-in items-start gap-2.5 rounded-2xl bg-white p-2.5 shadow-lg ring-1 ring-black/5 transition-transform duration-500 ${
                            index > 0 ? 'scale-[0.96]' : ''
                          }`}
                        >
                          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-night-900 text-gold-300">
                            {cue.icon}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-2 text-[9px] text-slate-500">
                              <span className="font-semibold tracking-wide uppercase">
                                {labels.app}
                              </span>
                              {labels.now}
                            </span>
                            <span className="block text-[11px] leading-tight font-semibold text-ink">
                              {cue.title}
                            </span>
                            <span className="block text-[10px] leading-snug text-slate-500">
                              {cue.body}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  }
                >
                  {screen}
                </Phone>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WCAG 2.2.2: anything that moves automatically for more than 5 s needs a pause control. */}
      <button
        type="button"
        onClick={() => setPaused((value) => !value)}
        aria-label={paused ? labels.play : labels.pause}
        className="absolute right-4 bottom-5 grid size-11 place-items-center rounded-full border border-white/15 bg-night-900/60 text-white/80 backdrop-blur transition-colors hover:text-white md:right-8"
      >
        {paused ? (
          <Play aria-hidden className="size-4" />
        ) : (
          <Pause aria-hidden className="size-4" />
        )}
      </button>
    </>
  )
}
