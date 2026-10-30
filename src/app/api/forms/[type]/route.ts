import { routing, type Locale } from '@/i18n/routing'
import { allowSubmission, checkToken, clientIp } from '@/lib/forms/guard'
import { checkCv, columnFields, isFormType, validateForm } from '@/lib/forms/schema'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

// Error codes the form understands (forms.errors.*); field errors come from the shared schema.
type FailureCode = 'rateLimit' | 'tooFast' | 'expired' | 'jobClosed' | 'server'

const fail = (status: number, body: { error?: FailureCode; errors?: object }) =>
  Response.json({ ok: false, ...body }, { status })

const text = (data: FormData, key: string) => {
  const value = data.get(key)
  return typeof value === 'string' ? value : ''
}

// Only the campaign keys, short, so a crafted value can't bloat the record.
function readUtm(raw: string): Record<string, string> | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const entries = Object.entries(parsed)
      .filter(([key, value]) => /^utm_[a-z]{1,20}$/.test(key) && typeof value === 'string')
      .map(([key, value]) => [key, (value as string).slice(0, 200)])
    return entries.length ? Object.fromEntries(entries) : null
  } catch {
    return null
  }
}

/**
 * Form intake (FR-FORM-01..05, ADR-023): rate limit → honeypot → time-to-submit token → shared
 * zod schema → CV checks → `submissions` (the collection's hook emails the site inbox).
 * Multipart, so the job form can carry its CV.
 */
export async function POST(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  if (!isFormType(type)) return fail(404, {})

  if (!allowSubmission(clientIp(request.headers))) return fail(429, { error: 'rateLimit' })

  let data: FormData
  try {
    data = await request.formData()
  } catch {
    return fail(400, {})
  }

  // A filled honeypot is a bot: answer as if it worked, so it learns nothing.
  if (text(data, 'website') !== '') return Response.json({ ok: true })

  const token = checkToken(text(data, 'token'))
  if (token === 'tooFast' || token === 'invalid') return fail(400, { error: 'tooFast' })
  if (token === 'expired') return fail(400, { error: 'expired' })

  const values: Record<string, string> = {}
  for (const [key, value] of data.entries()) if (typeof value === 'string') values[key] = value
  const result = validateForm(type, values)
  const errors = result.ok ? {} : { ...result.errors }

  const cv = type === 'job' ? data.get('cv') : null
  if (type === 'job') {
    const problem = checkCv(cv instanceof File ? cv : null)
    if (problem) errors.cv = problem
  }
  if (!result.ok || Object.keys(errors).length) return fail(400, { errors })

  const locale: Locale = routing.locales.includes(text(data, 'locale') as Locale)
    ? (text(data, 'locale') as Locale)
    : routing.defaultLocale

  const payload = await getPayloadClient()
  let attachment: number | undefined
  try {
    // A role id is only kept while the role takes applications; without one it is an open
    // application.
    let job: number | undefined
    const jobId = Number(text(data, 'job'))
    if (type === 'job' && Number.isInteger(jobId) && jobId > 0) {
      const role = await payload
        .findByID({ collection: 'jobs', id: jobId, depth: 0 })
        .catch(() => null)
      if (role && !role.open) return fail(400, { error: 'jobClosed' })
      if (role) job = role.id
    }

    if (cv instanceof File) {
      const file = await payload.create({
        collection: 'files',
        data: {},
        file: {
          data: Buffer.from(await cv.arrayBuffer()),
          mimetype: cv.type,
          name: cv.name,
          size: cv.size,
        },
      })
      attachment = file.id
    }

    const fields = result.data as Record<string, string>
    const columns = Object.fromEntries(
      columnFields.map((key) => [key, fields[key] || undefined]),
    ) as Partial<Record<(typeof columnFields)[number], string>>
    const details = Object.fromEntries(
      Object.entries(fields).filter(
        ([key, value]) =>
          value && key !== 'consent' && !(columnFields as readonly string[]).includes(key),
      ),
    )

    await payload.create({
      collection: 'submissions',
      data: {
        type,
        status: 'new',
        ...columns,
        name: fields.name,
        locale,
        job,
        attachment,
        details: Object.keys(details).length ? details : undefined,
        utm: readUtm(text(data, 'utm')) ?? undefined,
      },
    })
    return Response.json({ ok: true })
  } catch (error) {
    payload.logger.error({ err: error, form: type }, 'Form submission failed')
    // A CV whose submission was not saved would never be found or purged.
    if (attachment) await payload.delete({ collection: 'files', id: attachment }).catch(() => {})
    return fail(500, { error: 'server' })
  }
}
