import { getFormatter, getTranslations } from 'next-intl/server'

import { CmsImage } from '@/components/ui/CmsImage'
import { Link } from '@/i18n/navigation'
import { asMedia, imageSources } from '@/lib/media'
import type { Post } from '@/payload-types'

type Props = {
  post: Post
  // The post has no text in the page language: its English title and excerpt get `lang="en"`.
  englishOnly?: boolean
  headingLevel?: 'h2' | 'h3'
}

// Blog card: cover, date, title, excerpt. The whole card is the link; the heading stays its
// accessible name (home latest posts, blog index, related posts).
export async function PostCard({ post, englishOnly = false, headingLevel = 'h3' }: Props) {
  const [format, t] = await Promise.all([getFormatter(), getTranslations('blogPage')])
  const { id, title, slug, excerpt, cover, publishedAt } = post
  const sources = imageSources(cover)
  const Heading = headingLevel
  const lang = englishOnly ? 'en' : undefined

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-panel bg-white shadow-sm ring-1 ring-mist-200 transition-shadow hover:shadow-float">
      <div className="relative aspect-[16/10] bg-mist-100">
        {sources.length ? (
          <CmsImage
            sources={sources}
            alt={asMedia(cover)?.alt ?? ''}
            fill
            sizes="(min-width: 768px) 26rem, 100vw"
            loading="lazy"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
          {publishedAt ? (
            <time dateTime={publishedAt}>
              {format.dateTime(new Date(publishedAt), { dateStyle: 'long' })}
            </time>
          ) : null}
          {englishOnly ? (
            <span className="rounded-full bg-mist-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
              {t('englishOnly')}
            </span>
          ) : null}
        </p>
        <Heading lang={lang} className="mt-2 text-xl leading-snug font-bold text-teal-700">
          <Link
            href={{ pathname: '/blog/[slug]', params: { slug: slug || String(id) } }}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {title}
          </Link>
        </Heading>
        {excerpt ? (
          <p lang={lang} className="mt-3 line-clamp-3 leading-relaxed text-slate-500">
            {excerpt}
          </p>
        ) : null}
      </div>
    </article>
  )
}
