'use client'

import { useSyncExternalStore } from 'react'

// Network Information API: Chromium only; other browsers report no connection info.
type NetworkInformation = EventTarget & {
  saveData?: boolean
  effectiveType?: string
  type?: string
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

function connection(): NetworkInformation | undefined {
  return (navigator as Navigator & { connection?: NetworkInformation }).connection
}

function isLight(): boolean {
  if (window.matchMedia(REDUCED_MOTION).matches) return true
  const c = connection()
  if (!c) return false
  return (
    Boolean(c.saveData) ||
    ['slow-2g', '2g', '3g'].includes(c.effectiveType ?? '') ||
    c.type === 'cellular'
  )
}

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION)
  const c = connection()
  query.addEventListener('change', onChange)
  c?.addEventListener('change', onChange)
  return () => {
    query.removeEventListener('change', onChange)
    c?.removeEventListener('change', onChange)
  }
}

/**
 * Light-data mode (FR-HOME-02): Save-Data, a slow or cellular connection, or reduced motion.
 * Returns null on the server and during hydration, so callers can hold back heavy media until
 * the client has decided.
 */
export function useLightData(): boolean | null {
  return useSyncExternalStore(subscribe, isLight, () => null)
}
