import { ArrowRight, Quote } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'

import { CarouselControlsView } from '@/components/ui/CarouselControlsView'
import { CmsImage } from '@/components/ui/CmsImage'
import { NearView } from '@/components/ui/NearView'
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
  const controls = { trackId, labels: { previous: t('previous'), next: t('next') } }

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
          {/* Button code loads near the view (NearView); a hidden wrapper never loads it. */}
          <NearView island="carouselControls" props={controls} className="hidden sm:block">
            <CarouselControlsView {...controls} current={0} atStart atEnd={false} />
          </NearView>
        </div>

        {/* Phones: the track runs to the screen's edges, so the next card peeks in and the swipe is
            obvious; position and buttons sit under the card, where the thumb is. */}
        <ul
          id={trackId}
          aria-label={t('label')}
          tabIndex={0}
          className="-mx-4 mt-8 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:mx-0 sm:mt-12 sm:scroll-px-0 sm:gap-5 sm:px-0 sm:pb-4 [&::-webkit-scrollbar]:hidden"
        >
          {reviews.map(({ key, quote, name, city, service, photo }) => (
            <li
              key={key}
              className="flex w-[86%] shrink-0 snap-start flex-col rounded-panel bg-white p-6 shadow-sm ring-1 ring-mist-200 sm:w-[28rem] sm:p-8 lg:w-[34rem]"
            >
              <Quote aria-hidden className="size-6 text-gold-500 sm:size-8" />
              <blockquote className="mt-3 flex-1 text-base leading-relaxed text-ink sm:mt-5 sm:text-lg">
                <p>{quote}</p>
              </blockquote>
              <div className="mt-5 flex items-center gap-3 border-t border-mist-100 pt-5 sm:mt-8 sm:gap-4 sm:border-0 sm:pt-0">
                {/* Decorative: the name sits right next to it. */}
                {photo.length ? (
                  <CmsImage
                    sources={photo}
                    alt=""
                    width={56}
                    height={56}
                    className="size-12 shrink-0 rounded-full object-cover ring-2 ring-mist-100 sm:size-14"
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="font-semibold text-teal-700">{name}</p>
                  <p className="text-sm text-slate-500">
                    {service ? `${city} · ${service}` : city}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <NearView
          island="carouselControls"
          props={{ ...controls, dots: reviews.length }}
          className="mt-5 sm:hidden"
        >
          <CarouselControlsView
            {...controls}
            dots={reviews.length}
            current={0}
            atStart
            atEnd={false}
          />
        </NearView>

        <Link
          href="/reviews"
          className="mt-6 flex items-center justify-center gap-1.5 font-semibold text-teal-600 underline-offset-4 hover:underline sm:mt-8 sm:inline-flex"
        >
          {t('seeAll')}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
    </section>
  )
}
