import { describe, expect, it } from 'vitest'

import { bentoOrder, faqText, heroVideoFrom, pick, pickList } from '@/lib/home'
import { imageSources } from '@/lib/media'
import { paragraph } from '@/lib/richText'
import type { Media, Service } from '@/payload-types'

// Pure helpers behind the home sections' Payload reads (T-1.15). No database needed.

const media = (overrides: Partial<Media> = {}): Media => ({
  id: 1,
  alt: 'Photo',
  url: '/api/media/file/photo.webp',
  width: 2000,
  height: 1000,
  updatedAt: '',
  createdAt: '',
  ...overrides,
})

describe('fallbacks', () => {
  it('keeps the fallback while a field is empty or blank', () => {
    expect(pick(null, 'Messages')).toBe('Messages')
    expect(pick('  ', 'Messages')).toBe('Messages')
    expect(pick('Éditeur', 'Messages')).toBe('Éditeur')
  })

  it('maps an editor list, or uses the fallback when it has no rows', () => {
    const fallback = () => ['messages']
    expect(pickList(undefined, String, fallback)).toEqual(['messages'])
    expect(pickList([], String, fallback)).toEqual(['messages'])
    expect(pickList([1, 2], (n, i) => `${n}:${i}`, fallback)).toEqual(['1:0', '2:1'])
  })
})

describe('imageSources', () => {
  it('lists generated sizes narrower than the original, narrowest first', () => {
    const sources = imageSources(
      media({
        sizes: {
          card: { url: '/card.webp', width: 960 },
          thumb: { url: '/thumb.webp', width: 480 },
          hero: { url: null, width: null },
        },
      }),
    )
    expect(sources).toEqual([
      { url: '/thumb.webp', width: 480 },
      { url: '/card.webp', width: 960 },
      { url: '/api/media/file/photo.webp', width: 2000 },
    ])
  })

  it('is empty for an unpopulated or missing upload', () => {
    expect(imageSources(3)).toEqual([])
    expect(imageSources(null)).toEqual([])
    expect(imageSources(media({ url: null }))).toEqual([])
  })
})

describe('heroVideoFrom', () => {
  it('needs an MP4; WebM and poster are optional', () => {
    expect(heroVideoFrom(undefined)).toBeNull()
    expect(heroVideoFrom({ poster: media() })).toBeNull()
    expect(heroVideoFrom({ mp4: media({ url: '/hero.mp4' }) })).toEqual({
      mp4: '/hero.mp4',
      webm: undefined,
      poster: undefined,
    })
  })
})

describe('bentoOrder', () => {
  it('puts large tiles first and keeps editor order within each size', () => {
    const service = (id: number, size: Service['size']) => ({ id, size }) as Service
    const ordered = bentoOrder([service(1, 'small'), service(2, 'large'), service(3, null)])
    expect(ordered.map(({ id }) => id)).toEqual([2, 1, 3])
  })
})

describe('faqText', () => {
  it('turns a rich-text answer into plain text for JSON-LD', () => {
    expect(faqText(paragraph('Mobile Money, held until done.'))).toBe(
      'Mobile Money, held until done.',
    )
  })
})
