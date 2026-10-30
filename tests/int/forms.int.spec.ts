import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { POST } from '@/app/api/forms/[type]/route'
import { allowSubmission, checkToken, issueToken, maxPerWindow, minFillMs } from '@/lib/forms/guard'
import { checkCv, isRequired, validateForm } from '@/lib/forms/schema'
import config from '@/payload.config'

import { paragraph } from '../helpers/richText'

// QA-AUTO-09: form intake (FR-FORM-01..05).
let payload: Payload
const prefix = 'int-test-form'
let ipCounter = 0

// A token issued long enough ago to pass the time-to-submit check.
const oldToken = () => issueToken(Date.now() - minFillMs - 1000)

const pdf = () =>
  new File(
    [
      Buffer.concat([
        Buffer.from('%PDF-1.4\n'),
        Buffer.alloc(64, 0x20),
        Buffer.from('\nxref\n0 1\ntrailer\n<<>>\nstartxref\n0\n%%EOF\n'),
      ]),
    ],
    `${prefix} CV.pdf`,
    { type: 'application/pdf' },
  )

function post(type: string, fields: Record<string, string | File>, ip?: string) {
  const body = new FormData()
  for (const [key, value] of Object.entries(fields)) body.set(key, value)
  // Each request gets its own address unless the test is about the rate limit.
  const headers = new Headers({ 'x-forwarded-for': ip ?? `10.9.0.${++ipCounter}` })
  return POST(
    new Request(`http://localhost/api/forms/${type}`, { method: 'POST', body, headers }),
    {
      params: Promise.resolve({ type }),
    },
  )
}

const contact = (extra: Record<string, string> = {}) => ({
  name: `${prefix} Visitor`,
  email: 'visitor@example.test',
  message: 'Bonjour, une question.',
  consent: 'on',
  locale: 'fr',
  token: oldToken(),
  ...extra,
})

const findMine = () =>
  payload.find({
    collection: 'submissions',
    where: { name: { like: prefix } },
    sort: '-createdAt',
    depth: 0,
  })

const cleanUp = async () => {
  await payload.delete({ collection: 'submissions', where: { name: { like: prefix } } })
  await payload.delete({ collection: 'jobs', where: { location: { equals: prefix } } })
}

describe('form schema (shared by browser and server)', () => {
  it('trims values, so blanks are missing', () => {
    const result = validateForm('contact', { name: '   ', message: 'x', email: 'a@b.cm' })
    expect(result).toMatchObject({ ok: false, errors: { name: 'required', consent: 'consent' } })
  })

  it('asks for an email or a phone on the contact form', () => {
    const result = validateForm('contact', { name: 'A', message: 'x', consent: 'on' })
    expect(result).toMatchObject({ ok: false, errors: { phone: 'contactMethod' } })
    expect(
      validateForm('contact', { name: 'A', message: 'x', consent: 'on', phone: '+237 652 767 674' })
        .ok,
    ).toBe(true)
  })

  it('checks email and phone formats, and marks required fields', () => {
    const result = validateForm('quote-business', {
      name: 'A',
      company: 'B',
      email: 'not-an-email',
      phone: 'abc',
      message: 'x',
      consent: 'on',
    })
    expect(result).toMatchObject({ ok: false, errors: { email: 'email', phone: 'phone' } })
    expect(isRequired('quote-home', 'city')).toBe(true)
    expect(isRequired('quote-home', 'email')).toBe(false)
    expect(isRequired('contact', 'message')).toBe(true)
  })

  it('accepts only PDF or Word CVs up to 5 MB', () => {
    expect(checkCv(null)).toBe('required')
    expect(checkCv({ size: 10, type: 'image/png' })).toBe('fileType')
    expect(checkCv({ size: 6 * 1024 * 1024, type: 'application/pdf' })).toBe('fileSize')
    expect(checkCv({ size: 10, type: 'application/pdf' })).toBeNull()
  })
})

