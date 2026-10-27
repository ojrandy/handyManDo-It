import { ArrowRight, ArrowUpRight, Store, UtensilsCrossed } from 'lucide-react'
import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'

import { buttonClasses } from '@/components/ui/button'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { services, type ServiceKey } from '@/lib/services'
import { servicePhotos, servicePrices } from '@/lib/showcase'

const LARGE: ServiceKey[] = ['interiorExteriorDesign', 'remodeling']

// Services bento (docs/PLAN.md §5.4, FR-HOME-04): 2 large + 9 small service tiles, then Shop and
// Food ("also in the app"). Photo tiles use real project photos; the rest are icon tiles.
export async function ServicesBento() {
  const [t, s, nav, locale] = await Promise.all([
    getTranslations('servicesSection'),
    getTranslations('services'),
    getTranslations('nav'),
    getLocale() as Promise<Locale>,
  ])
  const ordered = [
    ...services.filter(({ key }) => LARGE.includes(key)),
    ...services.filter(({ key }) => !LARGE.includes(key)),
  ]

  const priceLabel = (key: ServiceKey) => {
    const price = servicePrices[key]
    return price
      ? t('from', {
          price: new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US').format(price),
        })
      : t('clearPrice')
  }

  return (
    <section aria-labelledby="services-title" className="bg-mist-50 py-20 md:py-28">
      <div className="container-site">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading id="services-title" eyebrow={t('eyebrow')} title={t('title')} />
          <Link
            href="/services"
            className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-teal-600 underline-offset-4 hover:underline"
          >
            {nav('allServices')}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

        <ul className="mt-12 grid auto-rows-[11rem] grid-cols-2 gap-3 sm:auto-rows-[13rem] sm:gap-4 lg:grid-cols-4">
          {ordered.map(({ key, slug, icon: Icon }) => {
            const photo = servicePhotos[key]
            const large = LARGE.includes(key)
            return (
              <li key={key} className={large ? 'col-span-2 sm:row-span-2' : ''}>
                <Link
                  href={{ pathname: '/services/[slug]', params: { slug: slug[locale] } }}
                  className="group relative flex h-full flex-col justify-end overflow-hidden rounded-panel bg-night-900 p-4 text-white sm:p-6"
                >
                  {photo ? (
                    <>
                      <Image
                        src={photo.src}
                        alt={t(`photos.${key}`)}
                        fill
                        sizes={
                          large
                            ? '(min-width: 1024px) 50vw, 100vw'
                            : '(min-width: 1024px) 25vw, 50vw'
                        }
                        className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
                      />
                      <span
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-t from-night-950 via-night-950/65 to-night-950/10"
                      />
                    </>
                  ) : (
                    <span
                      aria-hidden
                      className="absolute inset-0 bg-[radial-gradient(80%_90%_at_100%_0%,rgb(28_93_112/0.7),transparent_70%)]"
                    />
                  )}
                  <span className="relative grid size-9 place-items-center rounded-card bg-gold-500 text-night-900 sm:size-10">
                    <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                  </span>
                  <span
                    className={`relative mt-4 block font-display font-semibold ${large ? 'text-2xl sm:text-3xl' : 'text-base leading-snug sm:text-lg'}`}
                  >
                    {s(`${key}.name`)}
                  </span>
                  {large ? (
                    <span className="relative mt-1 block max-w-sm text-white/80">
                      {s(`${key}.blurb`)}
                    </span>
                  ) : null}
                  <span className="relative mt-1.5 block text-xs font-medium text-gold-300 sm:mt-2 sm:text-sm">
                    {priceLabel(key)}
                  </span>
                </Link>
              </li>
            )
          })}

          {(
            [
              ['shop', '/shop', Store],
              ['food', '/food', UtensilsCrossed],
            ] as const
          ).map(([key, href, Icon]) => (
            <li key={key}>
              <Link
                href={href}
                className="group flex h-full flex-col justify-between rounded-panel bg-white p-4 shadow-sm sm:p-6 ring-1 ring-mist-200 transition-shadow hover:shadow-float"
              >
                <span className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-card bg-mist-100 text-teal-600">
                    <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="rounded-full bg-teal-600/10 px-2 py-1 text-[10px] font-semibold text-teal-700 sm:px-3 sm:text-xs">
                    {t('alsoInApp')}
                  </span>
                </span>
                <span>
                  <span className="block font-display text-lg font-semibold text-teal-700">
                    {t(`${key}.name`)}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500 sm:text-sm">
                    {t(`${key}.blurb`)}
                  </span>
                </span>
              </Link>
            </li>
          ))}

          <li>
            <div className="flex h-full flex-col justify-between rounded-panel bg-teal-600 p-4 text-white sm:p-6">
              <span className="font-display text-lg leading-snug font-semibold sm:text-xl">
                {t('custom')}
              </span>
              <Link
                href="/contact"
                className={buttonClasses({
                  variant: 'primary',
                  size: 'sm',
                  // Half-width tile on phones: let the label wrap rather than overflow.
                  className: 'self-start px-3 whitespace-normal! sm:px-4',
                })}
              >
                {t('quote')}
                <ArrowUpRight aria-hidden className="size-4" />
              </Link>
            </div>
          </li>
        </ul>
      </div>
    </section>
  )
}
