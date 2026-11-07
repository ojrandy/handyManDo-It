// Cuts the brand intro into the vertical launch screen the hero phone plays (ADR-028, T-2.08).
//
//   npm run encode:splash -- [source.mp4] [--start=3.4] [--end=7.55] [--poster-at=7] [--kbps=700]
//
// Writes public/video/brand-splash.mp4 and brand-splash-poster.webp. The source is 16:9 and a
// phone screen shows about a quarter of that width, so cropping to fill would cut the logo.
// Instead the picture is enlarged and kept sharp across the middle of the screen, over a blurred
// copy of plain wood, in one file: the phone decodes one video, not two. The default cut starts
// just before the logo arrives and ends before the source fades to black.
//
// Needs Google Chrome and no ffmpeg (Playwright's own Chromium has no H.264). Each frame is sought,
// drawn and encoded in turn with WebCodecs, so the result doesn't depend on how busy the machine
// is. MediaRecorder was tried first: in real time it loses frames, or returns nothing at all.
import { readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { chromium } from '@playwright/test'
import sharp from 'sharp'

const args = process.argv.slice(2)
const option = (name: string, fallback: number) => {
  const raw = args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3)
  const value = Number(raw ?? fallback)
  if (!Number.isFinite(value) || value < 0) throw new Error(`--${name} must be a number ≥ 0`)
  return value
}

// ADR-028: 4G phones on mobile data play this file.
const BUDGET_KB = 400

const outDir = path.resolve('public/video')
const input = args.find((arg) => !arg.startsWith('--')) ?? path.join(outDir, 'brand-intro.mp4')

const settings = {
  src: `data:video/mp4;base64,${readFileSync(input).toString('base64')}`,
  start: option('start', 3.4),
  end: option('end', 7.55),
  posterAt: option('poster-at', 7),
  kbps: option('kbps', 700),
  width: 540,
  height: 1170,
  fps: 30,
  // How much wider than the screen the sharp picture is: the logo fills it without clipping.
  zoom: 1.6,
  // Soft top and bottom edge of the sharp band, in pixels.
  feather: 60,
}

