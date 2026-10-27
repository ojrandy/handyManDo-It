import {
  BadgeCheck,
  Clock,
  Handshake,
  KeyRound,
  Navigation,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { SectionHeading } from '@/components/ui/SectionHeading'

const values = [
  { key: 'punctual', icon: Clock },
  { key: 'polite', icon: Handshake },
  { key: 'professional', icon: Sparkles },
] as const

const trust = [
  { key: 'verified', icon: BadgeCheck },
  { key: 'held', icon: ShieldCheck },
  { key: 'tracking', icon: Navigation },
  { key: 'code', icon: KeyRound },
] as const

// Value pillars + "peace of mind" trust features (docs/PLAN.md §5.5, FR-HOME-05).
export async function Pillars() {
  const t = await getTranslations('pillars')

  return (
    <section aria-labelledby="pillars-title" className="bg-mist-50 py-20 md:py-28">
      <div className="container-site">
        <SectionHeading id="pillars-title" eyebrow={t('eyebrow')} title={t('title')} />

        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {values.map(({ key, icon: Icon }, index) => (
            <li
              key={key}
              className="relative overflow-hidden rounded-panel bg-white p-8 shadow-sm ring-1 ring-mist-200"
            >
              <span
                aria-hidden
                className="absolute -top-6 -right-2 font-display text-[8rem] leading-none font-extrabold text-mist-100"
              >
                {index + 1}
              </span>
              <span className="relative grid size-12 place-items-center rounded-card bg-teal-600 text-white">
                <Icon aria-hidden className="size-6" strokeWidth={1.75} />
              </span>
              <h3 className="relative mt-6 text-2xl font-bold text-teal-700">
                {t(`values.${key}.title`)}
              </h3>
              <p className="relative mt-3 leading-relaxed text-slate-500">
                {t(`values.${key}.body`)}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-16 rounded-panel bg-night-900 p-8 text-white md:p-12">
          <h3 className="text-2xl font-bold sm:text-3xl">{t('trustTitle')}</h3>
          <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {trust.map(({ key, icon: Icon }) => (
              <li key={key}>
                <span className="grid size-11 place-items-center rounded-card bg-gold-500/15 text-gold-300">
                  <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                </span>
                <h4 className="mt-4 font-display text-lg font-semibold">
                  {t(`trust.${key}.title`)}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {t(`trust.${key}.body`)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
