import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { CtaBand } from '@/components/sections/CtaBand'
import { PageHero } from '@/components/sections/PageHero'
import { FilterableGrid } from '@/components/ui/FilterableGrid'
import { ProjectCard } from '@/components/ui/ProjectCard'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getProjects, getServices } from '@/lib/catalog'
import { pageMetadata, pathsFor } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const t = await getTranslations({ locale, namespace: 'workPage' })
  return pageMetadata({
    locale,
    title: t('metaTitle'),
    description: t('metaDescription'),
    paths: pathsFor('/our-work'),
  })
}

const serviceId = (service: number | { id: number }) =>
  typeof service === 'object' ? service.id : service

// Portfolio (PLAN.md §6, FR-PG-07): masonry of published projects, filterable by service and,
// once editors add cities, by city.
export default async function OurWorkPage({ params }: Props) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const [t, nav, projects, services] = await Promise.all([
    getTranslations('workPage'),
    getTranslations('nav'),
    getProjects(locale),
    getServices(locale),
  ])
  const cities = [...new Set(projects.flatMap(({ city }) => (city ? [city] : [])))].sort()

  return (
    <main id="main">
      <PageHero
        breadcrumbs={[{ label: t('eyebrow'), href: '/our-work' }]}
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
      />

      <div className="bg-mist-50 py-16 md:py-24">
        <div className="container-site">
          {projects.length ? (
            <FilterableGrid
              namespace="workPage.filter"
              listClassName="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>li]:mb-5"
              groups={[
                {
                  key: 'service',
                  label: t('filter.label'),
                  options: services.map(({ id, title }) => ({ value: String(id), label: title })),
                },
                {
                  key: 'city',
                  label: t('cities'),
                  options: cities.map((city) => ({ value: city, label: city })),
                },
              ]}
              items={projects.map((project) => ({
                id: String(project.id),
                tags: { service: String(serviceId(project.service)), city: project.city ?? null },
                node: <ProjectCard project={project} />,
              }))}
            />
          ) : (
            <p className="text-lg text-slate-500">
              {t('empty')}{' '}
              <Link href="/services" className="font-semibold text-teal-600 underline">
                {nav('services')}
              </Link>
            </p>
          )}
        </div>
      </div>

      <CtaBand />
    </main>
  )
}