describe('spam guard', () => {
  it('signs the token and rejects early, forged and stale ones', () => {
    const now = Date.now()
    expect(checkToken(issueToken(now - minFillMs - 1), now)).toBe('ok')
    expect(checkToken(issueToken(now - 100), now)).toBe('tooFast')
    expect(checkToken(issueToken(now - 7 * 60 * 60 * 1000), now)).toBe('expired')
    expect(checkToken(`${now - 60_000}.forged`, now)).toBe('invalid')
    expect(checkToken('', now)).toBe('invalid')
  })

  it('limits each address, not everyone', () => {
    const now = Date.now()
    for (let i = 0; i < maxPerWindow; i++) expect(allowSubmission('10.8.0.1', now)).toBe(true)
    expect(allowSubmission('10.8.0.1', now)).toBe(false)
    expect(allowSubmission('10.8.0.2', now)).toBe(true)
    // Ten minutes later the address may send again.
    expect(allowSubmission('10.8.0.1', now + 10 * 60 * 1000 + 1)).toBe(true)
    expect(allowSubmission(null, now)).toBe(true)
  })
})

describe('form intake route', () => {
  beforeAll(async () => {
    payload = await getPayload({ config })
    await cleanUp()
  })

  afterAll(cleanUp)

  it('stores a valid submission with its extra fields and emails the inbox', async () => {
    const sendEmail = vi.spyOn(payload, 'sendEmail')
    const response = await post('quote-business', {
      ...contact(),
      company: 'Solpia',
      phone: '+237 652 767 674',
      service: 'Signage',
      utm: JSON.stringify({ utm_source: 'facebook', other: 'dropped' }),
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })

    const [doc] = (await findMine()).docs
    expect(doc).toMatchObject({
      type: 'quote-business',
      status: 'new',
      email: 'visitor@example.test',
      phone: '+237 652 767 674',
      locale: 'fr',
      details: { company: 'Solpia', service: 'Signage' },
      utm: { utm_source: 'facebook' },
    })
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('company: Solpia') }),
    )
    sendEmail.mockRestore()
  })

  it('returns field errors from the shared schema', async () => {
    const response = await post('contact', contact({ email: 'nope', consent: '' }))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      ok: false,
      errors: { email: 'email', consent: 'consent' },
    })
  })

  it('answers a filled honeypot as success but stores nothing', async () => {
    const before = (await findMine()).totalDocs
    const response = await post('contact', contact({ website: 'http://spam.test' }))
    expect(await response.json()).toEqual({ ok: true })
    expect((await findMine()).totalDocs).toBe(before)
  })

  it('rejects a form sent faster than a person can type', async () => {
    const response = await post('contact', contact({ token: issueToken() }))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ ok: false, error: 'tooFast' })
  })

  it('rate-limits one address after five entries', async () => {
    const ip = '10.7.0.1'
    for (let i = 0; i < maxPerWindow; i++) {
      expect((await post('contact', contact(), ip)).status).toBe(200)
    }
    const response = await post('contact', contact(), ip)
    expect(response.status).toBe(429)
    expect(await response.json()).toEqual({ ok: false, error: 'rateLimit' })
  })

  it('stores a job application with its CV privately and refuses closed roles', async () => {
    const open = await payload.create({
      collection: 'jobs',
      locale: 'fr',
      data: {
        title: `${prefix} Technicien`,
        slug: `${prefix}-technicien`,
        location: prefix,
        type: 'full-time',
        open: true,
        description: paragraph('Technicien polyvalent.'),
      },
    })
    const fields = {
      ...contact({ phone: '+237 652 767 674' }),
      job: String(open.id),
      cv: pdf(),
    }

    expect((await post('job', { ...fields, cv: '' })).status).toBe(400)
    const response = await post('job', fields)
    expect(await response.json()).toEqual({ ok: true })

    const [doc] = (await findMine()).docs
    expect(doc).toMatchObject({ type: 'job', job: open.id })
    const file = await payload.findByID({ collection: 'files', id: doc.attachment as number })
    expect(file.filename).toMatch(/^[0-9a-f-]{36}\.pdf$/)
    // Private: anonymous visitors can't list or read CVs (FR-FORM-04).
    await expect(
      payload.find({ collection: 'files', overrideAccess: false }),
    ).rejects.toMatchObject({ status: 403 })

    await payload.update({ collection: 'jobs', id: open.id, data: { open: false } })
    const closed = await post('job', { ...fields, cv: pdf() })
    expect(await closed.json()).toEqual({ ok: false, error: 'jobClosed' })
  })

  it('404s an unknown form type', async () => {
    expect((await post('newsletter', contact())).status).toBe(404)
  })
})
