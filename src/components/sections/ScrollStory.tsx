import { ArrowUpRight } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'
import React from 'react'

import { AppHomeScreen } from '@/components/device/AppHomeScreen'
import { AppScreenImage } from '@/components/device/AppScreenImage'
import { Phone } from '@/components/device/Phone'
import {
  CodeScreen,
  PayScreen,
  PriceScreen,
  RewardsScreen,
  TrackScreen,
  WebAppScreen,
} from '@/components/device/StoryScreens'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { StoryObserver } from '@/components/ui/StoryObserver'
import type { Locale } from '@/i18n/routing'
import { findScreen, getAppScreens } from '@/lib/home'
import { getSiteSettings } from '@/lib/settings'

const chapters = ['browse', 'price', 'pay', 'track', 'code', 'rewards', 'finale'] as const
const finale = chapters.length - 1
const sectionId = 'scroll-story'

// App showcase (docs/PLAN.md §5.7, FR-HOME-07): six chapters scroll past a pinned phone whose
// screen follows them, then the finale zooms out to laptop + phone. Pinning is CSS `sticky` and
// the current chapter comes from an IntersectionObserver (ADR-021), so there is no animation
// library to load. Below 768 px, and under reduced motion, it is a horizontal swipe instead
// (the `pinned` variant). Without JS the phone shows the first screen and every chapter reads.
export async function ScrollStory() {
  const locale = (await getLocale()) as Locale
  const [t, download, settings, screens] = await Promise.all([
    getTranslations('story'),
    getTranslations('download'),
    getSiteSettings(locale),
    getAppScreens(locale),
  ])

  // Chapter indexes each screen stands for; the finale goes back to the home screen.
  const stage: { for: string; screen: React.ReactNode }[] = [
    {
      for: `0 ${finale}`,
      screen: (
        <AppScreenImage
          screen={findScreen(screens, 'home', 'light')}
          fallback={<AppHomeScreen />}
        />
      ),
    },
    { for: '1', screen: <PriceScreen /> },
    { for: '2', screen: <PayScreen /> },
    { for: '3', screen: <TrackScreen /> },
    { for: '4', screen: <CodeScreen /> },
    { for: '5', screen: <RewardsScreen /> },
  ]

  return (
    <section
      id={sectionId}
      aria-labelledby="story-title"
      className="group/story grain relative bg-night-900 py-20 text-white md:py-28"
    >
      <div className="container-site">
        <SectionHeading id="story-title" tone="dark" eyebrow={t('eyebrow')} title={t('title')} />

        <div className="mt-12 flex flex-col gap-10 pinned:grid pinned:grid-cols-[minmax(0,1fr)_26rem] pinned:gap-12">
          <div
            aria-hidden
            className="relative flex flex-col items-center pinned:sticky pinned:top-16 pinned:col-start-2 pinned:row-start-1 pinned:h-[calc(100svh-4rem)] pinned:justify-center"
          >
            <div className="relative grid place-items-center">
              <div className="absolute w-[21rem] -translate-x-[8%] scale-90 opacity-0 transition duration-700 ease-out-expo group-data-finale/story:scale-100 group-data-finale/story:opacity-100 pinned:w-[28rem]">
                <div className="aspect-[16/10] overflow-hidden rounded-t-xl bg-night-950 p-1.5 ring-1 ring-white/15">
                  <div className="h-full overflow-hidden rounded-md">
                    <WebAppScreen host={new URL(settings.webAppUrl).host} />
                  </div>
                </div>
                <div className="-mx-[6%] h-3 rounded-b-xl bg-mist-200 shadow-float" />
              </div>
              <div className="transition-transform duration-700 ease-out-expo [zoom:0.62] group-data-finale/story:translate-x-[62%] group-data-finale/story:translate-y-[10%] group-data-finale/story:scale-[0.6] pinned:[zoom:0.82]">
                <Phone>
                  {stage.map(({ for: chapterIndexes, screen }, index) => (
                    <div
                      key={chapterIndexes}
                      data-for={chapterIndexes}
                      data-current={index === 0 ? '' : undefined}
                      className="absolute inset-0 opacity-0 transition-opacity duration-500 data-current:opacity-100"
                    >
                      {screen}
                    </div>
                  ))}
                </Phone>
              </div>
            </div>

            <ol className="mt-6 flex gap-2 pinned:absolute pinned:top-1/2 pinned:left-0 pinned:mt-0 pinned:-translate-y-1/2 pinned:flex-col">
              {chapters.map((key, index) => (
                <li
                  key={key}
                  data-for={index}
                  data-current={index === 0 ? '' : undefined}
                  className="size-1.5 rounded-full bg-white/25 transition-all duration-300 data-current:w-6 data-current:bg-gold-500 pinned:data-current:h-6 pinned:data-current:w-1.5"
                />
              ))}
            </ol>
          </div>

          <ol
            data-story-track
            aria-label={t('label')}
            tabIndex={0}
            className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] pinned:col-start-1 pinned:row-start-1 pinned:mx-0 pinned:block pinned:overflow-visible pinned:px-0 pinned:pb-0 [&::-webkit-scrollbar]:hidden"
          >
            {chapters.map((key, index) => (
              <li
                key={key}
                data-story-chapter
                data-for={index}
                data-current={index === 0 ? '' : undefined}
                className="w-[82%] shrink-0 snap-center rounded-panel bg-white/5 p-6 ring-1 ring-white/10 pinned:flex pinned:min-h-[75svh] pinned:w-auto pinned:flex-col pinned:justify-center pinned:bg-transparent pinned:p-0 pinned:opacity-55 pinned:ring-0 pinned:transition-opacity pinned:duration-500 pinned:data-current:opacity-100"
              >
                {index < finale ? (
                  <p className="font-display text-sm font-semibold tracking-[0.2em] text-gold-300">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                ) : null}
                <h3 className="mt-3 text-2xl font-bold sm:text-3xl pinned:text-4xl">
                  {t(`chapters.${key}.title`)}
                </h3>
                <p className="mt-3 max-w-md text-lg leading-relaxed text-white/75">
                  {t(`chapters.${key}.body`)}
                </p>
                {index === finale ? (
                  <a
                    href={settings.webAppUrl}
                    className="mt-6 inline-flex items-center gap-1.5 font-semibold text-gold-300 underline-offset-4 hover:underline"
                  >
                    {download('webApp')}
                    <ArrowUpRight aria-hidden className="size-4" />
                  </a>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <StoryObserver id={sectionId} />
    </section>
  )
}
