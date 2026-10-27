import { setRequestLocale } from 'next-intl/server'

import { Audiences } from '@/components/sections/Audiences'
import { DownloadBand } from '@/components/sections/DownloadBand'
import { Earn } from '@/components/sections/Earn'
import { Hero } from '@/components/sections/Hero'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { Numbers } from '@/components/sections/Numbers'
import { Pillars } from '@/components/sections/Pillars'

type Props = { params: Promise<{ locale: string }> }

// Home page, in docs/PLAN.md §5 order. Sections still to come slot in where marked (Phase 3).
export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main id="main">
      <Hero />
      {/* 5.3 Trusted by · 5.4 Services */}
      <Pillars />
      <Numbers />
      {/* 5.7 Scroll story */}
      <HowItWorks />
      {/* 5.9 Mini-demo · 5.10 Screens gallery · 5.11 Testimonials */}
      <Audiences />
      <Earn />
      {/* 5.14 FAQ */}
      <DownloadBand />
      {/* 5.16 Latest posts */}
    </main>
  )
}
