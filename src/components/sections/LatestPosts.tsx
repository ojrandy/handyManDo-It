import { ArrowRight } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'

import { PostCard } from '@/components/ui/PostCard'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getTranslatedPostIds } from '@/lib/blog'
import { getHome, getLatestPosts, pick } from '@/lib/home'

// Latest from the blog (docs/PLAN.md §5.16, FR-HOME-16): the three newest published posts.
// Hidden while there are none (fresh database).
export async function LatestPosts() {
  const locale = (await getLocale()) as Locale
  const [t, home, posts, translated] = await Promise.all([
    getTranslations('blog'),
    getHome(locale),
    getLatestPosts(locale),
    getTranslatedPostIds(locale),
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
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} englishOnly={locale !== 'en' && !translated.has(post.id)} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
