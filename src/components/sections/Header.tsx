import { Wrench } from 'lucide-react'
import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'

import { GetTheApp } from '@/components/ui/GetTheApp'
import { iconFor } from '@/components/ui/icons'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { StoreBadges } from '@/components/ui/StoreBadges'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getNavigation } from '@/lib/navigation'
import { services } from '@/lib/services'
import { site } from '@/lib/site'

import { HeaderShell, type HeaderItem } from './HeaderShell'

const iconClass = 'size-5'

type Route = Extract<HeaderItem, { external: false }>['href'] & string

// Menu from the `navigation` global (T-1.17); the built-in menu below covers an unfilled global.
export async function Header() {
  const [t, s, locale] = await Promise.all([
    getTranslations('nav'),
    getTranslations('services'),
    getLocale() as Promise<Locale>,
  ])
  const { header } = await getNavigation(locale)

  const page = (key: string, label: string, href: Route): HeaderItem => ({
    key,
    label,
    external: false,
    href,
  })

  const items: HeaderItem[] = header.length
    ? header.map(({ children, ...item }) => ({
        ...item,
        children: children?.map(({ icon, ...entry }) => {
          const Icon = iconFor(icon, Wrench)
          return { ...entry, icon: <Icon className={iconClass} strokeWidth={1.75} /> }
        }),
      }))
    : [
        {
          ...page('services', t('services'), '/services'),
          children: services.map(({ key, slug, icon: Icon }) => ({
            key,
            label: s(`${key}.name`),
            description: s(`${key}.blurb`),
            external: false,
            href: { pathname: '/services/[slug]', params: { slug: slug[locale] } },
            icon: <Icon className={iconClass} strokeWidth={1.75} />,
          })),
        },
        page('businesses', t('businesses'), '/businesses'),
        page('becomeAPro', t('becomeAPro'), '/become-a-pro'),
        page('ourWork', t('ourWork'), '/our-work'),
        page('about', t('about'), '/about'),
        page('blog', t('blog'), '/blog'),
      ]

  const logo = (
    <Link href="/" aria-label={t('home')} className="flex shrink-0 items-center gap-3 rounded-lg">
      <Image src="/brand/logo.jpg" alt="" width={44} height={40} priority className="rounded-lg" />
      <span className="hidden font-display text-lg font-semibold tracking-tight text-white sm:inline">
        {site.name}
      </span>
    </Link>
  )

  return (
    <HeaderShell
      logo={logo}
      actions={
        <>
          <LanguageSwitcher />
          {/* Phones get the store badge in the menu and the hero's own CTA. */}
          <div className="hidden sm:block">
            <GetTheApp size="sm" />
          </div>
        </>
      }
      mobileFooter={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <StoreBadges />
          <LanguageSwitcher />
        </div>
      }
      items={items}
      labels={{
        main: t('main'),
        menuIntro: t('servicesIntro'),
        menuAll: t('allServices'),
        openMenu: t('openMenu'),
        closeMenu: t('closeMenu'),
      }}
    />
  )
}
