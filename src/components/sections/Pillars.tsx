import {
  BadgeCheck,
  Clock,
  Handshake,
  KeyRound,
  Navigation,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'

import { iconFor } from '@/components/ui/icons'
import { SectionHeading } from '@/components/ui/SectionHeading'
import type { Locale } from '@/i18n/routing'
import { getHome, pick, pickList } from '@/lib/home'

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
  const locale = (await getLocale()) as Locale
  const [t, home] = await Promise.all([getTranslations('pillars'), getHome(locale)])
  const copy = home.pillars

  const fromCms =
    (fallbackIcon: (typeof values)[number]['icon']) =>
    (
      item: { id?: string | null; icon?: string | null; title: string; body?: string | null },
      index: number,
    ) => ({
      key: item.id ?? String(index),
      Icon: iconFor(item.icon, fallbackIcon),
      title: item.title,
      body: item.body ?? '',
    })

  const valueCards = pickList(copy?.values, fromCms(Sparkles), () =>
    values.map(({ key, icon }) => ({
      key,
      Icon: icon,
      title: t(`values.${key}.title`),
      body: t(`values.${key}.body`),
    })),
  )
  const trustItems = pickList(copy?.trust, fromCms(ShieldCheck), () =>
    trust.map(({ key, icon }) => ({
      key,
      Icon: icon,
      title: t(`trust.${key}.title`),
      body: t(`trust.${key}.body`),
    })),
  )

  return (
    <section aria-labelledby="pillars-title" className="bg-mist-100 py-20 md:py-28">
      <div className="container-site">
        <SectionHeading
          id="pillars-title"
          eyebrow={pick(copy?.eyebrow, t('eyebrow'))}
          title={pick(copy?.title, t('title'))}
        />

        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {valueCards.map(({ key, Icon, title, body }, index) => (
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
              <h3 className="relative mt-6 text-2xl font-bold text-teal-700">{title}</h3>
              <p className="relative mt-3 leading-relaxed text-slate-500">{body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-16 rounded-panel bg-night-900 p-8 text-white md:p-12">
          <h3 className="text-2xl font-bold sm:text-3xl">
            {pick(copy?.trustTitle, t('trustTitle'))}
          </h3>
          <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map(({ key, Icon, title, body }) => (
              <li key={key}>
                <span className="grid size-11 place-items-center rounded-card bg-gold-500/15 text-gold-300">
                  <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                </span>
                <h4 className="mt-4 font-display text-lg font-semibold">{title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
