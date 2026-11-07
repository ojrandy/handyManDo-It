import {
  ArrowUpRight,
  BadgeCheck,
  Gift,
  KeyRound,
  ListChecks,
  Navigation,
  ShieldCheck,
} from 'lucide-react'
import Image from 'next/image'
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
import { storyChapters as chapters, storyPhotos } from '@/lib/showcase'

const finale = chapters.length - 1
const sectionId = 'scroll-story'

const icons = {
  browse: ListChecks,
  price: BadgeCheck,
  pay: ShieldCheck,
  track: Navigation,
  code: KeyRound,
  rewards: Gift,
}

// App showcase (docs/PLAN.md §5.7, FR-HOME-07, ADR-030): one pinned stage where text, picture and
// phone change together as you scroll, ending on laptop + phone. CSS `sticky` holds the stage and a
// GSAP timeline (loaded near the view) scrubs the changes. The picture column and the phone share
// one height (`--story-h`), so they line up at any window size. Below 768 px, under reduced motion
// and without JS, every chapter is a card in a horizontal swipe instead (the `pinned` variant).
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
      className="story-height grain relative bg-night-900 pt-20 pb-20 text-white md:pt-28 pinned:pb-0 [&[data-gsap]_[data-story-chapter]]:transition-none [&[data-gsap]_[data-story-screen]]:transition-none"
    >
      <div className="container-site">
        <SectionHeading id="story-title" tone="dark" eyebrow={t('eyebrow')} title={t('title')} />
      </div>

      {/* Tall wrapper: its height is the scroll distance while the stage stays stuck. */}
      <div data-story-scroll className="mt-12 pinned:mt-6 pinned:h-[calc(100svh+6*70svh)]">
        <div
          data-story-stage
          className="pinned:sticky pinned:top-[4.5rem] pinned:flex pinned:h-[calc(100svh-4.5rem)] pinned:items-center"
        >
          <div className="container-site">
            <div
              data-story-fit
              className="flex flex-col gap-10 pinned:grid pinned:h-[var(--story-h)] pinned:grid-cols-[minmax(0,1fr)_auto] pinned:gap-8 lg:pinned:gap-12"
            >
              <div
                aria-hidden
                className="flex flex-col items-center pinned:col-start-2 pinned:row-start-1 pinned:flex-row pinned:gap-8 lg:pinned:gap-12"
              >
                <div
                  data-story-phone
                  className="[zoom:0.62] pinned:order-2 pinned:[zoom:var(--story-zoom,0.8)]"
                >
                  <Phone>
                    {stage.map(({ for: chapterIndexes, screen }, index) => (
                      <div
                        key={chapterIndexes}
                        data-story-screen
                        data-for={chapterIndexes}
                        data-current={index === 0 ? '' : undefined}
                        className="absolute inset-0 opacity-0 transition-opacity duration-500 data-current:opacity-100"
                      >
                        {screen}
                      </div>
                    ))}
                  </Phone>
                </div>

                <ol className="mt-6 flex gap-2 pinned:order-1 pinned:mt-0 pinned:flex-col">
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
                className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] pinned:col-start-1 pinned:row-start-1 pinned:mx-0 pinned:grid pinned:h-full pinned:min-w-0 pinned:grid-rows-[auto_minmax(0,1fr)] pinned:gap-0 pinned:overflow-visible pinned:px-0 pinned:pb-0 [&::-webkit-scrollbar]:hidden"
              >
                {chapters.map((key, index) => {
                  const Icon = key === 'finale' ? null : icons[key]
                  return (
                    <li
                      key={key}
                      data-story-chapter
                      data-for={index}
                      data-current={index === 0 ? '' : undefined}
                      className="flex w-[82%] shrink-0 snap-center flex-col rounded-panel bg-white/5 p-6 ring-1 ring-white/10 pinned:pointer-events-none pinned:col-start-1 pinned:row-span-2 pinned:row-start-1 pinned:grid pinned:w-auto pinned:grid-rows-subgrid pinned:bg-transparent pinned:p-0 pinned:opacity-0 pinned:ring-0 pinned:transition-opacity pinned:duration-500 pinned:data-current:pointer-events-auto pinned:data-current:opacity-100"
                    >
                      <div className="pinned:pb-6">
                        <p
                          data-story-reveal
                          className="flex items-center gap-2 text-sm font-medium text-white/75"
                        >
                          {index < finale ? (
                            <span className="font-display font-semibold tracking-widest text-gold-300">
                              {String(index + 1).padStart(2, '0')}/
                              {String(finale).padStart(2, '0')}
                            </span>
                          ) : null}
                          {t(`chapters.${key}.step`)}
                        </p>
                        <h3
                          data-story-reveal
                          className="mt-3 text-2xl font-bold sm:text-3xl lg:pinned:text-4xl"
                        >
                          {t(`chapters.${key}.title`)}
                        </h3>
                        <p
                          data-story-reveal
                          className="mt-3 max-w-lg text-lg leading-relaxed text-white/75"
                        >
                          {t(`chapters.${key}.body`)}
                        </p>
                        {index === finale ? (
                          <a
                            data-story-reveal
                            href={settings.webAppUrl}
                            className="mt-3 inline-flex items-center gap-1.5 font-semibold text-gold-300 underline-offset-4 hover:underline"
                          >
                            {download('webApp')}
                            <ArrowUpRight aria-hidden className="size-4" />
                          </a>
                        ) : null}
                      </div>

                      {/* Swipe cards differ in text length: the pictures still line up at the
                          bottom. Pinned, the picture takes all the height the text leaves. */}
                      <div className="mt-auto pt-6 pinned:mt-0 pinned:h-full pinned:min-h-0 pinned:overflow-hidden pinned:rounded-xl pinned:pt-0">
                        <figure className="relative aspect-[3/2] max-h-72 w-full overflow-hidden rounded-xl bg-night-950 ring-1 ring-white/10 pinned:aspect-auto pinned:h-full pinned:max-h-none">
                          {key === 'finale' ? (
                            <div
                              aria-hidden
                              data-story-picture
                              className="absolute inset-0 grid place-items-center bg-[radial-gradient(70%_70%_at_50%_40%,rgb(28_93_112/0.6),transparent)] pb-14"
                            >
                              <div className="w-[28rem] [zoom:0.58] sm:max-md:[zoom:0.9] pinned:[zoom:0.72] lg:pinned:[zoom:1.15] lg:pinned:[@media(min-height:850px)]:[zoom:1.4]">
                                <div className="aspect-[16/10] overflow-hidden rounded-t-xl bg-night-950 p-1.5 ring-1 ring-white/15">
                                  <div className="h-full overflow-hidden rounded-md">
                                    <WebAppScreen host={new URL(settings.webAppUrl).host} locale={locale} />
                                  </div>
                                </div>
                                <div className="-mx-[6%] h-3 rounded-b-xl bg-mist-200 shadow-float" />
                              </div>
                            </div>
                          ) : (
                            <Image
                              data-story-picture
                              src={storyPhotos[key]}
                              alt={t(`chapters.${key}.photoAlt`)}
                              fill
                              sizes="(min-width: 80rem) 760px, (min-width: 48rem) 50vw, 78vw"
                              // Exported at web size; nothing to resize per request.
                              unoptimized
                              className="object-cover"
                            />
                          )}
                          <figcaption className="absolute bottom-3 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-lg bg-night-950/85 px-2.5 py-1.5 text-xs leading-snug font-medium text-white pinned:px-3 pinned:py-2 pinned:text-sm">
                            {Icon ? (
                              <Icon aria-hidden className="size-4 shrink-0 text-gold-300" />
                            ) : null}
                            {t(`chapters.${key}.caption`)}
                          </figcaption>
                        </figure>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>
        </div>
      </div>
      <StoryObserver id={sectionId} />
    </section>
  )
}
