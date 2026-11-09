'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type ComponentType } from 'react'

import type { BannerProps } from '@/components/consent/ConsentBanner'

type Props = {
  // Server render time of this page (live refresh, ADR-033).
  renderedAt: number
  // Analytics and consent (FR-ANA-01..03, ADR-036).
  gaId: string | null
  webAppUrl: string
  labels: BannerProps['labels']
}

type Banner = { Component: ComponentType<BannerProps>; reopen: boolean }

/**
 * Everything that waits for the page's load event, behind one small shell: it is the only part in
 * the first load (home JS budget, NFR-PERF-02) and imports nothing else up front.
 * - Live refresh (ADR-033): the watcher brings CMS edits into open pages. Nothing is missed while
 *   it loads: the page carries its render time, and any save after it counts. `router.refresh()`
 *   re-renders the server data in place, keeping scroll and form input.
 * - Analytics (ADR-036): the event runtime (plain listeners, no React) asks for the consent banner
 *   only when it has to show (analytics configured and no choice saved yet, or "Cookie settings"
 *   clicked). Events fired meanwhile wait in the queue (src/lib/analytics.ts).
 */
export function AfterLoad({ renderedAt, gaId, webAppUrl, labels }: Props) {
  const router = useRouter()
  const [banner, setBanner] = useState<Banner | null>(null)

  useEffect(() => {
    const stops: (() => void)[] = []
    let cancelled = false
    const showBanner = (reopen: boolean) =>
      import('@/components/consent/ConsentBanner').then(({ ConsentBanner }) => {
        if (!cancelled) setBanner({ Component: ConsentBanner, reopen })
      })
    const start = () => {
      import('./liveRefreshWatch').then(({ watchContentVersion }) => {
        if (!cancelled) stops.push(watchContentVersion(renderedAt, () => router.refresh()))
      })
      import('@/components/consent/runtime').then(({ startAnalytics }) => {
        if (!cancelled) stops.push(startAnalytics({ gaId, webAppUrl, showBanner }))
      })
    }
    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })
    return () => {
      cancelled = true
      window.removeEventListener('load', start)
      stops.forEach((stop) => stop())
    }
  }, [router, renderedAt, gaId, webAppUrl])

  if (!banner || !gaId) return null
  const { Component, reopen } = banner
  // A new key per reopening remounts the banner opened, whatever its last state.
  return <Component key={String(reopen)} gaId={gaId} labels={labels} reopen={reopen} />
}
