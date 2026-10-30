import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import type { Metadata } from 'next'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { CtaBand } from '@/components/sections/CtaBand'
import { PageHero } from '@/components/sections/PageHero'
import { JsonLd } from '@/components/ui/JsonLd'
import { PostCard } from '@/components/ui/PostCard'
import { Prose } from '@/components/ui/Prose'
import { getPathname, Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getPost, getPosts, getTranslatedPostIds, relatedPosts } from '@/lib/blog'
import { asMedia, imageSources, mediaUrl } from '@/lib/media'
import { absoluteUrl, pageMetadata, pathsFor } from '@/lib/seo'
import { site } from '@/lib/site'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const posts = await getPosts(params.locale as Locale)
  return posts.map(({ slug }) => ({ slug }))
}

const summary = (post: {
  excerpt?: string | null
  content: Parameters<typeof convertLexicalToPlaintext>[0]['data']
}) => post.excerpt?.trim() || convertLexicalToPlaintext({ data: post.content }).trim().slice(0, 160)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const post = await getPost(locale as Locale, slug)
  if (!post) return {}
  return pageMetadata({
    locale: locale as Locale,
    title: post.meta?.title || post.title,
    description: post.meta?.description || summary(post),
    // One slug for both languages (posts share it).
    paths: pathsFor({ pathname: '/blog/[slug]', params: { slug } }),
  })
}

// Article (PLAN.md §6, FR-PG-11): cover, date, categories, content, related posts and Article
// structured data. English-only posts on French pages carry `lang="en"` and a note (ADR-019).
export default async function PostPage({ params }: Props) {
  const { locale: param, slug } = await params
  const locale = param as Locale
  setRequestLocale(locale)

  const post = await getPost(locale, slug)
  if (!post) notFound()

  const [t, format, all, translated] = await Promise.all([
    getTranslations('blogPage'),
    getFormatter(),
    getPosts(locale),
    getTranslatedPostIds(locale),
  ])
  const englishOnly = locale !== 'en' && !translated.has(post.id)
  const lang = englishOnly ? 'en' : undefined
  const cover = asMedia(post.cover)
  const categories = (post.categories ?? []).filter((category) => typeof category === 'object')
  const related = relatedPosts(post, all)
  const url = absoluteUrl(
    getPathname({ locale, href: { pathname: '/blog/[slug]', params: { slug } } }),
  )
  const image = mediaUrl(cover)

  return (
    <main id="main">
      <PageHero
        breadcrumbs={[
          { label: t('eyebrow'), href: '/blog' },
          { label: post.title, href: { pathname: '/blog/[slug]', params: { slug } } },
        ]}
        eyebrow={categories.map(({ title }) => title).join(' · ') || t('eyebrow')}
        title={post.title}
        titleLang={lang}
        image={cover ? { sources: imageSources(cover), alt: cover.alt ?? '' } : undefined}
      >
        {post.publishedAt ? (
          <p className="text-white/70">
            <time dateTime={post.publishedAt}>
              {t('detail.published', {
                date: format.dateTime(new Date(post.publishedAt), { dateStyle: 'long' }),
              })}
            </time>
          </p>
        ) : null}
      </PageHero>

      <article aria-labelledby="page-title" className="bg-white py-16 md:py-24">
        <div className="container-site max-w-3xl">
          {englishOnly ? (
            <p className="mb-8 rounded-xl bg-mist-100 px-4 py-3 text-sm font-medium text-teal-700">
              {t('detail.englishOnly')}
            </p>
          ) : null}
          <div lang={lang}>
            <Prose data={post.content} />
          </div>
          <Link
            href="/blog"
            className="mt-12 inline-block font-semibold text-teal-600 underline underline-offset-4"
          >
            {t('detail.back')}
          </Link>
        </div>
      </article>

      {related.length ? (
        <section aria-labelledby="related-title" className="bg-mist-50 py-16 md:py-24">
          <div className="container-site">
            <h2 id="related-title" className="text-3xl font-bold text-teal-700 sm:text-4xl">
              {t('detail.related')}
            </h2>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((other) => (
                <li key={other.id}>
                  <PostCard
                    post={other}
                    englishOnly={locale !== 'en' && !translated.has(other.id)}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <CtaBand title={t('detail.share')} body={t('detail.shareBody')} />

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: summary(post),
          ...(image ? { image: [image] } : {}),
          ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
          dateModified: post.updatedAt,
          inLanguage: englishOnly ? 'en' : locale,
          // Authors' user records are private, so articles credit the company.
          author: { '@type': 'Organization', name: site.name, url: site.url },
          publisher: {
            '@type': 'Organization',
            name: site.name,
            logo: { '@type': 'ImageObject', url: absoluteUrl('/icons/icon-512.png') },
          },
          mainEntityOfPage: url,
        }}
      />
    </main>
  )
}
