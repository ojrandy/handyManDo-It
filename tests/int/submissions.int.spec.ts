import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'

let payload: Payload
const prefix = 'int-test-sub'
const editor = { id: 0, roles: ['editor'], collection: 'users', email: 'e@x.test' } as const

// Smallest buffer Payload accepts as a PDF: header, then xref and %%EOF near the end.
const pdf = (padding = 64) => {
  const data = Buffer.concat([
    Buffer.from('%PDF-1.4\n'),
    Buffer.alloc(padding, 0x20),
    Buffer.from('\nxref\n0 1\ntrailer\n<<>>\nstartxref\n0\n%%EOF\n'),
  ])
  return { data, mimetype: 'application/pdf', name: `${prefix} CV.pdf`, size: data.length }
}

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

const submission = (extra: object = {}) => ({
  type: 'contact' as const,
  name: `${prefix} Visitor`,
  email: 'visitor@example.test',
  locale: 'fr' as const,
  status: 'new' as const,
  ...extra,
})

const cleanUp = () =>
  payload.delete({ collection: 'submissions', where: { name: { like: prefix } } })

describe('submissions and private files', () => {
  beforeAll(async () => {
    payload = await getPayload({ config })
    await cleanUp()
  })

  afterAll(cleanUp)

  it('is closed to anonymous visitors', async () => {
    await expect(
      payload.create({ collection: 'submissions', data: submission(), overrideAccess: false }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      payload.find({ collection: 'submissions', overrideAccess: false }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      payload.find({ collection: 'files', overrideAccess: false }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('emails the site inbox on create', async () => {
    const sendEmail = vi.spyOn(payload, 'sendEmail')
    await payload.create({ collection: 'submissions', data: submission({ city: 'Buea' }) })
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: `[handymandoit.com] contact: ${prefix} Visitor` }),
    )
    sendEmail.mockRestore()
  })

  it('lets editors change the status but not what the visitor sent', async () => {
    const doc = await payload.create({ collection: 'submissions', data: submission() })
    const updated = await payload.update({
      collection: 'submissions',
      id: doc.id,
      data: { status: 'done', name: 'Tampered' },
      overrideAccess: false,
      user: editor,
    })
    expect(updated.status).toBe('done')
    expect(updated.name).toBe(`${prefix} Visitor`)
  })

  it('renames uploads and rejects large or non-document files', async () => {
    const file = await payload.create({ collection: 'files', data: {}, file: pdf() })
    expect(file.filename).toMatch(/^[0-9a-f-]{36}\.pdf$/)
    await payload.delete({ collection: 'files', id: file.id })

    await expect(
      payload.create({ collection: 'files', data: {}, file: pdf(5 * 1024 * 1024) }),
    ).rejects.toThrow(/5 MB/)
    await expect(
      payload.create({
        collection: 'files',
        data: {},
        // Payload sniffs the bytes, so this must be a real PNG (1×1, transparent).
        file: {
          data: png,
          mimetype: 'image/png',
          name: 'x.png',
          size: png.length,
        },
      }),
    ).rejects.toThrow()
  })

  it('purges entries older than 24 months with their attachment', async () => {
    const file = await payload.create({ collection: 'files', data: {}, file: pdf() })
    const old = await payload.create({
      collection: 'submissions',
      data: submission({ type: 'job', attachment: file.id, createdAt: '2020-01-01T00:00:00.000Z' }),
    })
    expect(old.createdAt).toBe('2020-01-01T00:00:00.000Z')

    // Any new submission triggers the purge.
    await payload.create({ collection: 'submissions', data: submission() })

    const left = await payload.find({
      collection: 'submissions',
      where: { id: { equals: old.id } },
    })
    expect(left.docs).toHaveLength(0)
    const files = await payload.find({ collection: 'files', where: { id: { equals: file.id } } })
    expect(files.docs).toHaveLength(0)
  })
})
