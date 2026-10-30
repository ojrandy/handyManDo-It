import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import type { Metadata } from 'next'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { SiteForm } from '@/components/forms/SiteForm'
import { PageHero } from '@/components/sections/PageHero'
import { JsonLd } from '@/components/ui/JsonLd'
import { Prose } from '@/components/ui/Prose'
import { getPathname, Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { docPaths, getJob, getJobs } from '@/lib/catalog'
import { absoluteUrl, pageMetadata } from '@/lib/seo'
import { site } from '@/lib/site'

type Props = { params: Promise<{ locale: string; slug: string }> }

// New roles render on first visit after publishing (the `jobs` tag purges the list); no
// redeploy needed.
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const jobs = await getJobs(params.locale as Locale)
  return jobs.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const job = await getJob(locale as Locale, slug)
  if (!job) return {}
  const description = convertLexicalToPlaintext({ data: job.description }).trim().slice(0, 160)
  const paths = await docPaths('jobs', job.id)
  if (!paths) return { title: job.title, description }
  return pageMetadata({ locale: locale as Locale, title: job.title, description, paths })
}

const employmentType = {
  'full-time': 'FULL_TIME',
  'part-time': 'PART_TIME',
  contract: 'CONTRACTOR',
}

// Role detail + apply form with CV (FR-PG-10). Closed roles keep their page without the form.
// JobPosting structured data only while the role is open (Google drops expired postings).
export default async function JobPage({ params }: Props) {
  const { locale: param, slug } = await params
  const locale = param as Locale
  setRequestLocale(locale)

  const job = await getJob(locale, slug)
  if (!job) notFound()

  const [t, format] = await Promise.all([getTranslations('careersPage'), getFormatter()])
  const facts = [
    { label: t('detail.location'), value: job.location },
    { label: t('detail.type'), value: t(`roles.types.${job.type}`) },
    job.closesAt
      ? {
          label: t('detail.closesAt'),
          value: format.dateTime(new Date(job.closesAt), { dateStyle: 'long' }),
        }
      : null,
  ].filter((fact) => fact !== null)

  return (
    <main id="main">
      <PageHero
        breadcrumbs={[
          { label: t('eyebrow'), href: '/careers' },
          { label: job.title, href: { pathname: '/careers/[slug]', params: { slug } } },
        ]}
        eyebrow={t('eyebrow')}
        title={job.title}
      />

      <section aria-label={job.title} className="bg-white py-16 md:py-24">
        <div className="container-site grid gap-12 lg:grid-cols-[1fr_20rem]">
          <Prose data={job.description} />
          <aside>
            <dl className="space-y-4 rounded-panel bg-mist-50 p-6 ring-1 ring-mist-200">
              {facts.map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-sm font-semibold text-slate-500">{label}</dt>
                  <dd className="mt-1 font-semibold text-teal-700">{value}</dd>
                </div>
              ))}
            </dl>
            <Link
              href="/careers"
              className="mt-6 inline-block font-semibold text-teal-600 underline underline-offset-4"
            >
              {t('detail.back')}
            </Link>
          </aside>
        </div>
      </section>

      <section
        id="apply"
        aria-labelledby="apply-title"
        className="scroll-mt-24 bg-mist-50 py-16 md:py-24"
      >
        <div className="container-site max-w-3xl">
          <h2 id="apply-title" className="text-3xl font-bold text-teal-700 sm:text-4xl">
            {t('detail.applyTitle')}
          </h2>
          {job.open ? (
            <SiteForm type="job" job={job.id} className="mt-8" />
          ) : (
            <p className="mt-4 text-lg text-slate-500">{t('detail.closed')}</p>
          )}
        </div>
      </section>

      {job.open ? (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'JobPosting',
            title: job.title,
            description: convertLexicalToPlaintext({ data: job.description }).trim(),
            datePosted: job.createdAt,
            ...(job.closesAt ? { validThrough: job.closesAt } : {}),
            employmentType: employmentType[job.type],
            hiringOrganization: { '@type': 'Organization', name: site.name, sameAs: site.url },
            jobLocation: {
              '@type': 'Place',
              address: {
                '@type': 'PostalAddress',
                addressLocality: job.location,
                addressCountry: 'CM',
              },
            },
            url: absoluteUrl(
              getPathname({ locale, href: { pathname: '/careers/[slug]', params: { slug } } }),
            ),
          }}
        />
      ) : null}
    </main>
  )
}
