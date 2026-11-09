import { openEvent, storedConsent, track } from '@/lib/analytics'

// Loaded after the page's load event by `Analytics` (ADR-036). Plain code, no React:
// 1. one delegated listener turns clicks, <details> toggles, popovers and video plays into the
//    FR-ANA-02 events, so server-rendered links need no client code of their own;
// 2. campaign tags (utm_*) of the landing URL ride along on store links (FR-ANA-03);
// 3. GA4 (./ga.ts) is fetched only for a visitor who has accepted analytics (FR-ANA-01).

const utmKey = 'hm-utm'

// ---------------------------------------------------------------------------------------------
// Campaign tags

function campaign(): URLSearchParams | null {
  const tags = [...new URLSearchParams(location.search)].filter(([key]) => key.startsWith('utm_'))
  try {
    if (tags.length) sessionStorage.setItem(utmKey, new URLSearchParams(tags).toString())
    const saved = sessionStorage.getItem(utmKey)
    return saved ? new URLSearchParams(saved) : null
  } catch {
    return tags.length ? new URLSearchParams(tags) : null
  }
}

// Play reads the install `referrer`; the App Store a campaign token `ct` (40 characters max);
// /download forwards the tags itself (src/app/download/route.ts).
function tagLink(link: HTMLAnchorElement, url: URL, kind: 'play' | 'appstore' | 'download') {
  const tags = campaign()
  if (!tags) return
  if (kind === 'play') url.searchParams.set('referrer', tags.toString())
  if (kind === 'appstore') {
    const token = tags.get('utm_campaign') || tags.get('utm_source')
    if (token) url.searchParams.set('ct', token.slice(0, 40))
  }
  if (kind === 'download') tags.forEach((value, key) => url.searchParams.set(key, value))
  link.href = url.toString()
}

// ---------------------------------------------------------------------------------------------
// Events

function placementOf(element: Element): string {
  const marked = element.closest<HTMLElement>('[data-placement]')
  if (marked?.dataset.placement) return marked.dataset.placement
  if (element.closest('[popover]')) return 'qr_popover'
  if (element.closest('header')) return 'header'
  if (element.closest('footer')) return 'footer'
  const section = element.closest('section')
  return (
    section?.id ||
    section?.getAttribute('aria-labelledby')?.replace(/-(title|heading)$/, '') ||
    location.pathname.split('/')[2] ||
    'home'
  )
}

function onClick(webAppHost: string | null, event: MouseEvent) {
  if (!(event.target instanceof Element)) return
  const element = event.target.closest<HTMLElement>('a[href], button')
  if (!element) return

  if (element.matches('[data-consent-open]')) {
    window.dispatchEvent(new Event(openEvent))
    return
  }
  if (element.dataset.track === 'lang_switch') {
    if (element.getAttribute('aria-pressed') !== 'true') {
      track('lang_switch', {
        from: document.documentElement.lang,
        to: element.dataset.trackTo ?? '',
      })
    }
    return
  }
  if (!(element instanceof HTMLAnchorElement)) return

  let url: URL
  try {
    url = new URL(element.href)
  } catch {
    return
  }
  const placement = placementOf(element)
  if (url.hostname === 'play.google.com') {
    tagLink(element, url, 'play')
    track('store_click', { store: 'play', placement })
  } else if (url.hostname === 'apps.apple.com') {
    tagLink(element, url, 'appstore')
    track('store_click', { store: 'appstore', placement })
  } else if (url.origin === location.origin && url.pathname === '/download') {
    tagLink(element, url, 'download')
    track('store_click', { store: 'auto', placement })
  } else if (url.protocol === 'tel:') {
    track('call_click', { placement })
  } else if (/(^|\.)(wa\.me|whatsapp\.com)$/.test(url.hostname)) {
    track('whatsapp_click', { placement })
  } else if (webAppHost && url.hostname === webAppHost) {
    track('webapp_click', { placement })
  }
}

// `toggle` and `play` don't bubble, so these listen in the capture phase.
function onToggle(event: Event) {
  const target = event.target
  if (target instanceof HTMLDetailsElement && target.open && target.matches('[data-track-faq]')) {
    const question = target.querySelector('summary')?.textContent?.trim() ?? ''
    track('faq_open', { question: question.slice(0, 100) })
  } else if (
    target instanceof HTMLElement &&
    target.dataset.trackView === 'qr_view' &&
    (event as ToggleEvent).newState === 'open'
  ) {
    track('qr_view', {
      placement: placementOf(target.closest('section, header, footer') ?? target),
    })
  }
}

function onPlay(event: Event) {
  const target = event.target
  if (target instanceof HTMLVideoElement && target.dataset.trackPlay) {
    track('video_play', { video: target.dataset.trackPlay })
  }
}

type Options = {
  gaId: string | null
  webAppUrl: string
  // Mounts the consent banner (React, its own chunk); `reopen` when asked from the footer.
  showBanner: (reopen: boolean) => void
}

export function startAnalytics({ gaId, webAppUrl, showBanner }: Options) {
  let webAppHost: string | null = null
  try {
    webAppHost = new URL(webAppUrl).hostname
  } catch {
    // A malformed CMS value only disables webapp_click.
  }
  // Remember the landing page's tags before client navigation drops the query.
  campaign()
  const consent = storedConsent()
  if (gaId && consent === 'granted') void import('./ga').then(({ loadGa }) => loadGa(gaId))
  if (consent === 'denied') window.hmEvents = []
  // No analytics configured: nothing to consent to, so no banner.
  const reopen = () => showBanner(true)
  if (gaId) {
    window.addEventListener(openEvent, reopen)
    if (consent === null) showBanner(false)
  }

  const click = (event: MouseEvent) => onClick(webAppHost, event)
  document.addEventListener('click', click, true)
  document.addEventListener('auxclick', click, true)
  document.addEventListener('toggle', onToggle, true)
  document.addEventListener('play', onPlay, true)
  return () => {
    document.removeEventListener('click', click, true)
    document.removeEventListener('auxclick', click, true)
    document.removeEventListener('toggle', onToggle, true)
    document.removeEventListener('play', onPlay, true)
    window.removeEventListener(openEvent, reopen)
  }
}
