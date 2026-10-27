import { ArrowRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { buttonClasses } from '@/components/ui/button'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { site } from '@/lib/site'

const steps = ['choose', 'book', 'relax'] as const

// Three steps with numbered ornaments and a connecting line that draws on scroll
// (docs/PLAN.md §5.8, FR-HOME-08). The line is static where scroll-driven animation is unsupported.
export async function HowItWorks() {
  const t = await getTranslations('howItWorks')

  return (
    <section aria-labelledby="how-title" className="bg-mist-100 py-20 md:py-28">
      <div className="container-site">
        <SectionHeading id="how-title" eyebrow={t('eyebrow')} title={t('title')} align="center" />

        <div className="how-steps relative mt-16">
          <span
            aria-hidden
            className="how-line absolute top-8 left-[16.66%] hidden h-0.5 w-[66.66%] origin-left bg-gradient-to-r from-teal-600 via-gold-500 to-teal-600 md:block"
          />
          <ol className="relative grid gap-12 md:grid-cols-3 md:gap-8">
            {steps.map((key, index) => (
              <li key={key} className="relative text-center">
                <span className="relative mx-auto grid size-16 place-items-center rounded-full bg-night-900 font-display text-2xl font-bold text-gold-300 shadow-float ring-8 ring-mist-100">
                  {index + 1}
                </span>
                <h3 className="mt-6 text-2xl font-bold text-teal-700">{t(`steps.${key}.title`)}</h3>
                <p className="mx-auto mt-3 max-w-xs leading-relaxed text-slate-500">
                  {t(`steps.${key}.body`)}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-14 text-center">
          <a href={site.webAppUrl} className={buttonClasses({ variant: 'solid', size: 'lg' })}>
            {t('cta')}
            <ArrowRight aria-hidden className="size-5" />
          </a>
        </div>
      </div>
    </section>
  )
}
