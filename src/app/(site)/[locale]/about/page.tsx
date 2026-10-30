import { ArrowUpRight, BadgeCheck, Clock, Handshake } from 'lucide-react'
import type { Metadata } from 'next'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'

import { CtaBand } from '@/components/sections/CtaBand'
import { PageHero } from '@/components/sections/PageHero'
import { CmsImage } from '@/components/ui/CmsImage'
import { SectionHeading } from '@/components/ui/SectionHeading'
import type { Locale } from '@/i18n/routing'
import { getTeam } from '@/lib/catalog'
import { getPartners } from '@/lib/home'
import { asMedia, imageSources } from '@/lib/media'
import { pageMetadata, pathsFor } from '@/lib/seo'
import { getSiteSettings } from '@/lib/settings'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const [t, settings] = await Promise.all([
    getTranslations({ locale, namespace: 'aboutPage' }),
    getSiteSettings(locale),
  ])
  return pageMetadata({
    locale,
    title: t('metaTitle'),
    description: t('metaDescription', { years: settings.stats.years }),
    paths: pathsFor('/about'),
  })
}

// The three brand values, as on the home page (Pillars).
const values = [
  ['punctual', Clock],
  ['polite', Handshake],
  ['professional', BadgeCheck],
] as const

const affiliates = ['webSpectron', 'kukwa', 'augma'] as const
const csrAreas = ['environment', 'community', 'workplace', 'ethics'] as const

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((part) => /^[A-Za-z]/.test(part))
    .slice(0, 2)
    .map((part) => part[0])
    .join('')

