import {
  createLocalReq,
  executeAccess,
  getPayload,
  type Access,
  type AccessResult,
  type Payload,
} from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { site } from '@/lib/site'
import type { User } from '@/payload-types'

let payload: Payload

// Access-control matrix (QA-AUTO-08, T-1.12). Each cell is the verdict for
// [anonymous, editor, admin]: `Y` allowed, `N` denied, `Q` allowed through a query
// (only published docs, only your own account).
const Y = 'yes'
const N = 'no'
const Q = 'query'
type Verdict = typeof Y | typeof N | typeof Q
type Cell = readonly [anonymous: Verdict, editor: Verdict, admin: Verdict]
type Matrix = Record<string, Partial<Record<string, Cell>>>

const publicContent = {
  create: [N, Y, Y],
  read: [Y, Y, Y],
  update: [N, Y, Y],
  delete: [N, Y, Y],
} as const satisfies Record<string, Cell>

const draftContent = {
  ...publicContent,
  read: [Q, Y, Y],
  readVersions: [N, Y, Y],
} as const satisfies Record<string, Cell>

const collections: Matrix = {
  users: {
    create: [N, N, Y],
    read: [N, Q, Y],
    update: [N, Q, Y],
    delete: [N, N, Y],
    unlock: [N, N, Y],
  },
  media: publicContent,
  services: draftContent,
  projects: draftContent,
  posts: draftContent,
  testimonials: publicContent,
  faqs: publicContent,
  categories: publicContent,
  team: publicContent,
  partners: publicContent,
  'app-screens': publicContent,
  jobs: publicContent,
  redirects: publicContent,
  // Entries only come from the form route handler (Local API, overrideAccess).
  submissions: { create: [N, N, N], read: [N, Y, Y], update: [N, Y, Y], delete: [N, N, Y] },
  files: { create: [N, N, N], read: [N, Y, Y], update: [N, N, N], delete: [N, N, Y] },
}

const globals: Matrix = {
  site: { read: [Y, Y, Y], update: [N, N, Y] },
  seo: { read: [Y, Y, Y], update: [N, N, Y] },
  navigation: { read: [Y, Y, Y], update: [N, Y, Y] },
  home: { read: [Q, Y, Y], update: [N, Y, Y], readVersions: [N, Y, Y] },
}

// Payload's own collections. They are not in the matrix, but must stay closed to the public.
const internal = [
  'payload-kv',
  'payload-locked-documents',
  'payload-preferences',
  'payload-migrations',
]

const roles = [
  ['anonymous', null],
  ['editor', { id: -1, roles: ['editor'], collection: 'users', email: 'editor@x.test' }],
  ['admin', { id: -2, roles: ['admin'], collection: 'users', email: 'admin@x.test' }],
] as const

// executeAccess applies Payload's fallback for operations a config leaves out (signed-in only).
async function verdict(access: Access | undefined, user: (typeof roles)[number][1]) {
  const req = await createLocalReq({ user: (user ?? undefined) as User | undefined }, payload)
  const result: AccessResult = await executeAccess({ req, disableErrors: true }, access as Access)
  return result === true ? Y : result ? Q : N
}

type Entity = { slug: string; access: Record<string, Access | undefined> }

function operations(kind: 'collection' | 'global', slug: string): string[] {
  if (kind === 'global') {
    const global = payload.config.globals.find((entry) => entry.slug === slug)
    return ['read', 'update', ...(global?.versions ? ['readVersions'] : [])]
  }
  const collection = payload.collections[slug as keyof typeof payload.collections].config
  return [
    'create',
    'read',
    'update',
    'delete',
    ...(collection.versions ? ['readVersions'] : []),
    ...(collection.auth && collection.auth.maxLoginAttempts ? ['unlock'] : []),
  ]
}

async function check(kind: 'collection' | 'global', entity: Entity, expected: Matrix[string]) {
  // Every operation Payload checks for this entity has a declared expectation, and nothing else.
  expect(Object.keys(expected).sort()).toEqual(operations(kind, entity.slug).sort())
  const actual: Record<string, Verdict[]> = {}
  for (const operation of Object.keys(expected)) {
    actual[operation] = await Promise.all(
      roles.map(([, user]) => verdict(entity.access[operation], user)),
    )
  }
  expect(actual).toEqual(expected)
}

beforeAll(async () => {
  payload = await getPayload({ config })
})

describe('access matrix', () => {
  it('covers every collection and global in the config', () => {
    const configured = payload.config.collections
      .map(({ slug }) => slug)
      .filter((slug) => !internal.includes(slug))
    expect(configured.sort()).toEqual(Object.keys(collections).sort())
    expect(payload.config.globals.map(({ slug }) => slug).sort()).toEqual(
      Object.keys(globals).sort(),
    )
  })

  it.each(Object.entries(collections))('collection %s', async (slug, expected) => {
    const entity = payload.collections[slug as keyof typeof payload.collections].config
    await check('collection', entity as unknown as Entity, expected)
  })

  it.each(Object.entries(globals))('global %s', async (slug, expected) => {
    const entity = payload.config.globals.find((global) => global.slug === slug)
    await check('global', entity as unknown as Entity, expected)
  })

  it.each(internal)('%s is closed to anonymous visitors', async (slug) => {
    const { access } = payload.collections[slug as keyof typeof payload.collections].config
    for (const operation of ['create', 'read', 'update', 'delete'] as const) {
      expect(await verdict(access[operation], null)).toBe(N)
    }
  })
})

