import { ArrowRight } from 'lucide-react'
import { getFormatter, getLocale, getTranslations } from 'next-intl/server'

import { CmsImage } from '@/components/ui/CmsImage'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getHome, getLatestPosts, pick } from '@/lib/home'
import { asMedia, imageSources } from '@/lib/media'

// Latest from the blog (docs/PLAN.md §5.16, FR-HOME-16): the three newest published posts.
// Hidden while there are none (fresh database).
export async function LatestPosts() {
  const locale = (await getLocale()) as Locale
  const [t, format, home, posts] = await Promise.all([
    getTranslations('blog'),
    getFormatter(),
    getHome(locale),
    getLatestPosts(locale),
  ])
  if (!posts.length) return null

  return (
    <section aria-labelledby="blog-title" className="bg-mist-50 py-20 md:py-28">
      <div className="container-site">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            id="blog-title"
            eyebrow={pick(home.blog?.eyebrow, t('eyebrow'))}
            title={pick(home.blog?.title, t('title'))}
          />
          <Link
            href="/blog"
            className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-teal-600 underline-offset-4 hover:underline"
          >
            {t('seeAll')}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {posts.map(({ id, title, slug, excerpt, cover, publishedAt }) => {
            const sources = imageSources(cover)
            return (
              <li
                key={id}
                className="group relative flex flex-col overflow-hidden rounded-panel bg-white shadow-sm ring-1 ring-mist-200 transition-shadow hover:shadow-float"
              >
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
                  {publishedAt ? (
                    <time dateTime={publishedAt} className="text-sm text-slate-500">
                      {format.dateTime(new Date(publishedAt), { dateStyle: 'long' })}
                    </time>
                  ) : null}
                  <h3 className="mt-2 text-xl leading-snug font-bold text-teal-700">
                    {/* The link covers the card; the heading stays its accessible name. */}
                    <Link
                      href={{ pathname: '/blog/[slug]', params: { slug: slug ?? String(id) } }}
                      className="after:absolute after:inset-0 after:content-['']"
                    >
                      {title}
                    </Link>
                  </h3>
                  {excerpt ? (
                    <p className="mt-3 line-clamp-3 leading-relaxed text-slate-500">{excerpt}</p>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
