import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { SiteForm } from '@/components/forms/SiteForm'
import { CardGrid } from '@/components/sections/CardGrid'
import { PageHero } from '@/components/sections/PageHero'
import { TrustedBy } from '@/components/sections/TrustedBy'
import { buttonClasses } from '@/components/ui/button'
import { ProjectCard } from '@/components/ui/ProjectCard'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getProjects, getServices } from '@/lib/catalog'
import { pageMetadata, pathsFor } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

type Item = { title: string; body: string }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const t = await getTranslations({ locale, namespace: 'businessesPage' })
  return pageMetadata({
    locale,
    title: t('metaTitle'),
    description: t('metaDescription'),
    paths: pathsFor('/businesses'),
  })
}

// For organisations (PLAN.md §6, FR-PG-03): what they get, work done for clients (projects that
// name a client), partner logos and the B2B quote form.
export default async function BusinessesPage({ params }: Props) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const [t, projects, services] = await Promise.all([
    getTranslations('businessesPage'),
    getProjects(locale),
    getServices(locale),
  ])
  const clientWork = projects.filter((project) => project.client).slice(0, 3)

  return (
    <main id="main">
      <PageHero
        breadcrumbs={[{ label: t('eyebrow'), href: '/businesses' }]}
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
      >
        <a href="#quote" className={buttonClasses({ size: 'lg' })}>
          {t('quoteCta')}
          <ArrowRight aria-hidden className="size-5" />
        </a>
      </PageHero>

      <CardGrid
        id="features-title"
        title={t('features.title')}
        items={t.raw('features.items') as Item[]}
        columns={4}
      />

      {clientWork.length ? (
        <section aria-labelledby="work-title" className="bg-mist-50 py-16 md:py-24">
          <div className="container-site">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <h2 id="work-title" className="text-3xl font-bold text-teal-700 sm:text-4xl">
                  {t('work.title')}
                </h2>
                <p className="mt-4 text-lg text-slate-500">{t('work.body')}</p>
              </div>
              <Link href="/our-work" className={buttonClasses({ variant: 'outline' })}>
                {t('work.all')}
              </Link>
            </div>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {clientWork.map((project) => (
                <li key={project.id}>
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <TrustedBy />

      <section
        id="quote"
        aria-labelledby="quote-title"
        className="scroll-mt-24 bg-mist-50 py-16 md:py-24"
      >
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 id="quote-title" className="text-3xl font-bold text-teal-700 sm:text-4xl">
              {t('quote.title')}
            </h2>
            <p className="mt-4 text-lg text-slate-500">{t('quote.body')}</p>
          </div>
          <SiteForm type="quote-business" services={services.map(({ title }) => title)} />
        </div>
      </section>
    </main>
  )
}