// Runs in the page, passed as a string: the test loader's helpers don't exist there (CLAUDE.md §8).
const pageScript = `
window.splash = (() => {
  const s = ${JSON.stringify(settings)}
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.src = s.src

  const canvas = document.createElement('canvas')
  canvas.width = s.width
  canvas.height = s.height
  const g = canvas.getContext('2d')

  const bandWidth = s.width * s.zoom
  const bandHeight = (bandWidth * 9) / 16
  const band = document.createElement('canvas')
  band.width = s.width
  band.height = bandHeight
  const b = band.getContext('2d')

  function draw() {
    // Behind the band: the plain wood at the source's left edge, where the settled logo never
    // reaches. Blurring the whole frame would leave a big smear of the logo above and below it.
    const woodWidth = (video.videoHeight * s.width) / s.height
    g.filter = 'blur(6px) brightness(0.85)'
    g.drawImage(video, 0, 0, woodWidth, video.videoHeight, -20, -20, s.width + 40, s.height + 40)
    g.filter = 'none'

    b.globalCompositeOperation = 'source-over'
    b.clearRect(0, 0, band.width, band.height)
    b.drawImage(video, (s.width - bandWidth) / 2, 0, bandWidth, bandHeight)
    const mask = b.createLinearGradient(0, 0, 0, bandHeight)
    const edge = s.feather / bandHeight
    mask.addColorStop(0, 'transparent')
    mask.addColorStop(edge, 'black')
    mask.addColorStop(1 - edge, 'black')
    mask.addColorStop(1, 'transparent')
    b.globalCompositeOperation = 'destination-in'
    b.fillStyle = mask
    b.fillRect(0, 0, band.width, band.height)
    g.drawImage(band, 0, (s.height - bandHeight) / 2)
  }

  const seek = (time) =>
    new Promise((resolve) => {
      video.onseeked = resolve
      video.currentTime = time
    })

  // A minimal MP4: one H.264 track, all samples in one chunk, the index before the data so it
  // starts playing while it downloads.
  function mux(samples, avcC) {
    const text = (value) => Uint8Array.from(value, (c) => c.charCodeAt(0))
    const u32 = (...values) => {
      const out = new Uint8Array(values.length * 4)
      const view = new DataView(out.buffer)
      values.forEach((value, i) => view.setUint32(i * 4, value))
      return out
    }
    const u16 = (...values) => {
      const out = new Uint8Array(values.length * 2)
      const view = new DataView(out.buffer)
      values.forEach((value, i) => view.setUint16(i * 2, value))
      return out
    }
    const concat = (parts) => {
      const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0))
      let at = 0
      for (const part of parts) {
        out.set(part, at)
        at += part.length
      }
      return out
    }
    const box = (type, ...parts) => {
      const body = concat(parts)
      return concat([u32(body.length + 8), text(type), body])
    }
    const full = (type, flags, ...parts) => box(type, u32(flags), ...parts)

    const timescale = s.fps * 1000
    const delta = 1000
    const duration = samples.length * delta
    const matrix = u32(0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000)
    const keys = samples.flatMap((sample, i) => (sample.key ? [i + 1] : []))

    const moov = (offset) =>
      box(
        'moov',
        full('mvhd', 0, u32(0, 0, timescale, duration, 0x10000), u16(0x100, 0), u32(0, 0), matrix, u32(0, 0, 0, 0, 0, 0, 2)),
        box(
          'trak',
          full('tkhd', 3, u32(0, 0, 1, 0, duration, 0, 0), u16(0, 0, 0, 0), matrix, u32(s.width * 65536, s.height * 65536)),
          box(
            'mdia',
            full('mdhd', 0, u32(0, 0, timescale, duration), u16(0x55c4, 0)),
            full('hdlr', 0, u32(0), text('vide'), u32(0, 0, 0), text('VideoHandler'), new Uint8Array(1)),
            box(
              'minf',
              full('vmhd', 1, new Uint8Array(8)),
              box('dinf', full('dref', 0, u32(1), full('url ', 1))),
              box(
                'stbl',
                full(
                  'stsd',
                  0,
                  u32(1),
                  box(
                    'avc1',
                    new Uint8Array(6),
                    u16(1),
                    new Uint8Array(16),
                    u16(s.width, s.height),
                    u32(0x480000, 0x480000, 0),
                    u16(1),
                    new Uint8Array(32),
                    u16(0x18, 0xffff),
                    box('avcC', avcC),
                  ),
                ),
                full('stts', 0, u32(1, samples.length, delta)),
                full('stss', 0, u32(keys.length, ...keys)),
                full('stsc', 0, u32(1, 1, samples.length, 1)),
                full('stsz', 0, u32(0, samples.length, ...samples.map(({ data }) => data.length))),
                full('stco', 0, u32(1, offset)),
              ),
            ),
          ),
        ),
      )

    const ftyp = box('ftyp', text('isom'), u32(0x200), text('isomiso2avc1mp41'))
    const offset = ftyp.length + moov(0).length + 8
    return concat([ftyp, moov(offset), box('mdat', ...samples.map(({ data }) => data))])
  }

  function base64(bytes) {
    let out = ''
    for (let i = 0; i < bytes.length; i += 32768) {
      out += String.fromCharCode(...bytes.subarray(i, i + 32768))
    }
    return btoa(out)
  }

  return {
    async poster() {
      await seek(s.posterAt)
      draw()
      return canvas.toDataURL('image/png').split(',')[1]
    },
    async encode() {
      const samples = []
      let avcC
      let failure
      const encoder = new VideoEncoder({
        output(chunk, meta) {
          if (meta?.decoderConfig?.description) {
            avcC = new Uint8Array(meta.decoderConfig.description.slice(0))
          }
          const data = new Uint8Array(chunk.byteLength)
          chunk.copyTo(data)
          samples.push({ data, key: chunk.type === 'key' })
        },
        error(error) {
          failure = error
        },
      })
      encoder.configure({
        codec: 'avc1.42E032',
        width: s.width,
        height: s.height,
        bitrate: s.kbps * 1000,
        framerate: s.fps,
        latencyMode: 'quality',
        hardwareAcceleration: 'prefer-software',
        avc: { format: 'avc' },
      })
      const count = Math.round((s.end - s.start) * s.fps)
      for (let i = 0; i < count; i += 1) {
        await seek(s.start + i / s.fps)
        draw()
        const frame = new VideoFrame(canvas, {
          timestamp: Math.round((i * 1e6) / s.fps),
          duration: Math.round(1e6 / s.fps),
        })
        encoder.encode(frame, { keyFrame: i === 0 })
        frame.close()
        while (encoder.encodeQueueSize > 2) await new Promise((resolve) => setTimeout(resolve, 10))
        if (failure) throw failure
      }
      await encoder.flush()
      encoder.close()
      if (failure) throw failure
      if (samples.length !== count) throw new Error(samples.length + ' of ' + count + ' frames')
      console.log(samples.length + ' frames, ' + samples.filter(({ key }) => key).length + ' keyframes')
      return base64(mux(samples, avcC))
    },
    ready: new Promise((resolve) => (video.onloadeddata = resolve)),
  }
})()
`

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const page = await browser.newPage()
  page.on('console', (message) => console.log(`  ${message.text()}`))
  // WebCodecs needs a secure page. Answered here: nothing goes over the network.
  await page.route('https://splash.invalid/', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>splash</title><body>' }),
  )
  await page.goto('https://splash.invalid/')
  await page.evaluate(pageScript)
  await page.evaluate('window.splash.ready')

  // H.264 only (ADR-028): every browser that matters plays it, and one without goes to Home.
  const clip = Buffer.from(String(await page.evaluate('window.splash.encode()')), 'base64')
  const output = path.join(outDir, 'brand-splash.mp4')
  writeFileSync(output, clip)
  const kb = Math.round(statSync(output).size / 1024)
  console.log(`  ${kb <= BUDGET_KB ? '✓' : '✗ over budget:'} brand-splash.mp4 ${kb} KB`)

  const frame = await page.evaluate('window.splash.poster()')
  const poster = path.join(outDir, 'brand-splash-poster.webp')
  await sharp(Buffer.from(String(frame), 'base64'))
    .webp({ quality: 72 })
    .toFile(poster)
  console.log(`  ✓ brand-splash-poster.webp ${Math.round(statSync(poster).size / 1024)} KB`)
  // Can hang on Windows once the work is done: don't wait for it for long.
  await Promise.race([browser.close(), new Promise((resolve) => setTimeout(resolve, 3000))])
}

// Explicit exit: on Windows the Playwright pipe can keep the process open after the work is done.
main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(`✗ ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  })
