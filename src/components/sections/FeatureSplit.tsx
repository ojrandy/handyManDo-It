import { CircleCheck } from 'lucide-react'
import { getLocale } from 'next-intl/server'

import { AppScreenImage } from '@/components/device/AppScreenImage'
import { Phone } from '@/components/device/Phone'
import type { Locale } from '@/i18n/routing'
import { findScreen, getAppScreens } from '@/lib/home'
import type { AppScreen } from '@/payload-types'

type Column = { title: string; points: string[] }

type Props = {
  id: string
  columns: Column[]
  // Captured app screen shown beside the lists (decorative, like every phone on the site).
  screen?: AppScreen['key']
  tone?: 'white' | 'mist'
}

// Checklists of what a page's audience gets, beside the matching app screen (shop, food,
// buildings). Without a captured screen the lists take the full width.
export async function FeatureSplit({ id, columns, screen, tone = 'white' }: Props) {
  const locale = (await getLocale()) as Locale
  const shot = screen ? findScreen(await getAppScreens(locale), screen, 'light') : undefined

  return (
    <section
      aria-labelledby={`${id}-0`}
      className={`${tone === 'mist' ? 'bg-mist-50' : 'bg-white'} py-16 md:py-24`}
    >
      <div
        className={`container-site grid items-center gap-12 ${shot ? 'lg:grid-cols-[1.2fr_0.8fr]' : ''}`}
      >
        <div className={`grid gap-10 ${columns.length > 1 ? 'md:grid-cols-2' : ''}`}>
          {columns.map(({ title, points }, index) => (
            <div key={title}>
              <h2 id={`${id}-${index}`} className="text-2xl font-bold text-teal-700 sm:text-3xl">
                {title}
              </h2>
              <ul className="mt-6 space-y-3">
                {points.map((point) => (
                  <li key={point} className="flex gap-3 text-lg text-ink">
                    <CircleCheck aria-hidden className="mt-1 size-5 shrink-0 text-teal-600" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {shot ? (
          <div aria-hidden className="flex justify-center">
            <Phone>
              <AppScreenImage screen={shot} fallback={null} />
            </Phone>
          </div>
        ) : null}
      </div>
    </section>
  )
}
