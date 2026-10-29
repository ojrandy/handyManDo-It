'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { useTransition } from 'react'

import { usePathname, useRouter } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'

// Switches language while staying on the equivalent (translated) page.
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const t = useTranslations('language')
  const current = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const [isPending, startTransition] = useTransition()

  function select(locale: Locale) {
    // Slug pages translate the slug (/fr/services/demenagement ↔ /en/services/moving), so the
    // current params would lead to a 404. Their hreflang alternate (src/lib/seo.ts) names the
    // page in the other language.
    const alternate = document.querySelector<HTMLLinkElement>(
      `link[rel="alternate"][hreflang="${locale}"]`,
    )
    const translated =
      alternate && new URL(alternate.href).pathname.replace(new RegExp(`^/${locale}(?=/|$)`), '')
    startTransition(() => {
      if (translated) {
        // @ts-expect-error -- an already localized path; next-intl passes unknown paths through
        router.replace(translated, { locale })
      } else {
        // @ts-expect-error -- params always match the current pathname
        router.replace({ pathname, params }, { locale })
      }
    })
  }

  return (
    <div
      role="group"
      aria-label={t('label')}
      className={`inline-flex rounded-full border border-white/15 bg-white/5 p-0.5 text-xs font-semibold tracking-wide ${isPending ? 'opacity-60' : ''} ${className}`}
    >
      {routing.locales.map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          aria-pressed={current === locale}
          aria-label={t(locale)}
          onClick={() => select(locale)}
          className="rounded-full px-3 py-1.5 uppercase transition-colors aria-pressed:bg-white aria-pressed:text-night-900 text-white/75 hover:text-white"
        >
          {locale}
        </button>
      ))}
    </div>
  )
}
