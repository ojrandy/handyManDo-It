import { setRequestLocale } from 'next-intl/server'

import { Audiences } from '@/components/sections/Audiences'
import { DownloadBand } from '@/components/sections/DownloadBand'
import { Earn } from '@/components/sections/Earn'
import { FaqTeaser } from '@/components/sections/FaqTeaser'
import { Hero } from '@/components/sections/Hero'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { LatestPosts } from '@/components/sections/LatestPosts'
import { MiniDemo } from '@/components/sections/MiniDemo'
import { Numbers } from '@/components/sections/Numbers'
import { Pillars } from '@/components/sections/Pillars'
import { ScreensGallery } from '@/components/sections/ScreensGallery'
import { ScrollStory } from '@/components/sections/ScrollStory'
import { ServicesBento } from '@/components/sections/ServicesBento'
import { Testimonials } from '@/components/sections/Testimonials'
import { TrustedBy } from '@/components/sections/TrustedBy'

type Props = { params: Promise<{ locale: string }> }

// Home page, in docs/PLAN.md §5 order.
export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main id="main">
      <Hero />
      <TrustedBy />
      <ServicesBento />
      <Pillars />
      <Numbers />
      <ScrollStory />
      <HowItWorks />
      <MiniDemo />
      <ScreensGallery />
      <Testimonials />
      <Audiences />
      <Earn />
      <FaqTeaser />
      <DownloadBand />
      <LatestPosts />
    </main>
  )
}
