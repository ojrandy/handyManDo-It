import { ArrowRight, CheckCircle2 } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { SiteForm } from '@/components/forms/SiteForm'
import { CardGrid } from '@/components/sections/CardGrid'
import { PageHero } from '@/components/sections/PageHero'
import { buttonClasses } from '@/components/ui/button'
import { GetTheApp } from '@/components/ui/GetTheApp'
import type { Locale } from '@/i18n/routing'
import { pageMetadata, pathsFor } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

type Item = { title: string; body: string }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const t = await getTranslations({ locale, namespace: 'proPage' })
  return pageMetadata({
    locale,
    title: t('metaTitle'),
    description: t('metaDescription'),
    paths: pathsFor('/become-a-pro'),
  })
}

// Pros, sellers and kitchens (PLAN.md §6, FR-PG-06): same app as customers ("I offer
// services"). Benefits, requirements, 4-step onboarding, payouts, application form. No pro
// testimonials yet: none were collected, and invented ones would break trust.
export default async function BecomeAProPage({ params }: Props) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const [t, earn] = await Promise.all([getTranslations('proPage'), getTranslations('earn')])

  return (
    <main id="main">
      <PageHero
        breadcrumbs={[{ label: t('eyebrow'), href: '/become-a-pro' }]}
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
      >
        <GetTheApp label={earn('cta')} size="lg" />
        <a href="#apply" className={buttonClasses({ variant: 'secondary', size: 'lg' })}>
          {t('applyCta')}
          <ArrowRight aria-hidden className="size-5" />
        </a>
      </PageHero>

      <CardGrid
        id="benefits-title"
        title={t('benefits.title')}
        items={t.raw('benefits.items') as Item[]}
        columns={4}
      />

      <section aria-labelledby="requirements-title" className="bg-mist-50 py-16 md:py-24">
        <div className="container-site grid gap-10 lg:grid-cols-2">
          <div>
            <h2 id="requirements-title" className="text-3xl font-bold text-teal-700 sm:text-4xl">
              {t('requirements.title')}
            </h2>
            <p className="mt-4 text-lg text-slate-500">{t('requirements.body')}</p>
            <ul className="mt-8 space-y-3">
              {(t.raw('requirements.items') as string[]).map((item) => (
                <li key={item} className="flex items-start gap-3 text-ink">
                  <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-teal-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-panel bg-night-900 p-8 text-white">
            <h2 id="payouts-title" className="text-2xl font-bold sm:text-3xl">
              {t('payouts.title')}
            </h2>
            <ol className="mt-6 space-y-5">
              {(t.raw('payouts.items') as string[]).map((item, index) => (
                <li key={item} className="flex gap-4">
                  <span
                    aria-hidden
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-gold-500 font-display font-bold text-night-900"
                  >
                    {index + 1}
                  </span>
                  <p className="leading-relaxed text-white/80">{item}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <CardGrid
        id="steps-title"
        title={t('steps.title')}
        items={t.raw('steps.items') as Item[]}
        numbered
        columns={4}
      />

      <section
        id="apply"
        aria-labelledby="apply-title"
        className="scroll-mt-24 bg-mist-50 py-16 md:py-24"
      >
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 id="apply-title" className="text-3xl font-bold text-teal-700 sm:text-4xl">
              {t('form.title')}
            </h2>
            <p className="mt-4 text-lg text-slate-500">{t('form.body')}</p>
            <div className="mt-10 rounded-panel bg-white p-6 ring-1 ring-mist-200">
              <h3 className="font-display text-lg font-semibold text-teal-700">{t('app.title')}</h3>
              <p className="mt-2 text-slate-500">{t('app.body')}</p>
            </div>
          </div>
          <SiteForm type="pro" />
        </div>
      </section>
    </main>
  )
}
