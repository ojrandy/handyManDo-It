import { Quote, Star } from 'lucide-react'
import type { Metadata } from 'next'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'

import { CtaBand } from '@/components/sections/CtaBand'
import { PageHero } from '@/components/sections/PageHero'
import { CmsImage } from '@/components/ui/CmsImage'
import { JsonLd } from '@/components/ui/JsonLd'
import type { Locale } from '@/i18n/routing'
import { getTestimonials } from '@/lib/catalog'
import { asMedia, imageSources } from '@/lib/media'
import { pageMetadata, pathsFor } from '@/lib/seo'
import { getSiteSettings } from '@/lib/settings'
import { site } from '@/lib/site'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const t = await getTranslations({ locale, namespace: 'reviewsPage' })
  return pageMetadata({
    locale,
    title: t('metaTitle'),
    description: t('metaDescription'),
    paths: pathsFor('/reviews'),
  })
}

// All testimonials (PLAN.md §6, FR-PG-08) with Review structured data. The aggregate rating and
// stars appear only with real figures: the site's Play Store rating (Q-6) and per-review ratings.
export default async function ReviewsPage({ params }: Props) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const [t, format, testimonials, settings] = await Promise.all([
    getTranslations('reviewsPage'),
    getFormatter(),
    getTestimonials(locale),
    getSiteSettings(locale),
  ])
  const { rating, reviewCount } = settings

  return (
    <main id="main">
      <PageHero
        breadcrumbs={[{ label: t('eyebrow'), href: '/reviews' }]}
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={
          rating && reviewCount
            ? `${t('lead')} ${t('rating', { rating: format.number(rating), count: reviewCount })}`
            : t('lead')
        }
      />

      <div className="bg-mist-50 py-16 md:py-24">
        <ul className="container-site columns-1 gap-5 md:columns-2">
          {testimonials.map(({ id, name, city, quote, rating: stars, photo, service }) => {
            const avatar = asMedia(photo)
            const serviceName = typeof service === 'object' && service ? service.title : null
            return (
              <li key={id} className="mb-5 break-inside-avoid">
                <figure className="rounded-panel bg-white p-7 shadow-sm ring-1 ring-mist-200">
                  <Quote aria-hidden className="size-7 text-gold-500" />
                  {stars ? (
                    <p role="img" className="mt-4 flex gap-0.5" aria-label={`${stars}/5`}>
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star
                          key={index}
                          aria-hidden
                          className={`size-4 ${index < stars ? 'fill-gold-500 text-gold-500' : 'text-mist-200'}`}
                        />
                      ))}
                    </p>
                  ) : null}
                  <blockquote className="mt-4 text-lg leading-relaxed text-ink">{quote}</blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    {avatar ? (
                      <CmsImage
                        sources={imageSources(avatar)}
                        alt=""
                        width={44}
                        height={44}
                        sizes="44px"
                        className="size-11 rounded-full object-cover"
                      />
                    ) : null}
                    <span>
                      <span className="block font-semibold text-teal-700">{name}</span>
                      <span className="block text-sm text-slate-500">
                        {city}
                        {serviceName ? ` · ${t('service', { service: serviceName })}` : null}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              </li>
            )
          })}
        </ul>
      </div>

      <CtaBand />

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: site.name,
          url: site.url,
          ...(rating && reviewCount
            ? {
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: rating,
                  reviewCount,
                  bestRating: 5,
                },
              }
            : {}),
          review: testimonials.map(({ name, quote, rating: stars }) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name },
            reviewBody: quote,
            ...(stars
              ? { reviewRating: { '@type': 'Rating', ratingValue: stars, bestRating: 5 } }
              : {}),
          })),
        }}
      />
    </main>
  )
}
