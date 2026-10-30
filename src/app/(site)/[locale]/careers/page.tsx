import { ArrowRight, Briefcase, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'

import { SiteForm } from '@/components/forms/SiteForm'
import { CardGrid } from '@/components/sections/CardGrid'
import { PageHero } from '@/components/sections/PageHero'
import { buttonClasses } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getJobs } from '@/lib/catalog'
import { pageMetadata, pathsFor } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

type Item = { title: string; body: string }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const t = await getTranslations({ locale, namespace: 'careersPage' })
  return pageMetadata({
    locale,
    title: t('metaTitle'),
    description: t('metaDescription'),
    paths: pathsFor('/careers'),
  })
}

// Careers (PLAN.md §6, FR-PG-10): why join and where people fit (old careers page), roles from
// the `jobs` collection, and an open application with CV for when no role fits.
export default async function CareersPage({ params }: Props) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const [t, format, jobs] = await Promise.all([
    getTranslations('careersPage'),
    getFormatter(),
    getJobs(locale),
  ])

  return (
    <main id="main">
      <PageHero
        breadcrumbs={[{ label: t('eyebrow'), href: '/careers' }]}
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
      >
        <a href="#roles" className={buttonClasses({ size: 'lg' })}>
          {t('roles.title')}
          <ArrowRight aria-hidden className="size-5" />
        </a>
      </PageHero>

      <CardGrid id="why-title" title={t('why.title')} items={t.raw('why.items') as Item[]} />

      <CardGrid
        id="areas-title"
        title={t('areas.title')}
        items={t.raw('areas.items') as Item[]}
        tone="mist"
      />

      <section
        id="roles"
        aria-labelledby="roles-title"
        className="scroll-mt-24 bg-white py-16 md:py-24"
      >
        <div className="container-site">
          <h2 id="roles-title" className="text-3xl font-bold text-teal-700 sm:text-4xl">
            {t('roles.title')}
          </h2>
          {jobs.length ? (
            <ul className="mt-10 grid gap-4">
              {jobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={{ pathname: '/careers/[slug]', params: { slug: job.slug } }}
                    className="group flex flex-wrap items-center justify-between gap-4 rounded-panel bg-mist-50 p-6 ring-1 ring-mist-200 transition-shadow hover:shadow-float"
                  >
                    <span>
                      <span className="block font-display text-xl font-semibold text-teal-700">
                        {job.title}
                      </span>
                      <span className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin aria-hidden className="size-4" />
                          {job.location}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Briefcase aria-hidden className="size-4" />
                          {t(`roles.types.${job.type}`)}
                        </span>
                        {!job.open ? (
                          <span className="font-semibold">{t('roles.closed')}</span>
                        ) : job.closesAt ? (
                          <span>
                            {t('roles.closes', {
                              date: format.dateTime(new Date(job.closesAt), { dateStyle: 'long' }),
                            })}
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-2 font-semibold text-teal-600">
                      {t('roles.view')}
                      <ArrowRight
                        aria-hidden
                        className="size-4 transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 max-w-2xl text-lg text-slate-500">{t('roles.empty')}</p>
          )}
        </div>
      </section>

      <section
        id="apply"
        aria-labelledby="apply-title"
        className="scroll-mt-24 bg-mist-50 py-16 md:py-24"
      >
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 id="apply-title" className="text-3xl font-bold text-teal-700 sm:text-4xl">
              {t('apply.title')}
            </h2>
            <p className="mt-4 text-lg text-slate-500">{t('apply.body')}</p>
          </div>
          <SiteForm type="job" />
        </div>
      </section>
    </main>
  )
}
