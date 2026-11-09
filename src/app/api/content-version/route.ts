import { getContentVersion } from '@/lib/contentVersion'

// Polled by open pages (AfterLoad) to learn that the CMS changed. No DB work, so it stays cheap
// at one request per visible tab every 30 s. Never cached, by Next or by Cloudflare.
export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json(
    { v: getContentVersion() },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  )
}
