import { ArrowRight, ChefHat, Store, Wrench } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'

import { buttonClasses } from '@/components/ui/button'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getHome, pick, pickList } from '@/lib/home'

import { EarnTabs } from './EarnTabs'

const tabs = [
  { key: 'pros', icon: Wrench },
  { key: 'sellers', icon: Store },
  { key: 'kitchens', icon: ChefHat },
] as const

// Earn with HandyMan (docs/PLAN.md §5.13, FR-HOME-13): tabs per audience plus a step strip that
// mirrors the app's real sign-up. Tab photos arrive with the Phase 1 content.
export async function Earn() {
  const locale = (await getLocale()) as Locale
  const [t, home] = await Promise.all([getTranslations('earn'), getHome(locale)])
  const copy = home.earn

  const steps = pickList(
    copy?.steps,
    ({ text }) => text,
    () => t.raw('steps') as string[],
  )
  // CMS tabs have no icon field: they take the icons in order (pros, sellers, kitchens).
  const tabItems = pickList(
    copy?.tabs,
    (tab, index) => ({
      key: tab.id ?? String(index),
      label: tab.label,
      title: tab.title,
      points: tab.points?.map(({ text }) => text) ?? [],
      Icon: tabs[index % tabs.length].icon,
    }),
    () =>
      tabs.map(({ key, icon }) => ({
        key,
        label: t(`tabs.${key}.label`),
        title: t(`tabs.${key}.title`),
        points: t.raw(`tabs.${key}.points`) as string[],
        Icon: icon,
      })),
  )

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
            eyebrow={pick(copy?.eyebrow, t('eyebrow'))}
            title={pick(copy?.title, t('title'))}
            intro={pick(copy?.body, t('body'))}
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
          tabs={tabItems.map(({ Icon, ...tab }) => ({
            ...tab,
            icon: <Icon aria-hidden className="size-6" strokeWidth={1.75} />,
          }))}
        />
      </div>
    </section>
  )
}
