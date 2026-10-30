import { getPathname } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'
import { getGlobal } from '@/lib/payload'
import { siteSettingsFrom } from '@/lib/settings'

// Every request depends on the visitor's device, so nothing is cached.
export const dynamic = 'force-dynamic'

const headers = { 'Cache-Control': 'private, no-store', Vary: 'User-Agent, Accept-Language' }

// The language for the desktop page: the visitor's saved choice (next-intl cookie), else the
// browser's first supported language, else French.
function pickLocale(request: Request): Locale {
  const cookie = request.headers.get('cookie')?.match(/(?:^|;\s*)NEXT_LOCALE=(\w+)/)?.[1]
  if (routing.locales.includes(cookie as Locale)) return cookie as Locale
  const accepted = (request.headers.get('accept-language') ?? '')
    .split(',')
    .map((part) => part.trim().slice(0, 2).toLowerCase())
  return (
    (accepted.find((lang) => routing.locales.includes(lang as Locale)) as Locale) ??
    routing.defaultLocale
  )
}

/**
 * Smart store link (PLAN.md §4, FR-PG-14): Android → Google Play, with the campaign tags as the
 * install `referrer` (FR-ANA-03); iPhone/iPad → App Store once its URL is set, else the web app
 * (Q-3); anything else → the "get the app" page with a QR code. The QR codes on the site point
 * here, so a phone that scans one lands in the right store.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const userAgent = request.headers.get('user-agent') ?? ''
  const settings = siteSettingsFrom(await getGlobal('site', routing.defaultLocale))
  const utm = [...url.searchParams].filter(([key]) => key.startsWith('utm_'))

  let target: string
  if (/android/i.test(userAgent)) {
    const play = new URL(settings.playStoreUrl)
    if (utm.length) play.searchParams.set('referrer', new URLSearchParams(utm).toString())
    target = play.toString()
  } else if (/iphone|ipad|ipod/i.test(userAgent)) {
    target = settings.appStoreUrl || settings.webAppUrl
  } else {
    // Relative, so it never depends on the host name the proxy forwards.
    const query = utm.length ? `?${new URLSearchParams(utm)}` : ''
    target = getPathname({ locale: pickLocale(request), href: '/get-the-app' }) + query
  }
  return new Response(null, { status: 302, headers: { ...headers, Location: target } })
}
