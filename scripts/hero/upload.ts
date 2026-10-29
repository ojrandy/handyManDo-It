import path from 'node:path'

import type { Payload } from 'payload'

import { findMedia } from '../seed/media'

import type { Format, Rendition } from './encode'

type Encoded = { format: Format; rendition: Rendition; file: string }

export type HeroAlt = { fr: string; en: string }

// `home.hero.video` field for an encoded file: mp4, webmLarge, mp4Small…
export const videoField = (format: Format, rendition: Rendition) => `${format}${rendition.field}`

async function upload(payload: Payload, file: string, alt: HeroAlt): Promise<number> {
  const existing = await findMedia(payload, file)
  const id =
    existing ??
    (
      await payload.create({
        collection: 'media',
        locale: 'fr',
        data: { alt: alt.fr },
        filePath: file,
      })
    ).id
  if (existing !== null) {
    // Same name, new encode: replace the stored file.
    await payload.update({
      collection: 'media',
      id,
      locale: 'fr',
      data: { alt: alt.fr },
      filePath: file,
    })
  }
  await payload.update({ collection: 'media', id, locale: 'en', data: { alt: alt.en } })
  return id
}

// Points the published `home` global at the new files, and optionally moves the notification
// cues to new timestamps (same rows, same text, both languages). Saving publishes `home`, which
// purges its cache tag so the home page picks up the footage (FR-CMS-04).
export async function attachHeroVideo(
  payload: Payload,
  files: readonly Encoded[],
  poster: string,
  alt: HeroAlt,
  cueTimes?: readonly number[],
  log = console.log,
) {
  const video: Record<string, number> = {}
  for (const { format, rendition, file } of files) {
    video[videoField(format, rendition)] = await upload(payload, file, alt)
    log(`  ✓ uploaded ${path.basename(file)}`)
  }
  video.poster = await upload(payload, poster, alt)
  log(`  ✓ uploaded ${path.basename(poster)}`)

  for (const locale of ['fr', 'en'] as const) {
    // The published version: a pending editor draft is left for the editor to publish.
    const home = await payload.findGlobal({ slug: 'home', locale, depth: 0 })
    const hero = home.hero ?? {}
    const cues = cueTimes
      ? (hero.cues ?? []).map((cue, index) => ({ ...cue, time: cueTimes[index] ?? cue.time }))
      : hero.cues
    if (cueTimes && cueTimes.length !== (hero.cues?.length ?? 0)) {
      log(`  ! ${locale}: ${cueTimes.length} cue times for ${hero.cues?.length ?? 0} cues`)
    }
    await payload.updateGlobal({
      slug: 'home',
      locale,
      data: { hero: { ...hero, video: { ...hero.video, ...video }, cues }, _status: 'published' },
      depth: 0,
    })
  }
}
