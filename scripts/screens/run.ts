import type { Payload } from 'payload'

import type { Counts } from '../seed/run'
import { findMedia } from '../seed/media'

import type { Captured } from './capture'
import { altText } from './data'

// Writes skip the revalidation hooks (src/hooks/revalidate.ts), like the seed.
const context = { disableRevalidate: true }

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

export type UploadOptions = {
  // Replace the screenshot of screens that already exist (after an app redesign). Off by default,
  // so a re-run keeps images an editor uploaded by hand.
  update?: boolean
  log?: (line: string) => void
}

// One `app-screens` document per screen × language × theme, matched on that triple.
export async function uploadScreens(
  payload: Payload,
  captured: readonly Captured[],
  { update = false, log = console.log }: UploadOptions = {},
): Promise<Counts> {
  const counts: Counts = { created: 0, updated: 0, skipped: 0, failed: 0 }
  for (const { spec, lang, theme, file } of captured) {
    const label = `${spec.key} ${lang} ${theme}`
    try {
      const existing = await payload.find({
        collection: 'app-screens',
        where: {
          key: { equals: spec.key },
          lang: { equals: lang },
          theme: { equals: theme },
        },
        limit: 1,
        depth: 0,
      })
      const screen = existing.docs[0]
      if (screen && !update) {
        counts.skipped++
        continue
      }
      const alt = altText(spec, lang, theme)
      let image = screen
        ? typeof screen.image === 'object'
          ? screen.image.id
          : screen.image
        : null
      image ??= await findMedia(payload, file)
      if (image === null) {
        image = (
          await payload.create({
            collection: 'media',
            locale: 'fr',
            data: { alt: alt.fr },
            filePath: file,
            context,
          })
        ).id
      } else {
        // Replaces the stored file (and its sizes) with the new capture.
        await payload.update({
          collection: 'media',
          id: image,
          locale: 'fr',
          data: { alt: alt.fr },
          filePath: file,
          context,
        })
      }
      await payload.update({
        collection: 'media',
        id: image,
        locale: 'en',
        data: { alt: alt.en },
        context,
      })

      const data = { key: spec.key, lang, theme, image, caption: spec.caption.fr }
      const id = screen
        ? (
            await payload.update({
              collection: 'app-screens',
              id: screen.id,
              locale: 'fr',
              data,
              context,
            })
          ).id
        : (await payload.create({ collection: 'app-screens', locale: 'fr', data, context })).id
      await payload.update({
        collection: 'app-screens',
        id,
        locale: 'en',
        data: { caption: spec.caption.en },
        context,
      })
      counts[screen ? 'updated' : 'created']++
    } catch (error) {
      counts.failed++
      log(`  ✗ ${label}: ${errorMessage(error)}`)
    }
  }
  return counts
}
