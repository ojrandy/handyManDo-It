import { BadgeCheck, FileText, KeyRound, Wallet } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { SectionHeading } from '@/components/ui/SectionHeading'

const points = [
  ['clear', BadgeCheck],
  ['held', Wallet],
  ['code', KeyRound],
  ['quote', FileText],
] as const

// "How pricing works" on the services index (FR-PG-01): the facts of the booking flow, no
// figures until "from" prices exist (Q-5).
export async function PricingExplainer() {
  const t = await getTranslations('servicesPage.pricing')

  return (
    <section aria-labelledby="pricing-title" className="bg-white py-20 md:py-28">
      <div className="container-site">
        <SectionHeading id="pricing-title" eyebrow={t('eyebrow')} title={t('title')} />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {points.map(([key, Icon]) => (
            <li key={key} className="rounded-panel bg-mist-50 p-6 ring-1 ring-mist-200">
              <span className="grid size-11 place-items-center rounded-card bg-teal-600 text-white">
                <Icon aria-hidden className="size-5" strokeWidth={1.75} />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-teal-700">
                {t(`points.${key}.title`)}
              </h3>
              <p className="mt-2 leading-relaxed text-slate-500">{t(`points.${key}.body`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
