// Conversion events (docs/PLAN.md §10). Events queue on `window.dataLayer`; GA4 with Consent
// Mode (Phase 5) reads the queue once loaded, so nothing leaves the browser before consent.

type EventParams = Record<string, string | number | boolean>

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

export function track(event: string, params: EventParams = {}) {
  if (typeof window === 'undefined') return
  window.dataLayer ??= []
  window.dataLayer.push({ event, ...params })
}
