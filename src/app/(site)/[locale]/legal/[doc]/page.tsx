import type { Metadata } from 'next'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { PageHero } from '@/components/sections/PageHero'
import { Prose } from '@/components/ui/Prose'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getGlobal } from '@/lib/payload'
import { pageMetadata, pathsFor } from '@/lib/seo'
import { getSiteSettings } from '@/lib/settings'

type Doc = 'privacy' | 'terms' | 'disclaimer'
type Props = { params: Promise<{ locale: string; doc: string }> }

const hrefs = {
  privacy: '/legal/privacy',
  terms: '/legal/terms',
  disclaimer: '/legal/disclaimer',
} as const satisfies Record<Doc, string>

const docs = Object.keys(hrefs) as Doc[]
const isDoc = (value: string): value is Doc => (docs as string[]).includes(value)

// Only the three pages; anything else under /legal is a 404.
export const dynamicParams = false

export function generateStaticParams() {
  return docs.map((doc) => ({ doc }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, doc } = await params
  if (!isDoc(doc)) return {}
  const t = await getTranslations({ locale, namespace: `legalPage.${doc}` })
  return pageMetadata({
    locale: locale as Locale,
    title: t('metaTitle'),
    description: t('metaDescription'),
    paths: pathsFor(hrefs[doc]),
  })
}

// Privacy, terms and disclaimer (PLAN.md §4, FR-PG-15): editor text from the `legal` global
// (ADR-022), last-updated date, and links to the other two.
export default async function LegalPage({ params }: Props) {
  const { locale: param, doc } = await params
  const locale = param as Locale
  if (!isDoc(doc)) notFound()
  setRequestLocale(locale)

  const [t, format, legal, settings] = await Promise.all([
    getTranslations('legalPage'),
    getFormatter(),
    getGlobal('legal', locale),
    getSiteSettings(locale),
  ])
  const page = legal[doc]
  if (!page?.content) notFound()

  return (
    <main id="main">
      <PageHero
        breadcrumbs={[{ label: t(`${doc}.title`), href: hrefs[doc] }]}
        eyebrow={t('eyebrow')}
        title={t(`${doc}.title`)}
      >
        {page.lastUpdated ? (
          <p className="text-white/70">
            {t('updated', {
              date: format.dateTime(new Date(page.lastUpdated), { dateStyle: 'long' }),
            })}
          </p>
        ) : null}
      </PageHero>

      <section aria-labelledby="page-title" className="bg-white py-16 md:py-24">
        <div className="container-site grid gap-12 lg:grid-cols-[minmax(0,48rem)_1fr]">
          <div>
            <Prose data={page.content} />
            <p className="mt-10 text-slate-500">
              {t.rich('questions', {
                email: settings.email,
                link: (chunks) => (
                  <a
                    href={`mailto:${settings.email}`}
                    className="font-semibold text-teal-600 underline underline-offset-4"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </div>
          <nav aria-labelledby="legal-others">
            <h2 id="legal-others" className="font-display text-lg font-semibold text-teal-700">
              {t('others')}
            </h2>
            <ul className="mt-4 space-y-2">
              {docs
                .filter((other) => other !== doc)
                .map((other) => (
                  <li key={other}>
                    <Link
                      href={hrefs[other]}
                      className="font-semibold text-teal-600 underline underline-offset-4"
                    >
                      {t(`${other}.title`)}
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>
        </div>
      </section>
    </main>
  )
}
