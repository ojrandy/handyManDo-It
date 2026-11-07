'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import type { HeroVideoSource } from '@/lib/hero'
import { useSlowData } from '@/lib/useLightData'

type Props = {
  sources: HeroVideoSource[]
  poster: string
  // The hero's pause button (WCAG 2.2.2).
  paused: boolean
  onDone: () => void
}

// Without video the brand screen still shows briefly, like an app's launch screen.
const POSTER_MS = 1500
// Give up and show the app rather than leave a visitor on a stalled video.
const STALL_MS = 2500
// Last resort if a browser never reports the clip's end: no visitor stays on a frozen last frame.
const MAX_PLAY_MS = 8000
const SEEN_KEY = 'hero-splash-seen'

function seenThisSession(): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function rememberSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, '1')
  } catch {
    // Private mode: the intro just plays again on the next visit.
  }
}

/**
 * The app's launch screen in the hero phone (ADR-028): the poster is in the server HTML, so Home
 * never flashes first; the intro starts once the phone is well in view and then fades to Home.
 * Slow connections and Save-Data keep the poster, reduced motion skips straight to Home, and any
 * playback failure ends the intro rather than blocking the phone.
 */
export function PhoneSplash({ sources, poster, paused, onDone }: Props) {
  const slow = useSlowData()
  const rootRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [inView, setInView] = useState(false)
  const [started, setStarted] = useState(false)
  const [shown, setShown] = useState(false)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  const finish = useRef(() => {})
  useEffect(() => {
    finish.current = () => {
      rememberSeen()
      setDone(true)
      onDone()
    }
  }, [onDone])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || seenThisSession()) {
      finish.current()
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root || done) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
        if (entry.isIntersecting) setStarted(true)
      },
      // Under the CTAs on a 390 × 844 phone, 47 % of it is on the first screen.
      { threshold: 0.4 },
    )
    observer.observe(root)
    return () => observer.disconnect()
  }, [done])

  // Poster only.
  useEffect(() => {
    if (slow !== true || !started || paused || done) return
    const id = setTimeout(() => finish.current(), POSTER_MS)
    return () => clearTimeout(id)
  }, [slow, started, paused, done])

  const playVideo = slow === false && started

  useEffect(() => {
    const element = videoRef.current
    if (!element || done) return
    if (!inView || paused) {
      element.pause()
      return
    }
    element.play().catch((error: unknown) => {
      // AbortError only means our own pause() interrupted this play().
      if (!(error instanceof DOMException && error.name === 'AbortError')) finish.current()
    })
  }, [playVideo, inView, paused, done])

  // Not started in time, or stalled partway through.
  useEffect(() => {
    if (!playVideo || running || !inView || paused || done) return
    const id = setTimeout(() => finish.current(), STALL_MS)
    return () => clearTimeout(id)
  }, [playVideo, running, inView, paused, done])

  useEffect(() => {
    if (!running || !inView || paused || done) return
    const id = setTimeout(() => finish.current(), MAX_PLAY_MS)
    return () => clearTimeout(id)
  }, [running, inView, paused, done])

  return (
    <div
      ref={rootRef}
      data-phone-splash={done ? 'done' : 'on'}
      className={`absolute inset-0 z-10 bg-night-900 transition-opacity duration-500 ease-out motion-reduce:hidden [@media(scripting:none)]:hidden ${
        done ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <Image
        src={poster}
        alt=""
        fill
        unoptimized
        preload
        fetchPriority="high"
        className="object-cover"
      />
      {playVideo ? (
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          onPlaying={() => {
            setShown(true)
            setRunning(true)
          }}
          onWaiting={() => setRunning(false)}
          onEnded={() => finish.current()}
          onError={() => finish.current()}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-200 ${
            shown ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {sources.map(({ src, type }, index) => (
            <source
              key={src}
              src={src}
              type={type}
              // A failed <source> never reaches the <video>'s error event: only the last one
              // failing means nothing can play.
              onError={index === sources.length - 1 ? () => finish.current() : undefined}
            />
          ))}
        </video>
      ) : null}
    </div>
  )
}
