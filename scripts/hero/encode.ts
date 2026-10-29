import { execFile } from 'node:child_process'
import { statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'

import sharp from 'sharp'

const run = promisify(execFile)

// The three sizes the `home` global holds (PLAN.md §2, architecture.md §4.5). `field` is the
// suffix of the upload fields: mp4 / webm, mp4Large / webmLarge, mp4Small / webmSmall.
export const renditions = [
  { field: 'Small', height: 480, crf: { mp4: 28, webm: 38 } },
  { field: '', height: 720, crf: { mp4: 26, webm: 35 } },
  { field: 'Large', height: 1080, crf: { mp4: 24, webm: 33 } },
] as const

export type Rendition = (typeof renditions)[number]
export type Format = 'mp4' | 'webm'

export type Clip = {
  // Seconds into the source where the loop starts, and its length (PLAN.md §5.2: about 20 s).
  start: number
  duration: number
}

export const outputName = (format: Format, rendition: Rendition) =>
  `hero-${rendition.height}p.${format}`

// Silent, looping background footage: no audio track, 24 fps, even dimensions, fast start.
export function ffmpegArgs(
  input: string,
  output: string,
  format: Format,
  rendition: Rendition,
  clip: Clip,
): string[] {
  const common = [
    '-y',
    '-ss',
    String(clip.start),
    '-t',
    String(clip.duration),
    '-i',
    input,
    '-an',
    '-vf',
    `scale=-2:${rendition.height}:flags=lanczos,fps=24`,
    '-pix_fmt',
    'yuv420p',
  ]
  const codec =
    format === 'mp4'
      ? [
          '-c:v',
          'libx264',
          '-preset',
          'slow',
          '-profile:v',
          'high',
          '-crf',
          String(rendition.crf.mp4),
          '-movflags',
          '+faststart',
        ]
      : [
          '-c:v',
          'libvpx-vp9',
          '-crf',
          String(rendition.crf.webm),
          '-b:v',
          '0',
          '-row-mt',
          '1',
          '-deadline',
          'good',
          '-cpu-used',
          '2',
        ]
  return [...common, ...codec, output]
}

export const ffmpegBinary = () => process.env.FFMPEG_PATH || 'ffmpeg'

export async function assertFfmpeg(): Promise<void> {
  try {
    await run(ffmpegBinary(), ['-hide_banner', '-version'])
  } catch {
    throw new Error(
      'ffmpeg not found. Install it (winget install Gyan.FFmpeg, brew install ffmpeg, apt install ffmpeg) or set FFMPEG_PATH.',
    )
  }
}

export async function encode(input: string, outDir: string, clip: Clip, log = console.log) {
  const files: { format: Format; rendition: Rendition; file: string }[] = []
  for (const rendition of renditions) {
    for (const format of ['webm', 'mp4'] as const) {
      const file = path.join(outDir, outputName(format, rendition))
      await run(ffmpegBinary(), ffmpegArgs(input, file, format, rendition, clip), {
        maxBuffer: 64 * 1024 * 1024,
      })
      log(`  ✓ ${path.basename(file)} ${Math.round(statSync(file).size / 1024)} KB`)
      files.push({ format, rendition, file })
    }
  }
  return files
}

// NFR-PERF-02: the poster shows until the video plays (and instead of it in light-data mode).
export const posterBudget = 120 * 1024
export const posterWidth = 1600

// AVIF at the highest quality that fits the budget.
export async function posterAvif(frame: string | Buffer, output: string): Promise<number> {
  for (let quality = 60; quality >= 20; quality -= 5) {
    const data = await sharp(frame)
      .resize({ width: posterWidth, withoutEnlargement: true })
      .avif({ quality, effort: 6 })
      .toBuffer()
    if (data.length <= posterBudget) {
      writeFileSync(output, data)
      return data.length
    }
  }
  throw new Error(`poster stays over ${posterBudget / 1024} KB even at AVIF quality 20`)
}

// The poster frame, as a PNG, from `at` seconds into the source.
export async function extractFrame(input: string, at: number, output: string): Promise<string> {
  await run(ffmpegBinary(), ['-y', '-ss', String(at), '-i', input, '-frames:v', '1', output])
  return output
}
