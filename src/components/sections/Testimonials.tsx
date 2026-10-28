import { ArrowRight, Quote } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'

import { CarouselControls } from '@/components/ui/CarouselControls'
import { CmsImage } from '@/components/ui/CmsImage'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getHome, getHomeTestimonials, pick, pickList } from '@/lib/home'
import { imageSources } from '@/lib/media'
import { testimonials } from '@/lib/showcase'

// Testimonials (docs/PLAN.md §5.11, FR-HOME-11): the featured reviews, in editor order. The
// aggregate store rating stays hidden until real numbers exist (Q-6).
export async function Testimonials() {
  const locale = (await getLocale()) as Locale
  const [t, home, docs] = await Promise.all([
    getTranslations('testimonials'),
    getHome(locale),
    getHomeTestimonials(locale),
  ])
  const trackId = 'testimonials-track'

  const reviews = pickList(
    docs,
    (review) => ({
      key: String(review.id),
      quote: review.quote,
      name: review.name,
      city: review.city,
      // A draft or deleted service is not readable here, so the tag is simply left out.
      service: typeof review.service === 'object' ? (review.service?.title ?? null) : null,
      photo: imageSources(review.photo),
    }),
    () =>
      testimonials.map(({ key, photo }) => ({
        key,
        quote: t(`items.${key}.quote`),
        name: t(`items.${key}.name`),
        city: t(`items.${key}.city`),
        service: t(`items.${key}.service`),
        photo: [{ url: photo, width: 112 }],
      })),
  )

  return (
    <section
      aria-labelledby="testimonials-title"
      className="overflow-hidden bg-mist-50 py-20 md:py-28"
    >
      <div className="container-site">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            id="testimonials-title"
            eyebrow={pick(home.testimonials?.eyebrow, t('eyebrow'))}
            title={pick(home.testimonials?.title, t('title'))}
          />
          <CarouselControls
            trackId={trackId}
            labels={{ previous: t('previous'), next: t('next') }}
          />
        </div>

        <ul
          id={trackId}
          aria-label={t('label')}
          tabIndex={0}
          className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {reviews.map(({ key, quote, name, city, service, photo }) => (
            <li
              key={key}
              className="flex w-[85%] shrink-0 snap-start flex-col rounded-panel bg-white p-8 shadow-sm ring-1 ring-mist-200 sm:w-[28rem] lg:w-[34rem]"
            >
              <Quote aria-hidden className="size-8 text-gold-500" />
              <blockquote className="mt-5 flex-1 text-lg leading-relaxed text-ink">
                <p>{quote}</p>
              </blockquote>
              <div className="mt-8 flex items-center gap-4">
                {/* Decorative: the name sits right next to it. */}
                {photo.length ? (
                  <CmsImage
                    sources={photo}
                    alt=""
                    width={56}
                    height={56}
                    className="size-14 rounded-full object-cover ring-2 ring-mist-100"
                  />
                ) : null}
                <div>
                  <p className="font-semibold text-teal-700">{name}</p>
                  <p className="text-sm text-slate-500">
                    {service ? `${city} · ${service}` : city}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <Link
          href="/reviews"
          className="mt-8 inline-flex items-center gap-1.5 font-semibold text-teal-600 underline-offset-4 hover:underline"
        >
          {t('seeAll')}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
    </section>
  )
}
