import { getLocale, getTranslations } from 'next-intl/server'

import {
  CoverflowView,
  type CoverflowProps,
  type GallerySlide,
} from '@/components/ui/CoverflowView'
import { NearView } from '@/components/ui/NearView'
import { SectionHeading } from '@/components/ui/SectionHeading'
import type { Locale } from '@/i18n/routing'
import { findScreen, getAppScreens } from '@/lib/home'
import { asMedia, imageSources } from '@/lib/media'
import type { AppScreen } from '@/payload-types'

// Gallery order: the booking journey first, then the rest of the app.
const order: AppScreen['key'][] = [
  'welcome',
  'home',
  'services',
  'category',
  'pro',
  'shop',
  'food',
  'help',
]
// A coverflow needs neighbours to read as one.
const MIN_SLIDES = 3

// Screens gallery (docs/PLAN.md §5.10, FR-HOME-10): the screenshots captured from the app in the
// page's language (T-1.09), in both themes. Screens missing either theme are left out, and the
// section stays hidden until enough screens are captured.
export async function ScreensGallery() {
  const locale = (await getLocale()) as Locale
  const [t, screens] = await Promise.all([getTranslations('gallery'), getAppScreens(locale)])

  const slides = order.flatMap((key): GallerySlide[] => {
    const light = findScreen(screens, key, 'light')
    const dark = findScreen(screens, key, 'dark')
    const image = (screen: AppScreen | undefined) => ({
      sources: imageSources(screen?.image),
      alt: asMedia(screen?.image)?.alt ?? '',
    })
    const images = { light: image(light), dark: image(dark) }
    if (!images.light.sources.length || !images.dark.sources.length) return []
    return [{ key, caption: light?.caption ?? dark?.caption ?? images.light.alt, images }]
  })
  if (slides.length < MIN_SLIDES) return null
  const labels: CoverflowProps['labels'] = {
    label: t('label'),
    slide: t.raw('slide') as string,
    previous: t('previous'),
    next: t('next'),
    pause: t('pause'),
    play: t('play'),
    theme: t('theme'),
    light: t('light'),
    dark: t('dark'),
  }

  return (
    <section
      aria-labelledby="gallery-title"
      className="grain relative overflow-hidden bg-night-950 py-20 text-white md:py-28"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(45%_50%_at_50%_55%,rgb(71_145_165/0.25),transparent_70%)]"
      />
      <div className="container-site">
        <SectionHeading
          id="gallery-title"
          tone="dark"
          align="center"
          eyebrow={t('eyebrow')}
          title={t('title')}
          intro={t('intro')}
        />
        {/* The coverflow's code loads near the view; until then, its first state from here. */}
        <NearView island="coverflow" props={{ slides, labels }} className="mt-10">
          <CoverflowView
            slides={slides}
            labels={labels}
            active={0}
            theme="light"
            canAutoplay={false}
            rotating={false}
            paused={false}
          />
        </NearView>
      </div>
    </section>
  )
}
