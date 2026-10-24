import { setRequestLocale } from 'next-intl/server'

import { Hero } from '@/components/sections/Hero'

type Props = { params: Promise<{ locale: string }> }

// Home page. Phase 2 ships the hero; the remaining sections follow in Phase 3 (docs/PLAN.md §5).
export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main id="main">
      <Hero />
    </main>
  )
}
