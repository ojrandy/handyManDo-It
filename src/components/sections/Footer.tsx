import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'

import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { StoreBadges } from '@/components/ui/StoreBadges'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { services } from '@/lib/services'
import { site } from '@/lib/site'

const socials = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'x', label: 'X' },
  { key: 'youtube', label: 'YouTube' },
] as const

const linkClass = 'text-sm text-white/70 transition-colors hover:text-white'

// Footer (docs/PLAN.md §5.17, FR-GLB-02). Contact data comes from lib/site, which seeds the `site`
// global; it switches to the global when pages start reading Payload (Phase 1).
export async function Footer() {
  const [t, nav, s, hero, locale] = await Promise.all([
    getTranslations('footer'),
    getTranslations('nav'),
    getTranslations('services'),
    getTranslations('hero'),
    getLocale() as Promise<Locale>,
  ])
  const year = new Date().getFullYear()

  const company = [
    { href: '/about', label: t('links.about') },
    { href: '/our-work', label: t('links.ourWork') },
    { href: '/careers', label: t('links.careers') },
    { href: '/blog', label: t('links.blog') },
    { href: '/become-a-pro', label: t('links.becomeAPro') },
  ] as const
  const support = [
    { href: '/contact', label: t('links.contact') },
    { href: '/faq', label: t('links.faq') },
    { href: '/reviews', label: t('links.reviews') },
    { href: '/businesses', label: t('links.businesses') },
    { href: '/buildings', label: t('links.buildings') },
  ] as const
  const legal = [
    { href: '/legal/privacy', label: t('links.privacy') },
    { href: '/legal/terms', label: t('links.terms') },
    { href: '/legal/disclaimer', label: t('links.disclaimer') },
  ] as const

  return (
    <footer className="grain relative overflow-hidden bg-night-950 pt-20 pb-10 text-white">
      <div className="container-site">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Link href="/" aria-label={nav('home')} className="inline-flex items-center gap-3">
              <Image src="/brand/logo.jpg" alt="" width={52} height={47} className="rounded-lg" />
              <span className="font-display text-xl font-semibold">{site.name}</span>
            </Link>
            <p className="mt-6 font-display text-2xl font-semibold text-gold-300">{t('tagline')}</p>
            <p className="mt-2 text-sm text-white/60">{hero('values')}</p>
            <StoreBadges className="mt-8" />
          </div>

          <nav aria-label={t('label')} className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
                {t('columns.services')}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {services.slice(0, 6).map(({ key, slug }) => (
                  <li key={key}>
                    <Link
                      href={{ pathname: '/services/[slug]', params: { slug: slug[locale] } }}
                      className={linkClass}
                    >
                      {s(`${key}.short`)}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/services" className={`${linkClass} font-semibold text-gold-300`}>
                    {nav('allServices')}
                  </Link>
                </li>
              </ul>
            </div>
            {(
              [
                ['company', company],
                ['support', support],
                ['legal', legal],
              ] as const
            ).map(([column, links]) => (
              <div key={column}>
                <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
                  {t(`columns.${column}`)}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className={linkClass}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 grid gap-8 border-t border-white/10 pt-10 md:grid-cols-3">
          <address className="space-y-3 text-sm not-italic">
            <h2 className="text-sm font-semibold tracking-wide uppercase">{t('contactTitle')}</h2>
            <a
              href={`tel:${site.phone}`}
              className="flex items-center gap-2.5 text-white/80 hover:text-white"
            >
              <Phone aria-hidden className="size-4 text-gold-300" />
              <span>
                {site.phoneDisplay} <span className="text-white/50">· {t('call')}</span>
              </span>
            </a>
            <a
              href={`mailto:${site.email}`}
              className="flex items-center gap-2.5 text-white/80 hover:text-white"
            >
              <Mail aria-hidden className="size-4 text-gold-300" />
              {site.email}
            </a>
            <p className="flex items-center gap-2.5 text-white/80">
              <Clock aria-hidden className="size-4 text-gold-300" />
              {t('hours')}
            </p>
          </address>

          <div className="space-y-3 text-sm">
            {site.offices.map((office) => (
              <p key={office.key} className="flex gap-2.5 text-white/80">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-300" />
                <span>
                  <span className="block font-semibold text-white">
                    {t(`offices.${office.key}`)}
                  </span>
                  {office.address}, {office.city}
                </span>
              </p>
            ))}
          </div>

          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase">{t('follow')}</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {socials.map(({ key, label }) => (
                <li key={key}>
                  <a
                    href={site.socials[key]}
                    className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-4 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col-reverse items-start justify-between gap-6 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
          <p className="text-sm text-white/60">
            © {year} {site.name}. {t('rights')}
          </p>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  )
}
