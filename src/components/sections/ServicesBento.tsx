import { ArrowRight, ArrowUpRight, Store, UtensilsCrossed, Wrench } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'
import type { CSSProperties, ReactNode } from 'react'

import { buttonClasses } from '@/components/ui/button'
import { CmsImage } from '@/components/ui/CmsImage'
import { iconFor } from '@/components/ui/icons'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ServicePanels } from '@/components/ui/ServicePanels'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { bentoOrder, getHome, getHomeServices, pick, pickList } from '@/lib/home'
import { asMedia, imageSources } from '@/lib/media'
import { groupBySlug } from '@/lib/serviceGroups'
import { services, type ServiceKey } from '@/lib/services'
import { servicePhotos, servicePrices } from '@/lib/showcase'

const LARGE: ServiceKey[] = ['interiorExteriorDesign', 'remodeling']
const sectionId = 'services'

// Services bento (docs/PLAN.md §5.4, FR-HOME-04): large tiles first, then small ones, then Shop
// and Food ("also in the app"). Services with a photo get a photo tile; the rest are icon tiles.
// On phones the same tiles become scroll-driven panels, one group per screen (ADR-031): see the
// `panels` variant. Reduced motion, no JS and short screens keep the plain grid.
export async function ServicesBento() {
  const locale = (await getLocale()) as Locale
  const [t, s, nav, home, docs] = await Promise.all([
    getTranslations('servicesSection'),
    getTranslations('services'),
    getTranslations('nav'),
    getHome(locale),
    getHomeServices(locale),
  ])

  const tiles = pickList(
    bentoOrder(docs),
    (service) => ({
      id: String(service.id),
      slug: service.slug,
      title: service.title,
      summary: service.summary,
      Icon: iconFor(service.icon, Wrench),
      large: service.size === 'large',
      photo: imageSources(service.heroImage),
      alt: asMedia(service.heroImage)?.alt ?? '',
      price: service.fromPrice ?? null,
    }),
    // Empty collection: the built-in services, copy from messages.
    () =>
      [
        ...services.filter(({ key }) => LARGE.includes(key)),
        ...services.filter(({ key }) => !LARGE.includes(key)),
      ].map(({ key, slug, icon }) => {
        const photo = servicePhotos[key]
        return {
          id: key,
          slug: slug[locale],
          title: s(`${key}.name`),
          summary: s(`${key}.blurb`),
          Icon: icon,
          large: LARGE.includes(key),
          photo: photo ? [{ url: photo.src, width: photo.width }] : [],
          alt: photo ? t(`photos.${key}`) : '',
          price: servicePrices[key] ?? null,
        }
      }),
  )

  const priceLabel = (price: number | null) =>
    price
      ? t('from', {
          price: new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US').format(price),
        })
      : t('clearPrice')

  const groups = groupBySlug(tiles, locale)
  // Each service group, then Shop + Food + custom quote.
  const panelCount = groups.length + 1

  return (
    <section
      id={sectionId}
      aria-labelledby="services-title"
      className="bg-mist-50 py-20 md:py-28 panels:pb-6 [&[data-gsap]_[data-panel]]:transition-none"
    >
      <div className="container-site">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            id="services-title"
            eyebrow={pick(home.services?.eyebrow, t('eyebrow'))}
            title={pick(home.services?.title, t('title'))}
          />
          <Link
            href="/services"
            className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-teal-600 underline-offset-4 hover:underline"
          >
            {nav('allServices')}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

        {/* Tall wrapper: its height is the scroll distance while the stage stays stuck. Without
            the `panels` variant, every wrapper below is `contents` and the tiles are one grid. */}
        <div
          data-panels-scroll
          style={{ '--panels': panelCount } as CSSProperties}
          className="mt-12 panels:mt-6 panels:h-[calc(100svh-4.5rem+(var(--panels)-1)*60svh)]"
        >
          <div
            data-panels-stage
            className="panels:sticky panels:top-[4.5rem] panels:flex panels:h-[calc(100svh-4.5rem)] panels:flex-col panels:justify-center panels:py-3"
          >
            <ol aria-hidden className="mb-3 hidden gap-1.5 panels:flex">
              {Array.from({ length: panelCount }, (_, step) => (
                <li
                  key={step}
                  // Filled once its panel is reached, so the bar reads as progress.
                  data-for={Array.from({ length: panelCount - step }, (_, i) => step + i).join(' ')}
                  data-current={step === 0 ? '' : undefined}
                  className="h-1 flex-1 rounded-full bg-mist-200 transition-colors duration-300 data-current:bg-teal-600"
                />
              ))}
            </ol>

            <div className="grid auto-rows-[minmax(11rem,auto)] grid-cols-2 gap-3 sm:auto-rows-[13rem] sm:gap-4 lg:auto-rows-[14rem] lg:grid-cols-4 panels:max-h-[40rem] panels:min-h-0 panels:flex-1 panels:auto-rows-auto panels:grid-cols-1 panels:grid-rows-[minmax(0,1fr)] panels:gap-0 panels:overflow-clip panels:[overflow-clip-margin:0.25rem]">
              {groups.map((group, index) => (
                <Panel key={group.key} index={index} title={t(`groups.${group.key}`)}>
                  {group.tiles.map(
                    ({ id, slug, title, summary, Icon, large, photo, alt, price }, position) => {
                      // Three tiles fill a 2 x 2 panel when the first takes the whole top row.
                      const wide = position === 0 && group.tiles.length % 2 === 1
                      return (
                        <li
                          key={id}
                          data-panel-tile
                          className={`flex ${large ? 'col-span-2 min-h-60 sm:row-span-2 sm:min-h-0 panels:col-span-1 panels:row-span-1 panels:min-h-0' : ''} ${wide ? 'panels:col-span-2' : 'panels:min-w-0'}`}
                        >
                          <Link
                            href={{ pathname: '/services/[slug]', params: { slug } }}
                            className="group relative flex w-full flex-col justify-between overflow-hidden rounded-panel bg-night-900 p-4 text-white sm:p-6"
                          >
                            {photo.length ? (
                              <>
                                <CmsImage
                                  sources={photo}
                                  alt={alt}
                                  fill
                                  // The container caps at 80rem, so tiles stop growing at about 600
                                  // and 300 px. A 3:2 photo in a tall panel tile shows nearly its
                                  // full width on phones, even in half a screen's width: hence 100vw.
                                  sizes={
                                    large
                                      ? '(min-width: 1280px) 600px, (min-width: 1024px) 50vw, 100vw'
                                      : '(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw'
                                  }
                                  className="object-cover transition-transform duration-700 ease-out-expo motion-safe:group-hover:scale-105"
                                />
                                {/* Dark only behind the text, so the crew stays visible above it. */}
                                <span
                                  aria-hidden
                                  className={`absolute inset-0 bg-gradient-to-t from-night-950 to-transparent ${large ? 'via-night-950/75 via-45% sm:via-night-950/65 sm:via-35%' : 'via-night-950/70 via-50% sm:via-night-950/55 sm:via-40%'} panels:via-night-950/75 panels:via-40%`}
                                />
                              </>
                            ) : (
                              <span
                                aria-hidden
                                className="absolute inset-0 bg-[radial-gradient(80%_90%_at_100%_0%,rgb(28_93_112/0.7),transparent_70%)]"
                              />
                            )}
                            <span className="relative flex items-start justify-between">
                              <span className="grid size-9 place-items-center rounded-card bg-gold-500 text-night-900 shadow-sm sm:size-10">
                                <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                              </span>
                              <span
                                aria-hidden
                                className="grid size-8 place-items-center rounded-full bg-night-950/55 text-white transition-colors group-hover:bg-white group-hover:text-night-900 group-focus-visible:bg-white group-focus-visible:text-night-900 sm:size-9"
                              >
                                <ArrowUpRight className="size-4" />
                              </span>
                            </span>
                            <span className="relative block">
                              <span
                                className={`block font-display font-semibold ${large ? 'text-2xl sm:text-3xl panels:text-base panels:leading-snug sm:panels:text-lg' : 'text-base leading-snug sm:text-lg'}`}
                              >
                                {title}
                              </span>
                              {large ? (
                                <span className="mt-1 block max-w-sm text-white/85 panels:hidden">
                                  {summary}
                                </span>
                              ) : null}
                              {/* A real price earns the accent; the fallback repeats on every tile, so it stays quiet. */}
                              <span
                                className={`mt-1 block text-xs sm:text-sm ${price ? 'font-semibold text-gold-300' : 'text-white/80'}`}
                              >
                                {priceLabel(price)}
                              </span>
                            </span>
                          </Link>
                        </li>
                      )
                    },
                  )}
                </Panel>
              ))}

              <Panel index={groups.length} title={t('alsoInApp')}>
                {(
                  [
                    ['shop', '/shop', Store],
                    ['food', '/food', UtensilsCrossed],
                  ] as const
                ).map(([key, href, Icon]) => (
                  <li key={key} data-panel-tile className="panels:min-w-0">
                    <Link
                      href={href}
                      className="group flex h-full flex-col justify-between rounded-panel bg-white p-4 shadow-sm sm:p-6 ring-1 ring-mist-200 transition-shadow hover:shadow-float"
                    >
                      <span className="flex items-center justify-between">
                        <span className="grid size-10 place-items-center rounded-card bg-mist-100 text-teal-600">
                          <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                        </span>
                        {/* The panel's title already says it. */}
                        <span className="rounded-full bg-teal-600/10 px-2 py-1 text-[10px] font-semibold text-teal-700 sm:px-3 sm:text-xs panels:hidden">
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

                <li data-panel-tile className="panels:col-span-2">
                  <div className="flex h-full flex-col justify-between gap-3 rounded-panel bg-teal-600 p-4 text-white sm:p-6">
                    <span className="font-display text-base leading-snug font-semibold sm:text-xl panels:text-2xl">
                      {t('custom')}
                    </span>
                    <Link
                      href={{ pathname: '/contact', query: { type: 'quote' } }}
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
              </Panel>
            </div>
          </div>
        </div>
      </div>
      <ServicePanels id={sectionId} />
    </section>
  )
}

// One screen of tiles on phones. The panels share a grid cell, and those not next to the current
// one wait below the clipped track so their lazy photos stay unloaded. Elsewhere this is `contents`.
function Panel({ index, title, children }: { index: number; title: string; children: ReactNode }) {
  return (
    <div
      data-panel
      data-for={index}
      data-current={index === 0 ? '' : undefined}
      data-near={index <= 1 ? '' : undefined}
      className="contents panels:pointer-events-none panels:col-start-1 panels:row-start-1 panels:grid panels:min-h-0 panels:grid-rows-[auto_minmax(0,1fr)] panels:gap-3 panels:opacity-0 panels:transition-opacity panels:duration-300 panels:not-data-near:translate-y-[200%] panels:data-current:pointer-events-auto panels:data-current:opacity-100"
    >
      <h3
        data-panel-title
        className="hidden font-display text-xl font-semibold text-teal-700 panels:block"
      >
        {title}
      </h3>
      <ul className="contents panels:grid panels:min-h-0 panels:auto-rows-fr panels:grid-cols-2 panels:gap-3">
        {children}
      </ul>
    </div>
  )
}
