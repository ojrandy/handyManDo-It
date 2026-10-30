import { Check, MapPin, Quote } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { PageHero } from '@/components/sections/PageHero'
import { buttonClasses } from '@/components/ui/button'
import { CmsImage } from '@/components/ui/CmsImage'
import { FaqList, faqItem } from '@/components/ui/FaqList'
import { GetTheApp } from '@/components/ui/GetTheApp'
import { JsonLd } from '@/components/ui/JsonLd'
import { Prose } from '@/components/ui/Prose'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ServiceCard } from '@/components/ui/ServiceCard'
import { getPathname, Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { docPaths, formatPrice, getService, getServices } from '@/lib/catalog'
import { asMedia, imageSources } from '@/lib/media'
import { absoluteUrl, pageMetadata } from '@/lib/seo'
import { site } from '@/lib/site'
import type { Faq, Project, Service, Testimonial } from '@/payload-types'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const services = await getServices(params.locale as Locale)
  return services.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const service = await getService(locale as Locale, slug)
  if (!service) return {}
  const paths = await docPaths('services', service.id)
  if (!paths) return { title: service.meta?.title || service.title }
  return pageMetadata({
    locale: locale as Locale,
    title: service.meta?.title || service.title,
    description: service.meta?.description || service.summary,
    paths,
  })
}

// Join fields hold ids or docs; only populated, published docs are rendered.
const joined = <T extends { id: number }>(join: { docs?: (number | T)[] } | null | undefined) =>
  (join?.docs ?? []).filter((doc): doc is T => typeof doc === 'object')

