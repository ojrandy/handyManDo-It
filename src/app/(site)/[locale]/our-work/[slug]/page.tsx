import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import type { Metadata } from 'next'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { CtaBand } from '@/components/sections/CtaBand'
import { PageHero } from '@/components/sections/PageHero'
import { BeforeAfter } from '@/components/ui/BeforeAfter'
import { CmsImage } from '@/components/ui/CmsImage'
import { JsonLd } from '@/components/ui/JsonLd'
import { ProjectCard } from '@/components/ui/ProjectCard'
import { Prose } from '@/components/ui/Prose'
import { getPathname, Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { docPaths, getProject, getProjects } from '@/lib/catalog'
import { asMedia, imageSources } from '@/lib/media'
import { absoluteUrl, pageMetadata } from '@/lib/seo'
import { site } from '@/lib/site'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const projects = await getProjects(params.locale as Locale)
  return projects.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const project = await getProject(locale as Locale, slug)
  if (!project) return {}
  const title = project.meta?.title || project.title
  const description =
    project.meta?.description ||
    (project.story ? convertLexicalToPlaintext({ data: project.story }).trim().slice(0, 160) : '')
  const paths = await docPaths('projects', project.id)
  if (!paths) return { title, description }
  return pageMetadata({ locale: locale as Locale, title, description, paths })
}

// Case study (PLAN.md §6, FR-PG-07): cover, facts, story, before/after slider when both photos
// exist, gallery, more projects and the quote CTA.
export default async function ProjectPage({ params }: Props) {
  const { locale: param, slug } = await params
  const locale = param as Locale
  setRequestLocale(locale)

  const project = await getProject(locale, slug)
  if (!project) notFound()

  const [t, format, all] = await Promise.all([
    getTranslations('workPage'),
    getFormatter(),
    getProjects(locale),
  ])

  const cover = asMedia(project.cover)
  const service = typeof project.service === 'object' ? project.service : null
  const before = asMedia(project.beforeAfter?.before)
  const after = asMedia(project.beforeAfter?.after)
  const gallery = (project.gallery ?? []).flatMap((item) => {
    const media = asMedia(item)
    return media ? [media] : []
  })
  const serviceKey = (value: typeof project.service) =>
    typeof value === 'object' ? value.id : value
  // Same service first, then the rest.
  const more = [
    ...all.filter(
      (p) => p.id !== project.id && serviceKey(p.service) === serviceKey(project.service),
    ),
    ...all.filter(
      (p) => p.id !== project.id && serviceKey(p.service) !== serviceKey(project.service),
    ),
  ].slice(0, 3)

  const facts = [
    service
      ? {
          label: t('detail.service'),
          value: (
            <Link
              href={{ pathname: '/services/[slug]', params: { slug: service.slug } }}
              className="text-teal-600 underline underline-offset-4"
            >
              {service.title}
            </Link>
          ),
        }
      : null,
    project.client ? { label: t('detail.client'), value: project.client } : null,
    project.city ? { label: t('detail.city'), value: project.city } : null,
    project.date
      ? {
          label: t('detail.date'),
          value: format.dateTime(new Date(project.date), { month: 'long', year: 'numeric' }),
        }
      : null,
  ].filter((fact) => fact !== null)

  return (
    <main id="main">
      <PageHero
        breadcrumbs={[
          { label: t('eyebrow'), href: '/our-work' },
          { label: project.title, href: { pathname: '/our-work/[slug]', params: { slug } } },
        ]}
        eyebrow={service?.title ?? t('eyebrow')}
        title={project.title}
        image={cover ? { sources: imageSources(cover), alt: cover.alt } : undefined}
      />

      <section aria-labelledby="facts-title" className="bg-white py-16 md:py-24">
        <div className="container-site grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 id="facts-title" className="sr-only">
              {t('detail.facts')}
            </h2>
            <dl className="divide-y divide-mist-200 rounded-panel bg-mist-50 px-6 ring-1 ring-mist-200">
              {facts.map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-6 py-4">
                  <dt className="text-sm font-semibold text-slate-500">{label}</dt>
                  <dd className="text-right font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>{project.story ? <Prose data={project.story} /> : null}</div>
        </div>
      </section>

      {before && after ? (
        <section aria-labelledby="before-after-title" className="bg-mist-50 py-16 md:py-24">
          <div className="container-site max-w-5xl">
            <h2 id="before-after-title" className="mb-8 text-3xl font-bold text-teal-700">
              {t('detail.beforeAfter')}
            </h2>
            <BeforeAfter
              before={{ sources: imageSources(before), alt: before.alt }}
              after={{ sources: imageSources(after), alt: after.alt }}
              labels={{
                before: t('detail.before'),
                after: t('detail.after'),
                compare: t('detail.compare'),
              }}
            />
          </div>
        </section>
      ) : null}

      {gallery.length ? (
        <section aria-labelledby="photos-title" className="bg-white pb-16 md:pb-24">
          <div className="container-site">
            <h2 id="photos-title" className="mb-8 text-3xl font-bold text-teal-700">
              {t('detail.photos')}
            </h2>
            <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {gallery.map((media) => (
                <li key={media.id} className="mb-4 break-inside-avoid">
                  <CmsImage
                    sources={imageSources(media)}
                    alt={media.alt}
                    width={media.width ?? 750}
                    height={media.height ?? 500}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="h-auto w-full rounded-card"
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {more.length ? (
        <section aria-labelledby="more-title" className="bg-mist-50 py-16 md:py-24">
          <div className="container-site">
            <h2 id="more-title" className="mb-10 text-3xl font-bold text-teal-700 sm:text-4xl">
              {t('detail.more')}
            </h2>
            <ul className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((other) => (
                <li key={other.id}>
                  <ProjectCard project={other} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <CtaBand title={t('detail.ctaTitle')} body={t('detail.ctaBody')} />

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: project.title,
          url: absoluteUrl(
            getPathname({ locale, href: { pathname: '/our-work/[slug]', params: { slug } } }),
          ),
          ...(cover?.url ? { image: absoluteUrl(cover.url) } : {}),
          creator: { '@type': 'Organization', name: site.name, url: site.url },
          ...(project.city ? { locationCreated: { '@type': 'Place', name: project.city } } : {}),
        }}
      />
    </main>
  )
}
