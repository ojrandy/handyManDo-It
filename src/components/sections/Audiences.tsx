import { ArrowRight, Briefcase, Building2, Check, House } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'

import { buttonClasses } from '@/components/ui/button'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getHome, getSiteSettings, pick } from '@/lib/home'

// Homes / Businesses / Buildings (docs/PLAN.md §5.12, FR-HOME-12). The middle card is the dark,
// featured one so the three read as distinct audiences. The cards and their links are fixed;
// editors write each card's title and points (`home.audiences.items`, matched on audience).
export async function Audiences() {
  const locale = (await getLocale()) as Locale
  const [t, home, settings] = await Promise.all([
    getTranslations('audiences'),
    getHome(locale),
    getSiteSettings(locale),
  ])
  const copy = home.audiences

  const cards = [
    { key: 'homes', icon: House, featured: false },
    { key: 'businesses', icon: Briefcase, featured: true },
    { key: 'buildings', icon: Building2, featured: false },
  ] as const

  return (
    <section aria-labelledby="audiences-title" className="bg-mist-100 py-20 md:py-28">
      <div className="container-site">
        <SectionHeading
          id="audiences-title"
          eyebrow={pick(copy?.eyebrow, t('eyebrow'))}
          title={pick(copy?.title, t('title'))}
        />

        <ul className="mt-12 grid gap-5 lg:grid-cols-3">
          {cards.map(({ key, icon: Icon, featured }) => {
            const item = copy?.items?.find(({ audience }) => audience === key)
            const title = pick(item?.title, t(`${key}.title`))
            const points = item?.points?.length
              ? item.points.map(({ text }) => text)
              : (t.raw(`${key}.points`) as string[])
            const cta = (
              <>
                {t(`${key}.cta`)}
                <ArrowRight aria-hidden className="size-4" />
              </>
            )
            const ctaClass = buttonClasses({
              variant: featured ? 'primary' : 'outline',
              // French CTAs are long; let them wrap inside the card instead of widening it.
              className: 'mt-8 w-full text-center whitespace-normal! sm:w-auto',
            })

            return (
              <li
                key={key}
                className={`flex min-w-0 flex-col rounded-panel p-8 ${
                  featured
                    ? 'grain bg-night-900 text-white shadow-float'
                    : 'bg-white shadow-sm ring-1 ring-mist-200'
                }`}
              >
                <span
                  className={`grid size-12 place-items-center rounded-card ${
                    featured ? 'bg-gold-500 text-night-900' : 'bg-mist-100 text-teal-600'
                  }`}
                >
                  <Icon aria-hidden className="size-6" strokeWidth={1.75} />
                </span>
                <h3
                  className={`mt-6 text-2xl font-bold ${featured ? 'text-white' : 'text-teal-700'}`}
                >
                  {title}
                </h3>
                <ul className="mt-5 flex-1 space-y-3">
                  {points.map((point) => (
                    <li
                      key={point}
                      className={`flex gap-3 ${featured ? 'text-white/80' : 'text-slate-500'}`}
                    >
                      <Check
                        aria-hidden
                        className={`mt-0.5 size-5 shrink-0 ${featured ? 'text-gold-300' : 'text-teal-600'}`}
                      />
                      {point}
                    </li>
                  ))}
                </ul>
                {key === 'homes' ? (
                  <a href={settings.webAppUrl} className={ctaClass}>
                    {cta}
                  </a>
                ) : (
                  <Link
                    href={key === 'businesses' ? '/businesses' : '/buildings'}
                    className={ctaClass}
                  >
                    {cta}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
