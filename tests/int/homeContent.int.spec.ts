import { describe, expect, it } from 'vitest'

import { bentoOrder, faqText, findScreen, heroVideoFrom, pick, pickList } from '@/lib/home'
import { imageSources } from '@/lib/media'
import { paragraph } from '@/lib/richText'
import type { AppScreen, Media, Service } from '@/payload-types'

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
  const file = (url: string) => media({ url })

  it('needs the 720p MP4; other sizes, WebM and poster are optional', () => {
    expect(heroVideoFrom(undefined)).toBeNull()
    expect(heroVideoFrom({ poster: media(), mp4Large: file('/1080.mp4') })).toBeNull()
    expect(heroVideoFrom({ mp4: file('/720.mp4') })).toEqual({
      sources: [{ src: '/720.mp4', type: 'video/mp4', media: undefined }],
      poster: undefined,
    })
  })

  it('lists sources largest first, WebM before MP4, each with its viewport condition', () => {
    const video = heroVideoFrom({
      mp4Large: file('/1080.mp4'),
      webmLarge: file('/1080.webm'),
      mp4: file('/720.mp4'),
      webm: file('/720.webm'),
      mp4Small: file('/480.mp4'),
      webmSmall: file('/480.webm'),
      poster: file('/poster.avif'),
    })
    expect(video?.sources.map(({ src, media }) => [src, media])).toEqual([
      ['/1080.webm', '(min-width: 1280px)'],
      ['/1080.mp4', '(min-width: 1280px)'],
      ['/720.webm', '(min-width: 640px)'],
      ['/720.mp4', '(min-width: 640px)'],
      ['/480.webm', undefined],
      ['/480.mp4', undefined],
    ])
    expect(video?.poster).toBe('/poster.avif')
  })

  it('lets small screens play 720p when there is no 480p file', () => {
    const video = heroVideoFrom({ mp4: file('/720.mp4'), mp4Large: file('/1080.mp4') })
    expect(video?.sources.map(({ media }) => media)).toEqual(['(min-width: 1280px)', undefined])
  })
})

describe('findScreen', () => {
  it('picks the screen by key and theme, or nothing (the HTML rebuild stands in)', () => {
    const screen = (id: number, key: AppScreen['key'], theme: AppScreen['theme']) =>
      ({ id, key, theme, lang: 'fr' }) as AppScreen
    const screens = [
      screen(1, 'home', 'light'),
      screen(2, 'home', 'dark'),
      screen(3, 'shop', 'light'),
    ]
    expect(findScreen(screens, 'home', 'dark')?.id).toBe(2)
    expect(findScreen(screens, 'shop', 'dark')).toBeUndefined()
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
