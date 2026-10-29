// Prepares the hero background and attaches it to the `home` global (T-1.10, FR-HOME-01).
//
//   npm run encode:hero -- <source.mp4> [--start=0] [--duration=20] [--poster-at=1]
//                          [--cues=2,6,10,14,18] [--upload] [--force]
//   npm run encode:hero -- --poster=<photo.jpg> [--alt-fr=…] [--alt-en=…] [--upload] [--force]
//
// With a video: writes .cache/hero/hero-{480,720,1080}p.{webm,mp4} (silent, 24 fps) and
// hero-poster.avif from a frame. With --poster only: the hero is that still photo (no footage
// needed, no ffmpeg). The poster is AVIF at the best quality within 120 KB (NFR-PERF-02).
// --upload sends the files to Media and points the published `home` global at them; --cues moves
// the notification cues to new timestamps (seconds, in order). Footage and photos must be ours or
// licensed for commercial use.
import 'dotenv/config'

import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'

import { getPayload } from 'payload'

import config from '../src/payload.config'

import { assertFfmpeg, encode, extractFrame, posterAvif } from './hero/encode'
import { attachHeroVideo } from './hero/upload'
import { assertSeedTarget } from './seed/guard'

const args = process.argv.slice(2)
const option = (name: string) =>
  args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3)
const number = (name: string, fallback: number) => {
  const value = Number(option(name) ?? fallback)
  if (!Number.isFinite(value) || value < 0) throw new Error(`--${name} must be a number ≥ 0`)
  return value
}

const outDir = path.resolve('.cache/hero')

// Alt text for the uploaded files. The hero itself shows them as decoration (aria-hidden).
const alt = {
  fr: option('alt-fr') ?? 'Des pros HandyMan au travail sur un chantier',
  en: option('alt-en') ?? 'HandyMan pros at work on a job',
}

async function main(): Promise<number> {
  const input = args.find((arg) => !arg.startsWith('--'))
  const still = option('poster')
  if ((!input && !still) || (input && !existsSync(input)) || (still && !existsSync(still))) {
    console.error(
      'Usage: npm run encode:hero -- <source video> [--start=s] [--duration=s] …\n' +
        '   or: npm run encode:hero -- --poster=<photo> [--upload]',
    )
    return 2
  }
  const clip = { start: number('start', 0), duration: number('duration', 20) }
  const cues = option('cues')?.split(',').map(Number)
  if (cues?.some((time) => !Number.isFinite(time) || time < 0 || time > clip.duration)) {
    console.error(`--cues must be seconds between 0 and the clip length (${clip.duration})`)
    return 2
  }

  mkdirSync(outDir, { recursive: true })
  let files: Awaited<ReturnType<typeof encode>> = []
  if (input) {
    await assertFfmpeg()
    console.log(`Encoding ${clip.duration} s from ${clip.start} s of ${input}…`)
    files = await encode(input, outDir, clip)
  }

  const frame =
    still ??
    (await extractFrame(
      input!,
      clip.start + number('poster-at', 1),
      path.join(outDir, 'hero-poster.png'),
    ))
  const poster = path.join(outDir, 'hero-poster.avif')
  const bytes = await posterAvif(frame, poster)
  console.log(`  ✓ hero-poster.avif ${Math.round(bytes / 1024)} KB`)

  if (!args.includes('--upload')) {
    console.log(`\nFiles in ${outDir}. Re-run with --upload to attach them to the home page.`)
    return 0
  }
  const target = assertSeedTarget(process.env.DATABASE_URL, args.includes('--force'))
  console.log(`Uploading to ${target.host}/${target.database}…`)
  const payload = await getPayload({ config })
  await attachHeroVideo(payload, files, poster, alt, cues)
  console.log(`✓ Hero ${files.length ? 'video' : 'photo'} attached to the published home page.`)
  return 0
}

// Payload keeps its database pool open, so the process must exit explicitly (CLAUDE.md §8).
main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    console.error(`✗ ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  })
