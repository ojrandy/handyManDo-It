'use client'

import { useEffect, useRef } from 'react'

type Props = {
  value: number
  suffix?: string
  durationMs?: number
}

// Counts up when scrolled into view. The final value is server-rendered, so screen readers,
// no-JS visitors and reduced-motion users always get the real number (FR-HOME-06). The
// animation writes to the DOM directly instead of re-rendering React on every frame.
export function Counter({ value, suffix = '+', durationMs = 1400 }: Props) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    let started = false
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          // Still below the fold: start from zero so the count-up is visible later.
          if (!started) element.textContent = `0${suffix}`
          return
        }
        if (started) return
        started = true
        observer.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const progress = Math.min((now - start) / durationMs, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          element.textContent = `${Math.round(value * eased)}${suffix}`
          if (progress < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )
    observer.observe(element)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [value, suffix, durationMs])

  // One text node ("120+"), so the server HTML and screen readers get it unsplit.
  const label = `${value}${suffix}`
  return (
    <>
      <span ref={ref} aria-hidden className="tabular-nums">
        {label}
      </span>
      <span className="sr-only">{label}</span>
    </>
  )
}
