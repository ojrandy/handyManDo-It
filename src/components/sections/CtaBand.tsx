import { ArrowUpRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { buttonClasses } from '@/components/ui/button'
import { GetTheApp } from '@/components/ui/GetTheApp'
import { Link } from '@/i18n/navigation'
import type { Href } from '@/lib/seo'

type Props = {
  title?: string
  body?: string
  // Second action; defaults to the quote form on /contact.
  secondary?: { label: string; href: Href }
}

// Closing call to action of inner pages: book in the app, or ask for a quote (FR-GLB-04).
export async function CtaBand({ title, body, secondary }: Props) {
  const t = await getTranslations('ctaBand')
  const second = secondary ?? { label: t('quote'), href: '/contact' }

  return (
    <section
      aria-labelledby="cta-title"
      className="grain relative overflow-hidden bg-night-900 py-16 text-white md:py-20"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(50%_80%_at_20%_100%,rgb(231_171_52/0.2),transparent_70%)]"
      />
      <div className="container-site relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
        <div className="max-w-2xl">
          <h2 id="cta-title" className="text-3xl leading-tight font-bold sm:text-4xl">
            {title ?? t('title')}
          </h2>
          <p className="mt-4 text-lg text-white/75">{body ?? t('body')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <GetTheApp label={t('book')} size="lg" />
          <Link href={second.href} className={buttonClasses({ variant: 'secondary', size: 'lg' })}>
            {second.label}
            <ArrowUpRight aria-hidden className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
