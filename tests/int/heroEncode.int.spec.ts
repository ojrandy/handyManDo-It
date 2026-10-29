import { mkdtempSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import {
  ffmpegArgs,
  outputName,
  posterAvif,
  posterBudget,
  renditions,
} from '../../scripts/hero/encode'
import { videoField } from '../../scripts/hero/upload'

// The parts of `npm run encode:hero` that don't need ffmpeg (T-1.10).
describe('hero encode', () => {
  it('maps each size and format to a home.hero.video field', () => {
    const fields = renditions.flatMap((r) =>
      (['mp4', 'webm'] as const).map((f) => videoField(f, r)),
    )
    expect(fields.sort()).toEqual(
      ['mp4', 'mp4Large', 'mp4Small', 'webm', 'webmLarge', 'webmSmall'].sort(),
    )
    expect(renditions.map(({ height }) => height)).toEqual([480, 720, 1080])
  })

  it('builds silent, fast-start H.264 and VP9 commands for the clip', () => {
    const [, hd] = renditions
    const mp4 = ffmpegArgs('in.mov', outputName('mp4', hd), 'mp4', hd, { start: 3, duration: 20 })
    expect(mp4).toEqual(expect.arrayContaining(['-ss', '3', '-t', '20', '-an', 'libx264']))
    expect(mp4.join(' ')).toContain('scale=-2:720')
    expect(mp4.join(' ')).toContain('+faststart')
    expect(mp4.at(-1)).toBe('hero-720p.mp4')

    const webm = ffmpegArgs('in.mov', 'out.webm', 'webm', hd, { start: 0, duration: 20 })
    expect(webm).toEqual(expect.arrayContaining(['libvpx-vp9', '-b:v', '0', '-an']))
  })

  it('writes an AVIF poster within the 120 KB budget', async () => {
    // A 1080p frame: brand gradient with shapes, roughly as busy as a photo.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
      <defs><linearGradient id="g"><stop offset="0" stop-color="#0f2530"/><stop offset="1" stop-color="#4791a5"/></linearGradient></defs>
      <rect width="1920" height="1080" fill="url(#g)"/>
      ${Array.from({ length: 60 }, (_, i) => `<circle cx="${(i * 97) % 1920}" cy="${(i * 53) % 1080}" r="${20 + (i % 7) * 15}" fill="#e7ab34" opacity="0.4"/>`).join('')}
    </svg>`
    const frame = await sharp(Buffer.from(svg)).png().toBuffer()
    const out = path.join(mkdtempSync(path.join(tmpdir(), 'poster-')), 'poster.avif')

    const bytes = await posterAvif(frame, out)
    expect(bytes).toBeLessThanOrEqual(posterBudget)
    expect(statSync(out).size).toBe(bytes)
    const meta = await sharp(out).metadata()
    expect(meta.format).toBe('heif')
    expect(meta.width).toBe(1600)
  }, 60_000)
})
