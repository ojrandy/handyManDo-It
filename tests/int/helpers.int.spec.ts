import { revalidateTag } from 'next/cache'
import type { FieldHook, PayloadRequest } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isEditor, publishedOrEditor } from '@/access'
import { slugField, toSlug } from '@/fields/slug'
import { revalidateCollection, revalidateGlobal } from '@/hooks/revalidate'

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))

// Pure unit checks of the shared CMS helpers (no database).

describe('toSlug', () => {
  it('strips accents and punctuation into kebab-case', () => {
    expect(toSlug('Réparations & Installations')).toBe('reparations-installations')
    expect(toSlug('  Design intérieur / extérieur ')).toBe('design-interieur-exterieur')
    expect(toSlug('Électricité 24h/24')).toBe('electricite-24h-24')
  })
})

describe('slugField', () => {
  const field = slugField({ localized: true })
  const hook = (field as { hooks: { beforeValidate: FieldHook[] } }).hooks.beforeValidate[0]
  const run = (args: Partial<Parameters<FieldHook>[0]>) =>
    hook({ ...args } as Parameters<FieldHook>[0])

  it('is unique, required and localized when asked', () => {
    expect(field).toMatchObject({ name: 'slug', unique: true, required: true, localized: true })
  })

  it('fills an empty slug from the title', () => {
    expect(run({ value: '', data: { title: 'Déménagement' } })).toBe('demenagement')
  })

  it('normalises a slug typed by an editor', () => {
    expect(run({ value: 'Mon Slug ', data: { title: 'Other' } })).toBe('mon-slug')
  })

  it('falls back to the stored title on partial updates', () => {
    expect(run({ value: undefined, data: {}, originalDoc: { title: 'Éclairage' } })).toBe(
      'eclairage',
    )
  })
})

const reqFor = (roles?: string[], context: Record<string, unknown> = {}) =>
  ({
    user: roles ? { id: 1, roles } : null,
    context,
    payload: { logger: { error: vi.fn() } },
  }) as unknown as PayloadRequest

describe('access helpers', () => {
  it('lets editors see drafts and restricts the public to published docs', () => {
    expect(publishedOrEditor({ req: reqFor(['editor']) })).toBe(true)
    expect(publishedOrEditor({ req: reqFor() })).toEqual({ _status: { equals: 'published' } })
  })

  it('treats any account without a role as not an editor', () => {
    expect(isEditor({ req: reqFor([]) })).toBe(false)
  })
})

describe('revalidate hooks', () => {
  const { afterChange, afterDelete } = revalidateCollection('services')
  type ChangeArgs = Parameters<(typeof afterChange)[number]>[0]
  const change = (doc: object, previousDoc: object = {}, req = reqFor()) =>
    afterChange[0]({ doc, previousDoc, req } as ChangeArgs)

  beforeEach(() => vi.mocked(revalidateTag).mockClear())

  it('purges the tag when a doc is published or has no drafts', () => {
    change({ _status: 'published' })
    change({ title: 'no drafts' })
    expect(revalidateTag).toHaveBeenCalledTimes(2)
    expect(revalidateTag).toHaveBeenCalledWith('services', { expire: 0 })
  })

  it('ignores draft saves of unpublished docs but not unpublishing', () => {
    change({ _status: 'draft' }, { _status: 'draft' })
    expect(revalidateTag).not.toHaveBeenCalled()
    change({ _status: 'draft' }, { _status: 'published' })
    expect(revalidateTag).toHaveBeenCalledTimes(1)
  })

  it('purges on delete', () => {
    afterDelete[0]({ doc: {}, req: reqFor() } as Parameters<(typeof afterDelete)[number]>[0])
    expect(revalidateTag).toHaveBeenCalledWith('services', { expire: 0 })
  })

  it('does nothing when the caller disables revalidation (seeds)', () => {
    change({ _status: 'published' }, {}, reqFor(undefined, { disableRevalidate: true }))
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('logs instead of failing the save when purging throws', () => {
    vi.mocked(revalidateTag).mockImplementationOnce(() => {
      throw new Error('boom')
    })
    const req = reqFor()
    expect(() => change({ _status: 'published' }, {}, req)).not.toThrow()
    expect(req.payload.logger.error).toHaveBeenCalled()
  })

  it('stays silent outside a Next.js server', () => {
    vi.mocked(revalidateTag).mockImplementationOnce(() => {
      throw new Error('Invariant: static generation store missing in revalidateTag services')
    })
    const req = reqFor()
    change({ _status: 'published' }, {}, req)
    expect(req.payload.logger.error).not.toHaveBeenCalled()
  })

  it('works for globals too', () => {
    const [hook] = revalidateGlobal('site')
    hook({ doc: {}, previousDoc: {}, req: reqFor() } as Parameters<typeof hook>[0])
    expect(revalidateTag).toHaveBeenCalledWith('site', { expire: 0 })
  })
})