// The matrix checks the rules; these run real operations so the rules are known to be enforced.
describe('anonymous access', () => {
  it('can read the site global, seeded from lib/site defaults', async () => {
    const global = await payload.findGlobal({ slug: 'site', overrideAccess: false })
    expect(global.webAppUrl).toBe(site.webAppUrl)
  })

  it('cannot read users', async () => {
    await expect(
      payload.find({ collection: 'users', overrideAccess: false }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('cannot update the site global', async () => {
    await expect(
      payload.updateGlobal({ slug: 'site', data: { phone: '+000' }, overrideAccess: false }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it.each(['team', 'partners'] as const)('cannot write %s', async (collection) => {
    await expect(
      payload.create({
        collection,
        data: { name: 'x', role: 'x', logo: 1 },
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('cannot create media', async () => {
    await expect(
      payload.create({ collection: 'media', data: { alt: 'x' }, overrideAccess: false }),
    ).rejects.toMatchObject({ status: 403 })
  })
})

describe('signed-in roles', () => {
  const prefix = 'int-test-access'
  const password = 'int-test-only-password'
  let admin: User
  let editor: User
  let otherEditor: User

  // Local API docs don't always carry `collection`, which access checks and hooks expect.
  const as = (user: User) => ({ ...user, collection: 'users' as const })

  const cleanUp = async () => {
    await payload.delete({ collection: 'users', where: { email: { like: prefix } } })
    await payload.delete({ collection: 'posts', where: { title: { like: prefix } } })
  }

  const newUser = (name: string, userRoles: User['roles']) =>
    payload.create({
      collection: 'users',
      data: { name, email: `${prefix}-${name}@handymandoit.test`, password, roles: userRoles },
    })

  beforeAll(async () => {
    await cleanUp()
    // Admin first: on an empty table the Users hook promotes the first account to admin.
    admin = await newUser('admin', ['admin'])
    editor = await newUser('editor', ['editor'])
    otherEditor = await newUser('other', ['editor'])
    expect(editor.roles).toEqual(['editor'])
  })

  afterAll(cleanUp)

  it('editors only see their own account', async () => {
    const { docs } = await payload.find({
      collection: 'users',
      user: as(editor),
      overrideAccess: false,
    })
    expect(docs.map(({ id }) => id)).toEqual([editor.id])
    await expect(
      payload.findByID({
        collection: 'users',
        id: admin.id,
        user: as(editor),
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 404 })
  })

  it('editors cannot create, edit or delete other accounts', async () => {
    await expect(
      payload.create({
        collection: 'users',
        data: { email: `${prefix}-new@handymandoit.test`, password, roles: ['editor'] },
        user: as(editor),
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      payload.update({
        collection: 'users',
        id: otherEditor.id,
        data: { name: 'changed' },
        user: as(editor),
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      payload.delete({
        collection: 'users',
        id: admin.id,
        user: as(editor),
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('editors can rename themselves but not change their roles', async () => {
    const updated = await payload.update({
      collection: 'users',
      id: editor.id,
      data: { name: 'renamed', roles: ['admin'] },
      user: as(editor),
      overrideAccess: false,
    })
    expect(updated.name).toBe('renamed')
    expect(updated.roles).toEqual(['editor'])
  })

  it('admins manage accounts and roles', async () => {
    const promoted = await payload.update({
      collection: 'users',
      id: otherEditor.id,
      data: { roles: ['admin', 'editor'] },
      user: as(admin),
      overrideAccess: false,
    })
    expect(promoted.roles).toEqual(['admin', 'editor'])
    const created = await payload.create({
      collection: 'users',
      data: { email: `${prefix}-created@handymandoit.test`, password, roles: ['editor'] },
      user: as(admin),
      overrideAccess: false,
    })
    expect(created.roles).toEqual(['editor'])
  })

  it.each(['site', 'seo'] as const)('editors cannot update the %s global', async (slug) => {
    await expect(
      payload.updateGlobal({ slug, data: {}, user: as(editor), overrideAccess: false }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('editors can update the navigation global', async () => {
    await expect(
      payload.updateGlobal({
        slug: 'navigation',
        data: {},
        user: as(editor),
        overrideAccess: false,
      }),
    ).resolves.toBeDefined()
  })

  it('admins can update the site global', async () => {
    const { phone } = await payload.findGlobal({ slug: 'site' })
    const updated = await payload.updateGlobal({
      slug: 'site',
      data: { phone },
      user: as(admin),
      overrideAccess: false,
    })
    expect(updated.phone).toBe(phone)
  })

  it('drafts are visible to editors only', async () => {
    const draft = await payload.create({
      collection: 'posts',
      data: { title: `${prefix} draft` },
      draft: true,
    })
    const where = { id: { equals: draft.id } }
    const publicRead = await payload.find({ collection: 'posts', where, overrideAccess: false })
    expect(publicRead.docs).toHaveLength(0)
    const editorRead = await payload.find({
      collection: 'posts',
      where,
      user: as(editor),
      overrideAccess: false,
    })
    expect(editorRead.docs).toHaveLength(1)
  })

  it('the home global serves its published version to the public, drafts to editors', async () => {
    const published = await payload.findGlobal({ slug: 'home', overrideAccess: false })
    const eyebrow = `${prefix} unpublished`
    await payload.updateGlobal({ slug: 'home', draft: true, data: { hero: { eyebrow } } })
    try {
      const publicDraft = await payload.findGlobal({
        slug: 'home',
        draft: true,
        overrideAccess: false,
      })
      expect(publicDraft.hero?.eyebrow).toBe(published.hero?.eyebrow)
      const editorDraft = await payload.findGlobal({
        slug: 'home',
        draft: true,
        user: as(editor),
        overrideAccess: false,
      })
      expect(editorDraft.hero?.eyebrow).toBe(eyebrow)
    } finally {
      // Leave the latest draft equal to the published content for the other test files.
      await payload.updateGlobal({ slug: 'home', draft: true, data: { hero: published.hero } })
    }
  })
})
