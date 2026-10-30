import { ArrowRight, ArrowUpRight, Store, UtensilsCrossed, Wrench } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'

import { buttonClasses } from '@/components/ui/button'
import { CmsImage } from '@/components/ui/CmsImage'
import { iconFor } from '@/components/ui/icons'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { bentoOrder, getHome, getHomeServices, pick, pickList } from '@/lib/home'
import { asMedia, imageSources } from '@/lib/media'
import { services, type ServiceKey } from '@/lib/services'
import { servicePhotos, servicePrices } from '@/lib/showcase'

const LARGE: ServiceKey[] = ['interiorExteriorDesign', 'remodeling']

// Services bento (docs/PLAN.md §5.4, FR-HOME-04): large tiles first, then small ones, then Shop
// and Food ("also in the app"). Services with a photo get a photo tile; the rest are icon tiles.
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

  return (
    <section aria-labelledby="services-title" className="bg-mist-50 py-20 md:py-28">
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

        <ul className="mt-12 grid auto-rows-[11rem] grid-cols-2 gap-3 sm:auto-rows-[13rem] sm:gap-4 lg:grid-cols-4">
          {tiles.map(({ id, slug, title, summary, Icon, large, photo, alt, price }) => (
            <li key={id} className={large ? 'col-span-2 sm:row-span-2' : ''}>
              <Link
                href={{ pathname: '/services/[slug]', params: { slug } }}
                className="group relative flex h-full flex-col justify-end overflow-hidden rounded-panel bg-night-900 p-4 text-white sm:p-6"
              >
                {photo.length ? (
                  <>
                    <CmsImage
                      sources={photo}
                      alt={alt}
                      fill
                      sizes={
                        large ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 25vw, 50vw'
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
                  {title}
                </span>
                {large ? (
                  <span className="relative mt-1 block max-w-sm text-white/80">{summary}</span>
                ) : null}
                <span className="relative mt-1.5 block text-xs font-medium text-gold-300 sm:mt-2 sm:text-sm">
                  {priceLabel(price)}
                </span>
              </Link>
            </li>
          ))}

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
        </ul>
      </div>
    </section>
  )
}
