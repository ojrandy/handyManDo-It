import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { site } from '@/lib/site'

type Props = { params: Promise<{ locale: string }> }

// Phase 0 placeholder: proves routing, fonts and tokens end to end.
// The synced-story hero replaces this in Phase 2 (docs/PLAN.md §5.2).
export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('hero')
  const nav = await getTranslations('nav')

  return (
    <div className="grain min-h-dvh bg-night-900 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_75%_30%,rgb(28_93_112/0.55),transparent_70%),radial-gradient(40%_35%_at_15%_85%,rgb(231_171_52/0.14),transparent_70%)]"
      />

      <header className="container-site flex items-center justify-between py-5">
        <a href={`/${locale}`} className="flex items-center gap-3">
          <Image
            src="/brand/logo.jpg"
            alt={site.name}
            width={48}
            height={43}
            priority
            className="rounded-lg"
          />
          <span className="font-display text-lg font-semibold tracking-tight">{site.name}</span>
        </a>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <a
            href={site.playStoreUrl}
            className="hidden rounded-full bg-gold-500 px-5 py-2.5 text-sm font-semibold text-night-900 shadow-glow transition-colors hover:bg-gold-300 sm:inline-flex"
          >
            {nav('getTheApp')}
          </a>
        </div>
      </header>

      <main id="main" className="container-site flex min-h-[calc(100dvh-88px)] flex-col justify-center py-16">
        <p className="mb-6 text-sm font-medium tracking-[0.2em] text-gold-300 uppercase">
          {t('eyebrow')}
        </p>
        <h1 className="max-w-4xl text-5xl leading-[1.05] font-bold sm:text-6xl lg:text-7xl">
          {t('titleStart')}{' '}
          <span className="bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">
            {t('titleHighlight')}
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75">{t('subtitle')}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href={site.webAppUrl}
            className="rounded-full bg-gold-500 px-7 py-3.5 font-semibold text-night-900 shadow-glow transition-colors hover:bg-gold-300"
          >
            {t('primaryCta')}
          </a>
          <a
            href={site.playStoreUrl}
            className="rounded-full border border-white/20 px-7 py-3.5 font-semibold text-white transition-colors hover:bg-white/10"
          >
            {t('secondaryCta')}
          </a>
        </div>
        <p className="mt-12 text-sm tracking-wide text-white/50">{t('values')}</p>
      </main>
    </div>
  )
}
