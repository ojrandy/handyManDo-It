import { getLocale, getTranslations } from 'next-intl/server'

import { SectionHeading } from '@/components/ui/SectionHeading'
import { DemoLoader } from '@/components/ui/DemoLoader'
import type { DemoLabels } from '@/components/ui/DemoPhone'
import type { Locale } from '@/i18n/routing'
import { services, type ServiceKey } from '@/lib/services'
import { getSiteSettings } from '@/lib/settings'

// Interactive mini-demo (docs/PLAN.md §5.9, FR-HOME-09). The screens are HTML with sample data,
// so they are crisp, translated and accessible; the phone's code loads on view (DemoLoader).
export async function MiniDemo() {
  const locale = (await getLocale()) as Locale
  const [t, phone, names, settings] = await Promise.all([
    getTranslations('demo'),
    getTranslations('phone'),
    getTranslations('services'),
    getSiteSettings(locale),
  ])

  const labels: DemoLabels = {
    label: t('label'),
    question: phone('question'),
    prosTitle: t('prosTitle'),
    back: t('back'),
    verified: t('verified'),
    jobs: t('jobs'),
    // Raw: "{service}" is filled in on the client.
    bookTitle: t.raw('bookTitle') as string,
    when: t('when'),
    slots: {
      today: t('slots.today'),
      tomorrow: t('slots.tomorrow'),
      weekend: t('slots.weekend'),
    },
    payWith: t('payWith'),
    priceNote: t('priceNote'),
    confirm: t('confirm'),
    doneTitle: t('doneTitle'),
    doneBody: t('doneBody'),
    cta: t('cta'),
    restart: t('restart'),
  }
  const serviceNames = Object.fromEntries(
    services.map(({ key }) => [key, names(`${key}.short`)]),
  ) as Record<ServiceKey, string>

  return (
    <section aria-labelledby="demo-title" className="overflow-hidden bg-white py-20 md:py-28">
      <div className="container-site grid items-center gap-14 lg:grid-cols-2">
        <SectionHeading
          id="demo-title"
          eyebrow={t('eyebrow')}
          title={t('title')}
          intro={t('intro')}
        />
        <div className="relative flex justify-center">
          <div
            aria-hidden
            className="absolute top-1/2 left-1/2 size-80 -translate-1/2 rounded-full bg-teal-400/15 blur-3xl"
          />
          <DemoLoader
            loading={t('loading')}
            labels={labels}
            serviceNames={serviceNames}
            locale={locale}
            appUrl={settings.webAppUrl}
          />
        </div>
      </div>
    </section>
  )
}
