import { existsSync, statSync } from 'node:fs'
import path from 'node:path'

import sharp from 'sharp'

import type { CollectionSlug, Payload, RequiredDataFromCollectionSlug, Where } from 'payload'

import type { ServiceKey } from '@/lib/service-keys'

import {
  faqAnswer,
  faqSeeds,
  filmMedia,
  homeData,
  type Localized,
  type MediaSeed,
  navigationData,
  partnerSeeds,
  serviceSeeds,
  siteData,
  teamSeeds,
  testimonialSeeds,
} from './data'

export type Counts = { created: number; updated: number; skipped: number; failed: number }

export const steps = [
  'media',
  'services',
  'testimonials',
  'team',
  'partners',
  'faqs',
  'site',
  'navigation',
  'home',
] as const

export type Step = (typeof steps)[number]
export type Summary = Record<Step, Counts>

export type SeedOptions = {
  // Overwrite seeded fields on records that already exist. Off by default so a re-run never
  // undoes an editor's changes.
  update?: boolean
  // Off in the int tests, which already write these globals from other spec files in parallel.
  globals?: boolean
  publicDir?: string
  log?: (line: string) => void
}

// Seeds write many documents; revalidation hooks skip them (src/hooks/revalidate.ts).
const context = { disableRevalidate: true }

