import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { CtaBand } from '@/components/sections/CtaBand'
import { FeatureSplit } from '@/components/sections/FeatureSplit'
import { PageHero } from '@/components/sections/PageHero'
import { buttonClasses } from '@/components/ui/button'
import { GetTheApp } from '@/components/ui/GetTheApp'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { pageMetadata, pathsFor } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const t = await getTranslations({ locale, namespace: 'buildingsPage' })
  return pageMetadata({
    locale,
    title: t('metaTitle'),
    description: t('metaDescription'),
    paths: pathsFor('/buildings'),
  })
}

type Step = { title: string; body: string }

// For residences, estates and property managers (PLAN.md §6, FR-PG-04): what managers and
// residents get, how to start, and a contact for larger sites.
export default async function BuildingsPage({ params }: Props) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const [t, cta] = await Promise.all([getTranslations('buildingsPage'), getTranslations('ctaBand')])
  const steps = t.raw('steps.items') as Step[]

  return (
    <main id="main">
      <PageHero
        breadcrumbs={[{ label: t('eyebrow'), href: '/buildings' }]}
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
      >
        <GetTheApp label={cta('book')} size="lg" />
        <Link href="/contact" className={buttonClasses({ variant: 'secondary', size: 'lg' })}>
          {t('contact')}
        </Link>
      </PageHero>

      <FeatureSplit
        id="audiences"
        columns={[
          { title: t('managers.title'), points: t.raw('managers.points') as string[] },
          { title: t('residents.title'), points: t.raw('residents.points') as string[] },
        ]}
      />

      <section aria-labelledby="steps-title" className="bg-mist-50 py-16 md:py-24">
        <div className="container-site">
          <h2 id="steps-title" className="text-3xl font-bold text-teal-700 sm:text-4xl">
            {t('steps.title')}
          </h2>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map(({ title, body }, index) => (
              <li key={title} className="rounded-panel bg-white p-6 ring-1 ring-mist-200">
                <span
                  aria-hidden
                  className="grid size-10 place-items-center rounded-full bg-gold-500 font-display font-bold text-night-900"
                >
                  {index + 1}
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-teal-700">{title}</h3>
                <p className="mt-2 leading-relaxed text-slate-500">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CtaBand
        title={t('ctaTitle')}
        body={t('ctaBody')}
        secondary={{ label: t('contact'), href: '/contact' }}
      />
    </main>
  )
}
