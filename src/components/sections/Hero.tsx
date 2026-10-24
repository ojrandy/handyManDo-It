import { ArrowRight, MapPin } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { AppHomeScreen } from '@/components/device/AppHomeScreen'
import { buttonClasses } from '@/components/ui/button'
import { FilmLightbox } from '@/components/ui/FilmLightbox'
import { GetTheApp } from '@/components/ui/GetTheApp'
import { PaymentBadges } from '@/components/ui/PaymentBadges'
import { brandFilm, heroCues, heroVideo } from '@/lib/hero'
import { site } from '@/lib/site'

import { HeroStory } from './HeroStory'

// Decorative initials until the testimonials collection supplies real client photos (T-1.01).
const avatars = [
  { initials: 'NE', tone: 'from-teal-400 to-teal-600' },
  { initials: 'RS', tone: 'from-gold-300 to-gold-500' },
  { initials: 'SC', tone: 'from-teal-500 to-night-800' },
  { initials: 'ML', tone: 'from-gold-400 to-teal-500' },
]

// Synced-story hero (docs/PLAN.md §5.2, FR-HOME-01). All copy is server-rendered, so the H1
// is the LCP element and never waits for the video island.
export async function Hero() {
  const t = await getTranslations('hero')

  const cues = heroCues.map(({ key, time, icon: Icon }) => ({
    key,
    time,
    icon: <Icon className="size-4" strokeWidth={2} />,
    title: t(`cues.${key}.title`),
    body: t(`cues.${key}.body`),
  }))

  return (
    <section
      aria-labelledby="hero-title"
      className="grain relative overflow-hidden bg-night-900 text-white"
    >
      <HeroStory
        cues={cues}
        video={heroVideo}
        screen={<AppHomeScreen />}
        labels={{
          app: t('notification.app'),
          now: t('notification.now'),
          pause: t('story.pause'),
          play: t('story.play'),
        }}
      >
        <p className="mb-6 inline-flex items-center gap-2 text-sm font-medium tracking-[0.2em] text-gold-300 uppercase">
          <MapPin aria-hidden className="size-4" />
          {t('eyebrow')}
        </p>
        <h1
          id="hero-title"
          className="max-w-3xl text-5xl leading-[1.05] font-bold sm:text-6xl lg:text-7xl"
        >
          {t('titleStart')}{' '}
          <span className="relative inline-block text-gold-300">
            {t('titleHighlight')}
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
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/80">{t('subtitle')}</p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a href={site.webAppUrl} className={buttonClasses({ size: 'lg' })}>
            {t('primaryCta')}
            <ArrowRight aria-hidden className="size-5" />
          </a>
          <GetTheApp label={t('secondaryCta')} variant="secondary" size="lg" />
          <FilmLightbox
            src={brandFilm.src}
            poster={brandFilm.poster}
            labels={{ open: t('watchFilm'), title: t('film.title'), close: t('film.close') }}
          />
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
          <div className="flex items-center gap-3">
            <div aria-hidden className="flex -space-x-1.5">
              {avatars.map(({ initials, tone }) => (
                <span
                  key={initials}
                  className={`grid size-9 place-items-center rounded-full bg-gradient-to-br text-[11px] font-semibold text-night-900 ring-2 ring-night-900 ${tone}`}
                >
                  {initials}
                </span>
              ))}
            </div>
            <p className="text-sm font-medium text-white/85">
              {t('trust.clients', { count: site.stats.clients })}
            </p>
          </div>
          <PaymentBadges />
        </div>
        <p className="mt-8 text-sm tracking-wide text-white/50">{t('values')}</p>
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
