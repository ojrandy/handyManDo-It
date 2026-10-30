import { getTranslations } from 'next-intl/server'

import { GetTheApp } from '@/components/ui/GetTheApp'
import type { AppScreen } from '@/payload-types'

import { CtaBand } from './CtaBand'
import { FeatureSplit } from './FeatureSplit'
import { PageHero } from './PageHero'

type Props = {
  namespace: 'shopPage' | 'foodPage'
  pathname: '/shop' | '/food'
  screen: AppScreen['key']
}

// Shop and Food (PLAN.md §6, FR-PG-05): marketing pages for what the same app offers, ending
// with the seller/kitchen sign-up on /become-a-pro.
export async function AppOfferPage({ namespace, pathname, screen }: Props) {
  const [t, cta] = await Promise.all([getTranslations(namespace), getTranslations('ctaBand')])

  return (
    <main id="main">
      <PageHero
        breadcrumbs={[{ label: t('eyebrow'), href: pathname }]}
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
      >
        <GetTheApp label={cta('book')} size="lg" />
      </PageHero>
      <FeatureSplit
        id="features"
        screen={screen}
        columns={[{ title: t('features.title'), points: t.raw('features.points') as string[] }]}
      />
      <CtaBand
        title={t('sell.title')}
        body={t('sell.body')}
        secondary={{ label: t('sell.cta'), href: '/become-a-pro' }}
      />
    </main>
  )
}
