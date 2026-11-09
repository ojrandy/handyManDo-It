import type { MetadataRoute } from 'next'

import { routing, type Locale, type Pathname } from '@/i18n/routing'
import { getTranslatedPostIds, getPosts } from '@/lib/blog'
import { docPaths, getJobs, getProjects, getServices } from '@/lib/catalog'
import { getGlobal } from '@/lib/payload'
import { absoluteUrl, pathsFor, type LocalizedPaths } from '@/lib/seo'

type Entry = MetadataRoute.Sitemap[number]

// One entry per URL, each listing its other-language page (FR-SEO-02, ADR-035). Google reads the
// hreflang pairs from here as well as from the pages. Reads go through the tagged CMS cache, so
// a publish in the CMS refreshes the sitemap like any page (no cron).
function entries(paths: Partial<LocalizedPaths>, lastModified?: string | null): Entry[] {
  const languages: Record<string, string> = {}
  for (const locale of routing.locales) {
    const path = paths[locale]
    if (path) languages[locale] = absoluteUrl(path)
  }
  const fallback = paths[routing.defaultLocale] ?? Object.values(paths)[0]
  if (fallback) languages['x-default'] = absoluteUrl(fallback)
  return routing.locales.flatMap((locale) => {
    const path = paths[locale]
    if (!path) return []
    return [
      {
        url: absoluteUrl(path),
        ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
        alternates: { languages },
      },
    ]
  })
}

type StaticPathname = Exclude<Pathname, `${string}[${string}`>

const staticPages = (Object.keys(routing.pathnames) as Pathname[]).filter(
  (pathname): pathname is StaticPathname => !pathname.includes('['),
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locale: Locale = routing.defaultLocale
  const [home, legal, services, projects, jobs, posts, frenchPosts] = await Promise.all([
    getGlobal('home', locale),
    getGlobal('legal', locale),
    getServices(locale),
    getProjects(locale),
    getJobs(locale),
    getPosts('en'),
    getTranslatedPostIds('fr'),
  ])

  const pageDates: Partial<Record<Pathname, string | null | undefined>> = {
    '/': home.updatedAt,
    '/legal/privacy': legal.updatedAt,
    '/legal/terms': legal.updatedAt,
    '/legal/disclaimer': legal.updatedAt,
  }

  const slugDocs = async (
    collection: 'services' | 'projects' | 'jobs',
    docs: { id: number; updatedAt: string }[],
  ) =>
    (
      await Promise.all(
        docs.map(async (doc) => {
          const paths = await docPaths(collection, doc.id)
          return paths ? entries(paths, doc.updatedAt) : []
        }),
      )
    ).flat()

  return [
    ...staticPages.flatMap((pathname) => entries(pathsFor(pathname), pageDates[pathname])),
    ...(await slugDocs('services', services)),
    ...(await slugDocs('projects', projects)),
    ...(await slugDocs('jobs', jobs)),
    // English-only articles list their English URL only; the French copy points to it.
    ...posts.flatMap((post) => {
      const paths = pathsFor({ pathname: '/blog/[slug]', params: { slug: post.slug } })
      return entries(frenchPosts.has(post.id) ? paths : { en: paths.en }, post.updatedAt)
    }),
  ]
}