// Service detail (PLAN.md §6, FR-PG-02): hero, what's included, from-price, process, related
// work, reviews, the service's FAQs, a sticky Book / Quote bar and Service structured data.
// Optional CMS content hides its section when empty.
export default async function ServicePage({ params }: Props) {
  const { locale: param, slug } = await params
  const locale = param as Locale
  setRequestLocale(locale)

  const service = await getService(locale, slug)
  if (!service) notFound()

  const [t, cta, nav, section, steps, all] = await Promise.all([
    getTranslations('servicesPage'),
    getTranslations('ctaBand'),
    getTranslations('nav'),
    getTranslations('servicesSection'),
    getTranslations('howItWorks'),
    getServices(locale),
  ])

  const price = service.fromPrice
    ? section('from', { price: formatPrice(locale, service.fromPrice) })
    : section('clearPrice')
  const quoteHref = {
    pathname: '/contact' as const,
    query: { type: 'quote', service: service.key ?? service.slug },
  }
  const inclusions = service.inclusions ?? []
  // The service's own steps, else the booking flow every service shares.
  const process = service.process?.length
    ? service.process.map(({ id, title, text }) => ({ key: id ?? title, title, text }))
    : (['choose', 'book', 'relax'] as const).map((key) => ({
        key,
        title: steps(`steps.${key}.title`),
        text: steps(`steps.${key}.body`),
      }))
  const projects = joined<Project>(service.projects)
  const testimonials = joined<Testimonial>(service.testimonials)
  const faqs = joined<Faq>(service.faqs)
  // Same group first, then the rest, so "other services" stays relevant.
  const others = [
    ...all.filter((s) => s.id !== service.id && s.category === service.category),
    ...all.filter((s) => s.id !== service.id && s.category !== service.category),
  ].slice(0, 3)

  return (
    <main id="main">
      <PageHero
        breadcrumbs={[
          { label: nav('services'), href: '/services' },
          { label: service.title, href: { pathname: '/services/[slug]', params: { slug } } },
        ]}
        eyebrow={price}
        title={service.title}
        lead={service.summary}
        image={{
          sources: imageSources(service.heroImage),
          alt: asMedia(service.heroImage)?.alt ?? '',
        }}
      >
        <GetTheApp label={cta('book')} size="lg" />
        <Link href={quoteHref} className={buttonClasses({ variant: 'secondary', size: 'lg' })}>
          {cta('quote')}
        </Link>
      </PageHero>

      {service.body || inclusions.length ? (
        <section aria-labelledby="included-title" className="bg-white py-16 md:py-24">
          <div className="container-site grid gap-12 lg:grid-cols-2">
            <div>
              <h2
                id="included-title"
                className="text-3xl leading-tight font-bold text-teal-700 sm:text-4xl"
              >
                {t('detail.included')}
              </h2>
              {service.body ? <Prose data={service.body} className="mt-6" /> : null}
            </div>
            {inclusions.length ? (
              <ul className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {inclusions.map(({ id, text }) => (
                  <li
                    key={id ?? text}
                    className="flex gap-3 rounded-card bg-mist-50 p-4 text-ink ring-1 ring-mist-200"
                  >
                    <Check aria-hidden className="mt-0.5 size-5 shrink-0 text-teal-600" />
                    {text}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="process-title" className="bg-mist-50 py-16 md:py-24">
        <div className="container-site">
          <SectionHeading id="process-title" eyebrow={service.title} title={t('detail.process')} />
          <ol className="mt-12 grid gap-5 md:grid-cols-3">
            {process.map(({ key, title, text }, index) => (
              <li key={key} className="rounded-panel bg-white p-6 ring-1 ring-mist-200">
                <span
                  aria-hidden
                  className="grid size-10 place-items-center rounded-full bg-gold-500 font-display font-bold text-night-900"
                >
                  {index + 1}
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-teal-700">{title}</h3>
                {text ? <p className="mt-2 leading-relaxed text-slate-500">{text}</p> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {projects.length ? (
        <section aria-labelledby="work-title" className="bg-white py-16 md:py-24">
          <div className="container-site">
            <h2 id="work-title" className="text-3xl font-bold text-teal-700 sm:text-4xl">
              {t('detail.work')}
            </h2>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 6).map((project) => (
                <li key={project.id}>
                  <Link
                    href={{ pathname: '/our-work/[slug]', params: { slug: project.slug } }}
                    className="group block overflow-hidden rounded-panel bg-night-900 text-white"
                  >
                    <span className="relative block aspect-[4/3]">
                      <CmsImage
                        sources={imageSources(project.cover)}
                        alt={asMedia(project.cover)?.alt ?? ''}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
                      />
                    </span>
                    <span className="block p-5">
                      <span className="block font-display text-lg font-semibold">
                        {project.title}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-sm text-white/70">
                        <MapPin aria-hidden className="size-4" />
                        {project.city}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {testimonials.length ? (
        <section aria-labelledby="reviews-title" className="bg-night-900 py-16 text-white md:py-24">
          <div className="container-site">
            <h2 id="reviews-title" className="text-3xl font-bold sm:text-4xl">
              {t('detail.reviews')}
            </h2>
            <ul className="mt-10 grid gap-5 md:grid-cols-2">
              {testimonials.slice(0, 4).map(({ id, name, city, quote }) => (
                <li key={id}>
                  <figure className="h-full rounded-panel bg-white/5 p-6 ring-1 ring-white/10">
                    <Quote aria-hidden className="size-6 text-gold-300" />
                    <blockquote className="mt-4 text-lg leading-relaxed text-white/85">
                      {quote}
                    </blockquote>
                    <figcaption className="mt-5 text-sm text-white/60">
                      <span className="font-semibold text-white">{name}</span> · {city}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {faqs.length ? (
        <section aria-labelledby="service-faq-title" className="bg-mist-50 py-16 md:py-24">
          <div className="container-site grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <h2
              id="service-faq-title"
              className="text-3xl leading-tight font-bold text-teal-700 sm:text-4xl"
            >
              {t('detail.faq', { service: service.title })}
            </h2>
            <FaqList items={faqs.map(faqItem)} />
          </div>
        </section>
      ) : null}

      {others.length ? (
        <section aria-labelledby="other-title" className="bg-white py-16 md:py-24">
          <div className="container-site">
            <h2 id="other-title" className="text-3xl font-bold text-teal-700 sm:text-4xl">
              {t('detail.other')}
            </h2>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((other) => (
                <li key={other.id}>
                  <ServiceCard
                    service={other}
                    price={
                      other.fromPrice
                        ? section('from', { price: formatPrice(locale, other.fromPrice) })
                        : section('clearPrice')
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Sticky Book / Quote bar (PLAN.md §6). Right padding keeps it clear of the WhatsApp
          button on phones. */}
      <aside
        aria-label={t('detail.actions')}
        className="sticky bottom-0 z-20 border-t border-mist-200 bg-white/95 backdrop-blur"
      >
        <div className="container-site flex items-center justify-between gap-4 py-3 pr-20 md:pr-24 2xl:pr-0">
          <p className="hidden min-w-0 sm:block">
            <span className="block truncate font-display font-semibold text-teal-700">
              {service.title}
            </span>
            <span className="block text-sm text-slate-500">{price}</span>
          </p>
          <div className="flex flex-1 items-center gap-2 sm:flex-none">
            <GetTheApp label={cta('book')} variant="solid" size="sm" className="flex-1" />
            <Link
              href={quoteHref}
              className={buttonClasses({ variant: 'outline', size: 'sm', className: 'flex-1' })}
            >
              {cta('quote')}
            </Link>
          </div>
        </div>
      </aside>

      <JsonLd data={serviceJsonLd(service, locale)} />
    </main>
  )
}

// Service structured data (FR-SEO-03). An offer only when a from-price is set (Q-5).
function serviceJsonLd(service: Service, locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.summary,
    serviceType: service.title,
    url: absoluteUrl(
      getPathname({
        locale,
        href: { pathname: '/services/[slug]', params: { slug: service.slug } },
      }),
    ),
    areaServed: { '@type': 'Country', name: 'Cameroon' },
    provider: { '@type': 'Organization', name: site.name, url: site.url },
    ...(service.fromPrice
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: 'XAF',
            priceSpecification: {
              '@type': 'PriceSpecification',
              minPrice: service.fromPrice,
              priceCurrency: 'XAF',
            },
          },
        }
      : {}),
  }
}
