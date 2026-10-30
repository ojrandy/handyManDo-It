import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'

import { CmsImage } from '@/components/ui/CmsImage'
import { asMedia, imageSources } from '@/lib/media'
import type { Media } from '@/payload-types'

// Inline images use the sizes made at upload, lazily (CLAUDE.md §6.3): the default converter
// would send the original file, up to 2400 px, to every phone.
const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  upload: ({ node }) => {
    const media = asMedia(node.value as number | Media)
    const sources = imageSources(media)
    if (!media?.mimeType?.startsWith('image/') || !sources.length) return null
    return (
      <CmsImage
        sources={sources}
        alt={media.alt ?? ''}
        width={media.width ?? 1200}
        height={media.height ?? 800}
        sizes="(min-width: 768px) 48rem, 100vw"
        loading="lazy"
        className="my-8 h-auto w-full rounded-panel"
      />
    )
  },
})

// CMS rich text on light backgrounds, with the site's type scale.
export function Prose({
  data,
  className = '',
}: {
  data: SerializedEditorState
  className?: string
}) {
  return (
    <RichText
      data={data}
      converters={converters}
      className={`max-w-none text-lg leading-relaxed text-slate-500 [&_a]:font-semibold [&_a]:text-teal-600 [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-teal-700 [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-teal-700 [&_li]:mt-1.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p+p]:mt-4 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:pl-6 [&_:is(ul,ol)]:my-4 ${className}`}
    />
  )
}
