// The time (ms) of the last CMS save that purged the cache (src/hooks/revalidate.ts). Open pages
// compare it with the time they were rendered (`AfterLoad`) and re-fetch their data when the
// save is newer, so an edit shows up without a reload. No database, no worker, no socket: Hostinger
// can't run those (architecture.md §4).
//
// It lives on globalThis because Next bundles each route on its own: the Payload API route that
// runs the hook and /api/content-version would otherwise hold separate copies of this module.
// It starts at 0 after a restart: pages rendered before then are as fresh as the cache they came
// from, which every save purges.

type Store = { contentVersion?: number }
const store = globalThis as typeof globalThis & Store

export function getContentVersion(): number {
  return store.contentVersion ?? 0
}

export function bumpContentVersion(): void {
  store.contentVersion = Math.max(Date.now(), getContentVersion() + 1)
}

// Server render time, stamped into each page for AfterLoad to compare with. Impure on purpose:
// it marks when this render happened, and a server render runs once per cached page.
export function renderedAt(): number {
  return Date.now()
}
