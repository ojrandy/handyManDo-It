import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { PageHero } from '@/components/sections/PageHero'
import { BlogList } from '@/components/ui/BlogList'
import { PostCard } from '@/components/ui/PostCard'
import type { Locale } from '@/i18n/routing'
import { getCategories, getPosts, getTranslatedPostIds } from '@/lib/blog'
import { pageMetadata, pathsFor } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const t = await getTranslations({ locale, namespace: 'blogPage' })
  return pageMetadata({
    locale,
    title: t('metaTitle'),
    description: t('metaDescription'),
    paths: pathsFor('/blog'),
  })
}

// Blog index (PLAN.md §6, FR-PG-11): every published post, with search and category filters
// that run in the browser over the pre-rendered list (ADR-024).
export default async function BlogPage({ params }: Props) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const [t, posts, categories, translated] = await Promise.all([
    getTranslations('blogPage'),
    getPosts(locale),
    getCategories(locale),
    getTranslatedPostIds(locale),
  ])
  const names = new Map(categories.map(({ id, title }) => [id, title]))

  return (
    <main id="main">
      <PageHero
        breadcrumbs={[{ label: t('eyebrow'), href: '/blog' }]}
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
      />

      <section aria-labelledby="page-title" className="bg-mist-50 py-16 md:py-24">
        <div className="container-site">
          {posts.length ? (
            <BlogList
              categories={categories.map(({ id, title }) => ({ value: String(id), label: title }))}
              items={posts.map((post) => {
                const ids = (post.categories ?? []).map((category) =>
                  typeof category === 'object' ? category.id : category,
                )
                return {
                  id: String(post.id),
                  text: [post.title, post.excerpt, ...ids.map((id) => names.get(id))]
                    .filter(Boolean)
                    .join(' '),
                  categories: ids.map(String),
                  node: (
                    <PostCard
                      post={post}
                      englishOnly={locale !== 'en' && !translated.has(post.id)}
                      headingLevel="h2"
                    />
                  ),
                }
              })}
            />
          ) : (
            <p className="text-lg text-slate-500">{t('empty')}</p>
          )}
        </div>
      </section>
    </main>
  )
}
