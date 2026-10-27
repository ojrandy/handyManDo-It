import { revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload'

// Pages read CMS data through `src/lib/payload.ts`, which tags each read with the collection or
// global slug. Purging that tag re-renders every page that used it, in both locales, whatever
// the slug was, so hooks never need to work out URLs (architecture.md §4, ADR-004).
const purge = (tags: readonly string[], req: PayloadRequest) => {
  // Seeds and imports write hundreds of docs; they purge once at the end instead.
  if (req.context.disableRevalidate) return
  for (const tag of tags) {
    try {
      // `expire: 0`: the next visitor gets the edit, not one more stale render.
      revalidateTag(tag, { expire: 0 })
    } catch (error) {
      // Outside a Next.js server (Payload CLI, Vitest) there is no cache to purge.
      if (error instanceof Error && error.message.includes('static generation store missing')) {
        continue
      }
      // The save itself succeeded; a failed purge must not undo it, but it must be visible.
      req.payload.logger.error({ err: error, tag }, 'Cache revalidation failed')
    }
  }
}

type Versioned = { _status?: 'draft' | 'published' | null }

// Draft saves (and autosave) don't change what visitors see, unless they unpublish a doc.
const isVisibleChange = (doc: Versioned, previousDoc?: Versioned) =>
  doc._status !== 'draft' || previousDoc?._status === 'published'

export const revalidateCollection = (...tags: string[]) => {
  const afterChange: CollectionAfterChangeHook = ({ doc, previousDoc, req }) => {
    if (isVisibleChange(doc, previousDoc)) purge(tags, req)
    return doc
  }
  const afterDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
    purge(tags, req)
    return doc
  }
  return { afterChange: [afterChange], afterDelete: [afterDelete] }
}

export const revalidateGlobal = (...tags: string[]): GlobalAfterChangeHook[] => [
  ({ doc, previousDoc, req }) => {
    if (isVisibleChange(doc, previousDoc)) purge(tags, req)
    return doc
  },
]
