// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { CmsImage } from '@/components/ui/CmsImage'

// Files missing from storage (incident 2026-11-10): a generated size can 404 while the original
// is there. A blog post's inline photos then left blank gaps the height of each photo.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root
let host: HTMLDivElement

beforeEach(() => {
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

const sources = [
  { url: 'https://cdn.test/photo-960x640.webp', width: 960 },
  { url: 'https://cdn.test/photo.jpg', width: 1200 },
]
const render = (removeOnError = false) =>
  act(() =>
    root.render(
      createElement(CmsImage, {
        sources,
        alt: 'Stage',
        width: 1200,
        height: 800,
        sizes: '100vw',
        className: 'w-full',
        removeOnError,
      }),
    ),
  )
const img = () => host.querySelector('img')
const fail = () => act(() => void img()!.dispatchEvent(new Event('error')))

describe('CmsImage when a file fails to load', () => {
  it('retries with the original, then hides the image and keeps its box', () => {
    render()
    expect(img()!.getAttribute('srcset')).toContain('photo-960x640.webp')
    fail()
    expect(img()!.getAttribute('src')).toBe('https://cdn.test/photo.jpg')
    expect(img()!.hasAttribute('srcset')).toBe(false)
    expect(img()!.className).not.toContain('invisible')
    fail()
    expect(img()!.className).toContain('invisible')
  })

  it('removes an inline image whose original fails too', () => {
    render(true)
    fail()
    expect(img()).not.toBeNull()
    fail()
    expect(img()).toBeNull()
  })
})
