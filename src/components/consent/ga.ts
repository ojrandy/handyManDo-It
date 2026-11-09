import { consentKey, type Consent } from '@/lib/analytics'

// GA4 with Consent Mode v2 (FR-ANA-01, ADR-036). Its own chunk: fetched only when a visitor has
// accepted analytics or the consent banner is on screen, never on a site without a GA ID.

function flushQueue() {
  const queue = window.hmEvents ?? []
  window.hmEvents = []
  for (const [event, params] of queue) window.gtag?.('event', event, params)
}

export function loadGa(gaId: string) {
  if (!window.gtag) {
    window.dataLayer ??= []
    // gtag.js reads `arguments` objects from the data layer, not arrays.
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params -- gtag.js expects the Arguments object
      window.dataLayer!.push(arguments)
    }
    // Consent Mode v2: everything denied by default; analytics granted by this choice only.
    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    })
    window.gtag('consent', 'update', { analytics_storage: 'granted' })
    window.gtag('js', new Date())
    window.gtag('config', gaId)
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`
    document.head.append(script)
  } else {
    window.gtag('consent', 'update', { analytics_storage: 'granted' })
  }
  flushQueue()
}

// GA4's first-party cookies (_ga, _ga_<id>) on this host and its parent domain.
function deleteGaCookies() {
  const parts = location.hostname.split('.')
  const domains = ['', ...parts.map((_, index) => `.${parts.slice(index).join('.')}`)]
  for (const name of document.cookie.split(/;\s*/).map((pair) => pair.split('=')[0])) {
    if (!/^_ga/.test(name)) continue
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`
    }
  }
}

export function setConsent(choice: Consent, gaId: string) {
  try {
    localStorage.setItem(consentKey, choice)
  } catch {
    // Private mode: the choice holds for this page only.
  }
  if (choice === 'granted') {
    loadGa(gaId)
    return
  }
  window.hmEvents = []
  if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied' })
  deleteGaCookies()
}
