import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

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
      className={`max-w-none text-lg leading-relaxed text-slate-500 [&_a]:font-semibold [&_a]:text-teal-600 [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-teal-700 [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-teal-700 [&_li]:mt-1.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p+p]:mt-4 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:pl-6 [&_:is(ul,ol)]:my-4 ${className}`}
    />
  )
}
