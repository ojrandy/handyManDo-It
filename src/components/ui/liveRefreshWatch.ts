// Loaded by AfterLoad after the page's load event, so none of this is first-load JS. Asks the
// server for the time of the last CMS save when the tab or window comes back into view and every
// 30 s while visible; when that save is newer than what the page shows, `refresh()` re-renders
// the page's server data in place. Hidden tabs never poll.
export function watchContentVersion(renderedAt: number, refresh: () => void): () => void {
  // Saves up to this time are on screen: the page's render, or the last refresh. A save that
  // didn't touch this page leaves its render time behind, so the refresh moves this on instead.
  let seen = renderedAt
  const check = async () => {
    if (document.hidden) return
    try {
      const res = await fetch('/api/content-version', { cache: 'no-store' })
      const { v } = (await res.json()) as { v: number }
      if (v > seen) {
        seen = v
        refresh()
      }
    } catch {
      // Offline or server restarting: try again on the next tick.
    }
  }

  check()
  const timer = setInterval(check, 30_000)
  // Tab switch, or a click back into the site from an admin window beside it.
  document.addEventListener('visibilitychange', check)
  window.addEventListener('focus', check)
  return () => {
    clearInterval(timer)
    document.removeEventListener('visibilitychange', check)
    window.removeEventListener('focus', check)
  }
}
