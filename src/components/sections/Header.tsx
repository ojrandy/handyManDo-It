import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'

import { GetTheApp } from '@/components/ui/GetTheApp'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { StoreBadges } from '@/components/ui/StoreBadges'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { services } from '@/lib/services'
import { site } from '@/lib/site'

import { HeaderShell, type HeaderNavItem } from './HeaderShell'

export async function Header() {
  const [t, s, locale] = await Promise.all([
    getTranslations('nav'),
    getTranslations('services'),
    getLocale() as Promise<Locale>,
  ])

  const navItems: HeaderNavItem[] = [
    { key: 'businesses', label: t('businesses'), href: '/businesses' },
    { key: 'becomeAPro', label: t('becomeAPro'), href: '/become-a-pro' },
    { key: 'ourWork', label: t('ourWork'), href: '/our-work' },
    { key: 'about', label: t('about'), href: '/about' },
    { key: 'blog', label: t('blog'), href: '/blog' },
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
      services={services.map(({ key, slug, icon: Icon }) => ({
        key,
        name: s(`${key}.name`),
        blurb: s(`${key}.blurb`),
        href: { pathname: '/services/[slug]', params: { slug: slug[locale] } },
        icon: <Icon className="size-5" strokeWidth={1.75} />,
      }))}
      navItems={navItems}
      labels={{
        main: t('main'),
        services: t('services'),
        servicesIntro: t('servicesIntro'),
        allServices: t('allServices'),
        openMenu: t('openMenu'),
        closeMenu: t('closeMenu'),
      }}
    />
  )
}
