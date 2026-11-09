// Conversion events (FR-ANA-02, PLAN.md §10) and the consent state behind them (FR-ANA-01,
// ADR-036). Nothing leaves the browser before the visitor accepts analytics: events wait in a
// small in-memory queue until a choice is made, go to GA4 on accept and are dropped on reject.
// Kept tiny and dependency-free: client islands import it on the home page (JS budget).

export type AnalyticsEvents = {
  store_click: { store: 'play' | 'appstore' | 'auto'; placement: string }
  webapp_click: { placement: string }
  qr_view: { placement: string }
  whatsapp_click: { placement: string }
  call_click: { placement: string }
  quote_submit: { type: 'contact' | 'home' | 'business' | 'partnership' }
  pro_apply: Record<string, never>
  job_apply: Record<string, never>
  lang_switch: { from: string; to: string }
  video_play: { video: string }
  demo_interact: { step: string }
  faq_open: { question: string }
}

export type EventName = keyof AnalyticsEvents

export type Consent = 'granted' | 'denied'

export const consentKey = 'hm-consent'

// Fired by the footer's "Cookie settings" button: reopens the consent banner.
export const openEvent = 'hm:consent-open'

type Queued = [EventName, Record<string, unknown>]

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    hmEvents?: Queued[]
  }
}

export function storedConsent(): Consent | null {
  try {
    const value = localStorage.getItem(consentKey)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

export function track<E extends EventName>(event: E, params: AnalyticsEvents[E]) {
  if (typeof window === 'undefined') return
  const consent = storedConsent()
  if (consent === 'denied') return
  if (consent === 'granted' && window.gtag) {
    window.gtag('event', event, params)
    return
  }
  // Undecided, or GA not loaded yet: keep the last few for when it is.
  const queue = (window.hmEvents ??= [])
  if (queue.length < 30) queue.push([event, params])
}
