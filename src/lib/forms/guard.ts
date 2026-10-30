import { createHmac, timingSafeEqual } from 'node:crypto'

// Server only. Spam checks of the form intake (FR-FORM-03, ADR-023): a signed time-to-submit token and a
// per-IP rate limit. In memory, per process: enough at this scale on one Hostinger app (no Redis).

// A person needs more than 3 s to fill a form; a token older than 6 h belongs to a stale tab.
export const minFillMs = 3_000
const maxAgeMs = 6 * 60 * 60 * 1000

const secret = () => {
  const value = process.env.PAYLOAD_SECRET
  if (!value) throw new Error('PAYLOAD_SECRET is not set')
  return value
}

const sign = (issuedAt: string) =>
  createHmac('sha256', secret()).update(`form-token:${issuedAt}`).digest('base64url')

export const issueToken = (now = Date.now()) => `${now}.${sign(String(now))}`

export type TokenCheck = 'ok' | 'invalid' | 'tooFast' | 'expired'

export function checkToken(token: string, now = Date.now()): TokenCheck {
  const [issuedAt, signature] = token.split('.')
  if (!issuedAt || !signature || !/^\d+$/.test(issuedAt)) return 'invalid'
  const expected = Buffer.from(sign(issuedAt))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return 'invalid'
  const age = now - Number(issuedAt)
  if (age < minFillMs) return 'tooFast'
  if (age > maxAgeMs) return 'expired'
  return 'ok'
}

const windowMs = 10 * 60 * 1000
export const maxPerWindow = 5
const hits = new Map<string, number[]>()

// True when this IP may submit again. Old entries are dropped as they are met, and the map is
// cleared if it ever grows large (a flood of spoofed IPs must not grow memory without bound).
// Without a known address there is nothing to count on: the token check still applies.
export function allowSubmission(ip: string | null, now = Date.now()): boolean {
  if (!ip) return true
  if (hits.size > 10_000) hits.clear()
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < windowMs)
  if (recent.length >= maxPerWindow) {
    hits.set(ip, recent)
    return false
  }
  recent.push(now)
  hits.set(ip, recent)
  return true
}

// Behind Cloudflare the visitor's address is in CF-Connecting-IP; elsewhere the first
// X-Forwarded-For entry. Null without either (local runs, tests), rather than one shared bucket
// that would block every visitor at once.
export function clientIp(headers: Headers): string | null {
  return (
    headers.get('cf-connecting-ip')?.trim() ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    null
  )
}
