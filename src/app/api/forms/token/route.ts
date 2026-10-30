import { issueToken } from '@/lib/forms/guard'

// Form pages are pre-rendered, so the time-to-submit token is fetched when a form mounts
// (FR-FORM-03). Never cached: the token carries the time it was issued.
export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json({ token: issueToken() }, { headers: { 'Cache-Control': 'no-store' } })
}
