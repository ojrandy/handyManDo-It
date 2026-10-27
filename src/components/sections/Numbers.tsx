import { getTranslations } from 'next-intl/server'

import { Counter } from '@/components/ui/Counter'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { site } from '@/lib/site'

import { CameroonMap } from './CameroonMap'

const stats = ['towns', 'years', 'clients', 'projects'] as const

// Animated counters + map (docs/PLAN.md §5.6, FR-HOME-06). Numbers come from lib/site until the
// page reads the `site` global (Phase 1).
export async function Numbers() {
  const t = await getTranslations('numbers')

  return (
    <section
      aria-labelledby="numbers-title"
      className="grain relative overflow-hidden bg-night-900 py-20 text-white md:py-28"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(45%_55%_at_80%_50%,rgb(28_93_112/0.45),transparent_70%)]"
      />
      <div className="container-site grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <SectionHeading
            id="numbers-title"
            tone="dark"
            eyebrow={t('eyebrow')}
            title={t('title')}
            intro={t('body')}
          />
          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {stats.map((key) => (
              <div key={key} className="flex flex-col border-l-2 border-gold-500/60 pl-4">
                <dt className="text-sm text-white/70">{t(`stats.${key}`)}</dt>
                <dd className="order-first font-display text-4xl font-bold text-white sm:text-5xl">
                  <Counter value={site.stats[key]} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <CameroonMap label={t('mapLabel')} className="mx-auto w-full max-w-xs lg:max-w-sm" />
      </div>
    </section>
  )
}
