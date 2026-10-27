import { ArrowRight, ChefHat, Store, Wrench } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { buttonClasses } from '@/components/ui/button'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Link } from '@/i18n/navigation'

import { EarnTabs } from './EarnTabs'

const tabs = [
  { key: 'pros', icon: Wrench },
  { key: 'sellers', icon: Store },
  { key: 'kitchens', icon: ChefHat },
] as const

// Earn with HandyMan (docs/PLAN.md §5.13, FR-HOME-13): tabs per audience plus a step strip that
// mirrors the app's real sign-up. Tab photos arrive with the Phase 1 content.
export async function Earn() {
  const t = await getTranslations('earn')
  const steps = t.raw('steps') as string[]

  return (
    <section
      aria-labelledby="earn-title"
      className="grain relative overflow-hidden bg-night-800 py-20 text-white md:py-28"
    >
      <div className="container-site grid gap-12 lg:grid-cols-2 lg:items-start">
        <div>
          <SectionHeading
            id="earn-title"
            tone="dark"
            eyebrow={t('eyebrow')}
            title={t('title')}
            intro={t('body')}
          />
          <h3 className="mt-10 text-sm font-semibold tracking-wide text-white/70 uppercase">
            {t('stepsLabel')}
          </h3>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2">
            {steps.map((step, index) => (
              <li
                key={step}
                className="flex items-center gap-3 rounded-card bg-white/5 px-4 py-3 ring-1 ring-white/10"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-teal-600 text-sm font-bold">
                  {index + 1}
                </span>
                <span className="text-sm font-medium">{step}</span>
              </li>
            ))}
          </ol>
          <Link href="/become-a-pro" className={buttonClasses({ size: 'lg', className: 'mt-10' })}>
            {t('cta')}
            <ArrowRight aria-hidden className="size-5" />
          </Link>
        </div>

        <EarnTabs
          label={t('tabsLabel')}
          tabs={tabs.map(({ key, icon: Icon }) => ({
            key,
            label: t(`tabs.${key}.label`),
            title: t(`tabs.${key}.title`),
            points: t.raw(`tabs.${key}.points`) as string[],
            icon: <Icon aria-hidden className="size-6" strokeWidth={1.75} />,
          }))}
        />
      </div>
    </section>
  )
}
