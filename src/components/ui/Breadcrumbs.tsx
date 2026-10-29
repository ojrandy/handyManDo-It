import { ChevronRight } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'

import { getPathname, Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { absoluteUrl, type Href } from '@/lib/seo'

import { JsonLd } from './JsonLd'

export type Crumb = { label: string; href: Href }

// Trail from Home to the current page (the last crumb: plain text, aria-current), plus its
// BreadcrumbList structured data (FR-SEO-03). Sits on the dark page hero.
export async function Breadcrumbs({ items }: { items: Crumb[] }) {
  const [t, locale] = await Promise.all([getTranslations('breadcrumbs'), getLocale()])
  const trail: Crumb[] = [{ label: t('home'), href: '/' }, ...items]

  return (
    <nav aria-label={t('label')} className="mb-8 text-sm text-white/70">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {trail.map(({ label, href }, index) => {
          const current = index === trail.length - 1
          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 ? <ChevronRight aria-hidden className="size-3.5 text-white/40" /> : null}
              {current ? (
                <span aria-current="page" className="text-white">
                  {label}
                </span>
              ) : (
                <Link href={href} className="underline-offset-4 hover:text-white hover:underline">
                  {label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: trail.map(({ label, href }, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: label,
            item: absoluteUrl(getPathname({ locale: locale as Locale, href })),
          })),
        }}
      />
    </nav>
  )
}
