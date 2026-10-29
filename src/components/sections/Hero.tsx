import { ArrowRight, BadgeCheck, MapPin } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'

import { AppHomeScreen } from '@/components/device/AppHomeScreen'
import { AppScreenImage } from '@/components/device/AppScreenImage'
import { buttonClasses } from '@/components/ui/button'
import { CmsImage } from '@/components/ui/CmsImage'
import { FilmLightbox } from '@/components/ui/FilmLightbox'
import { GetTheApp } from '@/components/ui/GetTheApp'
import { iconFor } from '@/components/ui/icons'
import { PaymentBadges } from '@/components/ui/PaymentBadges'
import type { Locale } from '@/i18n/routing'
import { brandFilm, heroCues } from '@/lib/hero'
import {
  findScreen,
  getAppScreens,
  getHome,
  getHomeTestimonials,
  heroVideoFrom,
  pick,
  pickList,
} from '@/lib/home'
import { getSiteSettings } from '@/lib/settings'
import { imageSources, mediaUrl } from '@/lib/media'

import { HeroStory } from './HeroStory'

// Initials stand in while no featured testimonial has a photo.
const initials = [
  { initials: 'NE', tone: 'from-teal-400 to-teal-600' },
  { initials: 'RS', tone: 'from-gold-300 to-gold-500' },
  { initials: 'SC', tone: 'from-teal-500 to-night-800' },
  { initials: 'ML', tone: 'from-gold-400 to-teal-500' },
]

// Synced-story hero (docs/PLAN.md §5.2, FR-HOME-01). All copy is server-rendered, so the H1
// is the LCP element and never waits for the video island.
export async function Hero() {
  const locale = (await getLocale()) as Locale
  const [t, home, settings, testimonials, screens] = await Promise.all([
    getTranslations('hero'),
    getHome(locale),
    getSiteSettings(locale),
    getHomeTestimonials(locale),
    getAppScreens(locale),
  ])
  const copy = home.hero

  // The video's poster, shown under the overlay: the background itself while there is no footage
  // and in light-data mode, and until the first frame when there is. Dimmed by the overlay, it is
  // never the LCP element; HeroStory only mounts it once the page has loaded.
  const posterSources = imageSources(copy?.video?.poster)
  const backdrop = posterSources.length ? (
    <CmsImage
      sources={posterSources}
      alt=""
      fill
      sizes="100vw"
      fetchPriority="low"
      loading="eager"
      className="object-cover motion-safe:animate-slow-zoom"
    />
  ) : null

  const cues = pickList(
    copy?.cues,
    (cue, index) => {
      const Icon = iconFor(cue.icon, BadgeCheck)
      return {
        key: cue.id ?? String(index),
        time: cue.time,
        icon: <Icon className="size-4" strokeWidth={2} />,
        title: cue.title,
        body: cue.body ?? '',
      }
    },
    () =>
      heroCues.map(({ key, time, icon: Icon }) => ({
        key,
        time,
        icon: <Icon className="size-4" strokeWidth={2} />,
        title: t(`cues.${key}.title`),
        body: t(`cues.${key}.body`),
      })),
  )
  // The story clock walks the cues in order, whatever order editors entered them in.
  cues.sort((a, b) => a.time - b.time)

  const film = {
    src: mediaUrl(copy?.film?.video) ?? brandFilm.src,
    poster: mediaUrl(copy?.film?.poster) ?? brandFilm.poster,
  }
  const faces = testimonials
    .map(({ photo }) => imageSources(photo))
    .filter((sources) => sources.length)
    .slice(0, 4)

  return (
    <section
      aria-labelledby="hero-title"
      className="grain relative overflow-hidden bg-night-900 text-white"
    >
      <HeroStory
        cues={cues}
        video={heroVideoFrom(copy?.video)}
        screen={
          <AppScreenImage
            screen={findScreen(screens, 'home', 'light')}
            fallback={<AppHomeScreen />}
            eager
          />
        }
        backdrop={backdrop}
        labels={{
          app: t('notification.app'),
          now: t('notification.now'),
          pause: t('story.pause'),
          play: t('story.play'),
        }}
      >
        <p className="mb-6 inline-flex items-center gap-2 text-sm font-medium tracking-[0.2em] text-gold-300 uppercase">
          <MapPin aria-hidden className="size-4" />
          {pick(copy?.eyebrow, t('eyebrow'))}
        </p>
        <h1
          id="hero-title"
          className="max-w-3xl text-5xl leading-[1.05] font-bold sm:text-6xl lg:text-7xl"
        >
          {pick(copy?.titleStart, t('titleStart'))}{' '}
          <span className="relative inline-block text-gold-300">
            {pick(copy?.titleHighlight, t('titleHighlight'))}
            <svg
              aria-hidden
              viewBox="0 0 300 12"
              preserveAspectRatio="none"
              className="absolute -bottom-2 left-0 h-3 w-full text-gold-500"
            >
              <path
                d="M2 9c60-6 140-8 296-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/80">
          {pick(copy?.subtitle, t('subtitle'))}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a href={settings.webAppUrl} className={buttonClasses({ size: 'lg' })}>
            {t('primaryCta')}
            <ArrowRight aria-hidden className="size-5" />
          </a>
          <GetTheApp label={t('secondaryCta')} variant="secondary" size="lg" />
          <FilmLightbox
            src={film.src}
            poster={film.poster}
            labels={{ open: t('watchFilm'), title: t('film.title'), close: t('film.close') }}
          />
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
          <div className="flex items-center gap-3">
            <div aria-hidden className="flex -space-x-1.5">
              {faces.length
                ? faces.map((sources) => (
                    <CmsImage
                      key={sources[0].url}
                      sources={sources}
                      alt=""
                      width={36}
                      height={36}
                      className="size-9 rounded-full object-cover ring-2 ring-night-900"
                    />
                  ))
                : initials.map(({ initials, tone }) => (
                    <span
                      key={initials}
                      className={`grid size-9 place-items-center rounded-full bg-gradient-to-br text-[11px] font-semibold text-night-900 ring-2 ring-night-900 ${tone}`}
                    >
                      {initials}
                    </span>
                  ))}
            </div>
            <p className="text-sm font-medium text-white/85">
              {t('trust.clients', { count: settings.stats.clients })}
            </p>
          </div>
          <PaymentBadges />
        </div>
        <p className="mt-8 text-sm tracking-wide text-white/50">
          {pick(copy?.values, t('values'))}
        </p>
      </HeroStory>

      {/* The animated phone is decorative; this is the same story for screen readers. */}
      <div className="sr-only">
        <h2>{t('story.label')}</h2>
        <ol>
          {cues.map((cue) => (
            <li key={cue.key}>
              {cue.title}: {cue.body}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