type Outcome = 'created' | 'updated' | 'skipped'

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Width and height of an image file, or null for files sharp cannot read (video).
async function imageSize(file: string): Promise<{ width: number; height: number } | null> {
  try {
    const { width, height } = await sharp(file).metadata()
    return width && height ? { width, height } : null
  } catch {
    return null
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// Arrays that are not localized keep one set of rows for both languages. Writing the second
// language must reuse the rows' ids, or Payload replaces the rows and the first language's
// labels are lost.
export function withRowIds<T>(target: T, source: unknown): T {
  if (Array.isArray(target)) {
    const rows = Array.isArray(source) ? source : []
    return target.map((item, index) => withRowIds(item, rows[index])) as T
  }
  if (isRecord(target) && isRecord(source)) {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(target)) out[key] = withRowIds(value, source[key])
    if (typeof source.id === 'string' && !('id' in target)) out.id = source.id
    return out as T
  }
  return target
}

export async function runSeed(payload: Payload, options: SeedOptions = {}): Promise<Summary> {
  const {
    update = false,
    globals = true,
    publicDir = path.resolve('public'),
    log = console.log,
  } = options
  const summary = Object.fromEntries(
    steps.map((step) => [step, { created: 0, updated: 0, skipped: 0, failed: 0 }]),
  ) as Summary

  const record = (step: Step, outcome: Outcome) => summary[step][outcome]++
  const fail = (step: Step, label: string, error: unknown) => {
    summary[step].failed++
    log(`  ✗ ${step}: ${label}: ${errorMessage(error)}`)
  }

  // --- Media: uploaded once, then found by file name and reused. ------------------------------
  const mediaIds = new Map<string, number | null>()

  async function findMedia(file: string): Promise<number | null> {
    const filename = path.basename(file)
    const exact = await payload.find({
      collection: 'media',
      where: { filename: { equals: filename } },
      limit: 1,
      depth: 0,
    })
    if (exact.docs[0]) return exact.docs[0].id
    // A file already on disk under that name makes Payload store "name-1.webp"; find the renamed
    // copy so a re-run reuses it. Payload re-encodes some images on upload, so images match on
    // their dimensions; other files (video) on their size.
    const source = path.join(publicDir, file)
    const ext = path.extname(filename)
    const stem = filename.slice(0, -ext.length || undefined)
    const renamedName = new RegExp(`^${escapeRegExp(stem)}-\\d+${escapeRegExp(ext)}$`)
    const size = await imageSize(source)
    const renamed = await payload.find({
      collection: 'media',
      where: { filename: { like: `${stem}-` } },
      limit: 50,
      depth: 0,
    })
    const match = renamed.docs.find(
      (doc) =>
        renamedName.test(doc.filename ?? '') &&
        (size
          ? doc.width === size.width && doc.height === size.height
          : doc.filesize === statSync(source).size),
    )
    return match?.id ?? null
  }

  async function media(seed: MediaSeed): Promise<number | null> {
    const cached = mediaIds.get(seed.file)
    if (cached !== undefined) return cached
    let id: number | null = null
    try {
      const filePath = path.join(publicDir, seed.file)
      if (!existsSync(filePath)) throw new Error(`missing file public/${seed.file}`)
      id = await findMedia(seed.file)
      if (id !== null && !update) {
        record('media', 'skipped')
      } else if (id !== null) {
        await payload.update({
          collection: 'media',
          id,
          locale: 'fr',
          data: { alt: seed.alt.fr },
          context,
        })
        await payload.update({
          collection: 'media',
          id,
          locale: 'en',
          data: { alt: seed.alt.en },
          context,
        })
        record('media', 'updated')
      } else {
        const doc = await payload.create({
          collection: 'media',
          locale: 'fr',
          data: { alt: seed.alt.fr },
          filePath,
          context,
        })
        await payload.update({
          collection: 'media',
          id: doc.id,
          locale: 'en',
          data: { alt: seed.alt.en },
          context,
        })
        id = doc.id
        record('media', 'created')
      }
    } catch (error) {
      fail('media', seed.file, error)
    }
    mediaIds.set(seed.file, id)
    return id
  }

  // --- Collections: matched on a stable key, created in fr, then completed in en. -------------
  async function upsert<S extends CollectionSlug & Step>(
    collection: S,
    label: string,
    where: Where,
    build: () => Promise<Localized<RequiredDataFromCollectionSlug<S>>>,
  ): Promise<number | null> {
    try {
      const existing = await payload.find({
        collection,
        where,
        locale: 'fr',
        limit: 1,
        depth: 0,
        // Match drafts too, or a never-published doc would be created twice.
        draft: true,
      })
      const found = existing.docs[0]
      if (found && !update) {
        record(collection, 'skipped')
        return found.id as number
      }
      const data = await build()
      // Payload's update overloads can't be resolved for a generic slug. Full create data is a
      // valid update payload for the same collection, so the widened signature loses nothing.
      const updateById = payload.update.bind(payload) as (args: {
        collection: S
        id: number | string
        locale: 'fr' | 'en'
        data: RequiredDataFromCollectionSlug<S>
        depth: number
        context: typeof context
      }) => Promise<{ id: number | string }>
      const id = found
        ? (
            await updateById({
              collection,
              id: found.id,
              locale: 'fr',
              data: data.fr,
              depth: 0,
              context,
            })
          ).id
        : (await payload.create({ collection, locale: 'fr', data: data.fr, depth: 0, context })).id
      await updateById({ collection, id, locale: 'en', data: data.en, depth: 0, context })
      record(collection, found ? 'updated' : 'created')
      return id as number
    } catch (error) {
      fail(collection, label, error)
      return null
    }
  }

  const required = async (seed: MediaSeed) => {
    const id = await media(seed)
    if (id === null) throw new Error(`required media public/${seed.file} is unavailable`)
    return id
  }

  const serviceIds: Partial<Record<ServiceKey, number>> = {}
  for (const seed of serviceSeeds) {
    const id = await upsert('services', seed.key, { key: { equals: seed.key } }, async () => {
      const heroImage = seed.image ? await media(seed.image) : null
      const shared = {
        key: seed.key,
        icon: seed.icon,
        size: seed.size,
        order: seed.order,
        featuredOnHome: true,
        heroImage,
        _status: 'published' as const,
      }
      return {
        fr: { ...shared, title: seed.title.fr, slug: seed.slug.fr, summary: seed.summary.fr },
        en: { ...shared, title: seed.title.en, slug: seed.slug.en, summary: seed.summary.en },
      }
    })
    if (id !== null) serviceIds[seed.key] = id
  }

  for (const seed of testimonialSeeds) {
    await upsert('testimonials', seed.name, { name: { equals: seed.name } }, async () => {
      const shared = {
        name: seed.name,
        city: seed.city,
        service: serviceIds[seed.service] ?? null,
        order: seed.order,
        featured: true,
        photo: await media(seed.photo),
      }
      return { fr: { ...shared, quote: seed.quote.fr }, en: { ...shared, quote: seed.quote.en } }
    })
  }

  for (const seed of teamSeeds) {
    await upsert('team', seed.name, { name: { equals: seed.name } }, async () => {
      const shared = { name: seed.name, order: seed.order }
      return { fr: { ...shared, role: seed.role.fr }, en: { ...shared, role: seed.role.en } }
    })
  }

  for (const seed of partnerSeeds) {
    const logo = await media(seed.logo)
    if (logo === null) {
      fail('partners', seed.name, new Error('logo unavailable'))
      continue
    }
    await upsert('partners', seed.name, { logo: { equals: logo } }, async () => {
      const data = { name: seed.name, logo: await required(seed.logo), order: seed.order }
      return { fr: data, en: data }
    })
  }

  for (const seed of faqSeeds) {
    await upsert('faqs', seed.key, { question: { equals: seed.question.fr } }, async () => {
      const shared = { category: seed.category, showOnHome: seed.showOnHome, order: seed.order }
      return {
        fr: { ...shared, question: seed.question.fr, answer: faqAnswer(seed.answer.fr) },
        en: { ...shared, question: seed.question.en, answer: faqAnswer(seed.answer.en) },
      }
    })
  }

  // --- Globals: always exist, so "seeded" means the editor-facing content is already there. ----
  async function global(
    slug: 'site' | 'navigation' | 'home',
    isSeeded: (doc: Record<string, unknown>) => boolean,
    write: () => Promise<void>,
  ) {
    if (!globals) return
    try {
      const doc = await payload.findGlobal({ slug, locale: 'fr', depth: 0, draft: true })
      const seeded = isSeeded(doc as unknown as Record<string, unknown>)
      if (seeded && !update) return record(slug, 'skipped')
      await write()
      record(slug, seeded ? 'updated' : 'created')
    } catch (error) {
      fail(slug, slug, error)
    }
  }

  // `site` has field defaults, so it reads as filled even when never saved; a saved row has dates.
  await global(
    'site',
    (doc) => Boolean(doc.updatedAt),
    async () => {
      const fr = await payload.updateGlobal({
        slug: 'site',
        locale: 'fr',
        data: siteData('fr'),
        depth: 0,
        context,
      })
      await payload.updateGlobal({
        slug: 'site',
        locale: 'en',
        data: withRowIds(siteData('en'), fr),
        depth: 0,
        context,
      })
    },
  )

  await global(
    'navigation',
    (doc) => Array.isArray(doc.header) && doc.header.length > 0,
    async () => {
      const missing = serviceSeeds.filter(({ key }) => serviceIds[key] === undefined)
      if (missing.length) {
        throw new Error(`services missing: ${missing.map(({ key }) => key).join(', ')}`)
      }
      const ids = serviceIds as Record<ServiceKey, number>
      const fr = await payload.updateGlobal({
        slug: 'navigation',
        locale: 'fr',
        data: navigationData('fr', ids),
        depth: 0,
        context,
      })
      await payload.updateGlobal({
        slug: 'navigation',
        locale: 'en',
        data: withRowIds(navigationData('en', ids), fr),
        depth: 0,
        context,
      })
    },
  )

  await global(
    'home',
    (doc) => isRecord(doc.hero) && Boolean(doc.hero.titleStart),
    async () => {
      const film = {
        video: (await media(filmMedia.video)) ?? undefined,
        poster: (await media(filmMedia.poster)) ?? undefined,
      }
      // Home arrays are localized as a whole, so each language writes its own rows.
      for (const locale of ['fr', 'en'] as const) {
        await payload.updateGlobal({
          slug: 'home',
          locale,
          data: { ...homeData(locale, film), _status: 'published' },
          depth: 0,
          context,
        })
      }
    },
  )

  return summary
}

export const totals = (summary: Summary): Counts =>
  Object.values(summary).reduce(
    (sum, counts) => ({
      created: sum.created + counts.created,
      updated: sum.updated + counts.updated,
      skipped: sum.skipped + counts.skipped,
      failed: sum.failed + counts.failed,
    }),
    { created: 0, updated: 0, skipped: 0, failed: 0 },
  )

export function formatSummary(summary: Summary): string {
  const header = ['', 'created', 'updated', 'skipped', 'failed']
  const rows = [
    ...steps.map((step) => [step, summary[step]] as const),
    ['total', totals(summary)] as const,
  ]
  const pad = (cells: (string | number)[]) =>
    cells
      .map((cell, index) => (index === 0 ? String(cell).padEnd(14) : String(cell).padStart(8)))
      .join('')
  return [
    pad(header),
    ...rows.map(([name, c]) => pad([name, c.created, c.updated, c.skipped, c.failed])),
  ].join('\n')
}
