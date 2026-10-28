import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { serviceKeys } from '@/lib/service-keys'
import config from '@/payload.config'

import {
  faqSeeds,
  homeData,
  navigationData,
  partnerSeeds,
  serviceSeeds,
  siteData,
  teamSeeds,
  testimonialSeeds,
} from '../../scripts/seed/data'
import { assertSeedTarget } from '../../scripts/seed/guard'
import { runSeed, withRowIds } from '../../scripts/seed/run'

describe('seed data', () => {
  it('covers every built-in service once, in both languages', () => {
    expect(serviceSeeds.map(({ key }) => key).sort()).toEqual([...serviceKeys].sort())
    for (const seed of serviceSeeds) {
      for (const locale of ['fr', 'en'] as const) {
        expect(seed.title[locale], `${seed.key} ${locale}`).toBeTruthy()
        expect(seed.summary[locale], `${seed.key} ${locale}`).toBeTruthy()
        expect(seed.slug[locale], `${seed.key} ${locale}`).toMatch(/^[a-z0-9-]+$/)
      }
    }
  })

  it('has the counts the plan asks for', () => {
    expect(testimonialSeeds).toHaveLength(4)
    expect(teamSeeds).toHaveLength(3)
    expect(partnerSeeds).toHaveLength(8)
    expect(faqSeeds.filter(({ showOnHome }) => showOnHome).length).toBeGreaterThanOrEqual(8)
  })

  it('uses unique match keys', () => {
    const unique = (values: string[]) => new Set(values).size === values.length
    expect(unique(testimonialSeeds.map(({ name }) => name))).toBe(true)
    expect(unique(teamSeeds.map(({ name }) => name))).toBe(true)
    expect(unique(partnerSeeds.map(({ logo }) => logo.file))).toBe(true)
    expect(unique(faqSeeds.map(({ question }) => question.fr))).toBe(true)
  })

  it('writes different copy per language for the globals', () => {
    const ids = Object.fromEntries(serviceKeys.map((key, index) => [key, index + 1])) as never
    expect(siteData('fr').hours).not.toBe(siteData('en').hours)
    expect(navigationData('fr', ids).header?.[1].link.label).not.toBe(
      navigationData('en', ids).header?.[1].link.label,
    )
    expect(homeData('fr', {}).hero?.titleStart).not.toBe(homeData('en', {}).hero?.titleStart)
  })
})

describe('seed guard', () => {
  it('accepts a local database', () => {
    expect(assertSeedTarget('postgres://u:p@localhost:5432/db', false).database).toBe('db')
  })

  it('refuses a remote database unless forced', () => {
    const neon = 'postgres://u:p@ep-x.us-east-1.aws.neon.tech/neondb'
    expect(() => assertSeedTarget(neon, false)).toThrow(/refused/)
    expect(assertSeedTarget(neon, true).local).toBe(false)
    expect(() => assertSeedTarget(undefined, true)).toThrow(/not set/)
  })
})

describe('withRowIds', () => {
  it('copies array row ids from the saved document, at any depth', () => {
    const saved = { id: 1, rows: [{ id: 'a', label: 'Un', links: [{ id: 'b', label: 'Deux' }] }] }
    const next = { rows: [{ label: 'One', links: [{ label: 'Two' }] }] }
    expect(withRowIds(next, saved)).toEqual({
      rows: [{ id: 'a', label: 'One', links: [{ id: 'b', label: 'Two' }] }],
    })
  })
})

describe('seed run', () => {
  let payload: Payload

  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  it('creates nothing on a second run', async () => {
    const quiet = () => {}
    const first = await runSeed(payload, { globals: false, log: quiet })
    const second = await runSeed(payload, { globals: false, log: quiet })

    for (const counts of [...Object.values(first), ...Object.values(second)]) {
      expect(counts.failed).toBe(0)
    }
    for (const counts of Object.values(second)) {
      expect(counts.created).toBe(0)
      expect(counts.updated).toBe(0)
    }
    expect(second.services.skipped).toBe(11)
    expect(second.faqs.skipped).toBe(faqSeeds.length)
  }, 120_000)

  it('writes both languages', async () => {
    const where = { key: { equals: 'moving' } }
    const [fr, en] = await Promise.all(
      (['fr', 'en'] as const).map((locale) =>
        payload.find({ collection: 'services', where, locale, depth: 0 }),
      ),
    )
    expect(fr.docs[0]?.slug).toBe('demenagement')
    expect(en.docs[0]?.slug).toBe('moving')
  })
})