// About (PLAN.md §6, FR-PG-09): story, mission, values, numbers, team, partners (#partners) and
// the CSR policy (#csr). Copy from the old site's company, affiliations and CSR pages.
export default async function AboutPage({ params }: Props) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const [t, pillars, numbers, format, settings, team, partners] = await Promise.all([
    getTranslations('aboutPage'),
    getTranslations('pillars'),
    getTranslations('numbers'),
    getFormatter(),
    getSiteSettings(locale),
    getTeam(locale),
    getPartners(locale),
  ])
  const { stats } = settings

  return (
    <main id="main">
      <PageHero
        breadcrumbs={[{ label: t('eyebrow'), href: '/about' }]}
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead', { years: stats.years })}
      />

      <section aria-labelledby="story-title" className="bg-white py-16 md:py-24">
        <div className="container-site grid gap-12 lg:grid-cols-2">
          <div>
            <h2 id="story-title" className="text-3xl font-bold text-teal-700 sm:text-4xl">
              {t('story.title')}
            </h2>
            {[0, 1].map((index) => (
              <p key={index} className="mt-5 text-lg leading-relaxed text-slate-500">
                {t(`story.body.${index}`, { towns: stats.towns })}
              </p>
            ))}
          </div>
          <div className="self-start rounded-panel bg-night-900 p-8 text-white md:p-10">
            <h2 className="text-2xl font-bold text-gold-300">{t('mission.title')}</h2>
            <p className="mt-4 text-lg leading-relaxed text-white/85">{t('mission.body')}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="values-title" className="bg-mist-50 py-16 md:py-24">
        <div className="container-site">
          <h2 id="values-title" className="text-3xl font-bold text-teal-700 sm:text-4xl">
            {t('values.title')}
          </h2>
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {values.map(([key, Icon]) => (
              <li key={key} className="rounded-panel bg-white p-7 ring-1 ring-mist-200">
                <span className="grid size-11 place-items-center rounded-card bg-gold-500 text-night-900">
                  <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold text-teal-700">
                  {pillars(`values.${key}.title`)}
                </h3>
                <p className="mt-2 leading-relaxed text-slate-500">
                  {pillars(`values.${key}.body`)}
                </p>
              </li>
            ))}
          </ul>

          <h2 className="sr-only">{t('numbers.title')}</h2>
          <dl className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {(['years', 'projects', 'clients', 'towns'] as const).map((key) => (
              <div key={key} className="rounded-panel bg-teal-600 p-6 text-white">
                <dt className="text-sm text-white/75">{numbers(`stats.${key}`)}</dt>
                <dd className="mt-2 font-display text-4xl font-bold">
                  {format.number(stats[key])}+
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {team.length ? (
        <section aria-labelledby="team-title" className="bg-white py-16 md:py-24">
          <div className="container-site">
            <SectionHeading
              id="team-title"
              eyebrow={t('eyebrow')}
              title={t('team.title')}
              intro={t('team.intro')}
            />
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {team.map(({ id, name, role, photo, bio }) => {
                const media = asMedia(photo)
                return (
                  <li key={id} className="rounded-panel bg-mist-50 p-6 ring-1 ring-mist-200">
                    {media ? (
                      <CmsImage
                        sources={imageSources(media)}
                        alt={media.alt}
                        width={96}
                        height={96}
                        sizes="96px"
                        className="size-24 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="grid size-24 place-items-center rounded-full bg-teal-600 font-display text-2xl font-bold text-white"
                      >
                        {initials(name)}
                      </span>
                    )}
                    <h3 className="mt-5 font-display text-xl font-semibold text-teal-700">
                      {name}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-gold-500">{role}</p>
                    {bio ? <p className="mt-3 leading-relaxed text-slate-500">{bio}</p> : null}
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      ) : null}

      <section
        id="partners"
        aria-labelledby="partners-title"
        className="scroll-mt-24 bg-mist-50 py-16 md:py-24"
      >
        <div className="container-site">
          <h2 id="partners-title" className="text-3xl font-bold text-teal-700 sm:text-4xl">
            {t('partners.title')}
          </h2>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <div className="rounded-panel bg-white p-7 ring-1 ring-mist-200">
              <p className="text-sm font-semibold tracking-[0.2em] text-teal-600 uppercase">
                {t('partners.parentLabel')}
              </p>
              <h3 className="mt-3 font-display text-2xl font-semibold text-teal-700">
                {t('partners.parentName')}
              </h3>
              <p className="mt-3 leading-relaxed text-slate-500">{t('partners.parentBody')}</p>
            </div>
            <div className="rounded-panel bg-white p-7 ring-1 ring-mist-200">
              <p className="text-sm font-semibold tracking-[0.2em] text-teal-600 uppercase">
                {t('partners.affiliatesLabel')}
              </p>
              <ul className="mt-4 space-y-3">
                {affiliates.map((key) => (
                  <li key={key} className="leading-relaxed text-ink">
                    {t(`partners.affiliates.${key}`)}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {partners.length ? (
            <>
              <h3 className="mt-12 font-display text-lg font-semibold text-teal-700">
                {t('partners.logosLabel')}
              </h3>
              <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {partners.map(({ id, name, logo, url }) => {
                  const media = asMedia(logo)
                  if (!media) return null
                  const image = (
                    <CmsImage
                      sources={imageSources(media)}
                      alt={name}
                      width={media.width ?? 300}
                      height={media.height ?? 300}
                      sizes="(min-width: 640px) 25vw, 50vw"
                      className="mx-auto h-20 w-auto object-contain"
                    />
                  )
                  return (
                    <li key={id}>
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={t('partners.visit', { name })}
                          className="group flex h-full items-center justify-center rounded-panel bg-white p-5 ring-1 ring-mist-200 transition-shadow hover:shadow-float"
                        >
                          {image}
                          <ArrowUpRight
                            aria-hidden
                            className="ml-1 size-4 shrink-0 text-teal-600"
                          />
                        </a>
                      ) : (
                        <div className="flex h-full items-center justify-center rounded-panel bg-white p-5 ring-1 ring-mist-200">
                          {image}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </>
          ) : null}
        </div>
      </section>

      <section
        id="csr"
        aria-labelledby="csr-title"
        className="scroll-mt-24 bg-white py-16 md:py-24"
      >
        <div className="container-site">
          <SectionHeading
            id="csr-title"
            eyebrow={t('eyebrow')}
            title={t('csr.title')}
            intro={t('csr.intro')}
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {csrAreas.map((area) => (
              <div key={area} className="rounded-panel bg-mist-50 p-6 ring-1 ring-mist-200">
                <h3 className="font-display text-lg font-semibold text-teal-700">
                  {t(`csr.areas.${area}.title`)}
                </h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-500">
                  {[0, 1, 2].map((index) => (
                    <li key={index}>{t(`csr.areas.${area}.points.${index}`)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-3xl leading-relaxed text-slate-500">{t('csr.governance')}</p>
        </div>
      </section>

      <CtaBand />
    </main>
  )
}
