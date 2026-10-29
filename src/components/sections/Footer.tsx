import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'

import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { NavAnchor } from '@/components/ui/NavAnchor'
import { StoreBadges } from '@/components/ui/StoreBadges'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getNavigation, type NavColumn, type NavLink } from '@/lib/navigation'
import { services } from '@/lib/services'
import { getSiteSettings } from '@/lib/settings'
import { site } from '@/lib/site'

const linkClass = 'text-sm text-white/70 transition-colors hover:text-white'

type Route = Extract<NavLink, { external: false }>['href'] & string
type OfficeKey = (typeof site.offices)[number]['key']

// The services overview link stands out at the end of its column, as in the built-in menu.
const isOverview = (link: NavLink) => !link.external && link.href === '/services'

// Footer (docs/PLAN.md §5.17, FR-GLB-02). Columns come from the `navigation` global, contact data
// from the `site` global (T-1.17); the built-in columns below cover an unfilled global.
export async function Footer() {
  const [t, nav, s, hero, locale] = await Promise.all([
    getTranslations('footer'),
    getTranslations('nav'),
    getTranslations('services'),
    getTranslations('hero'),
    getLocale() as Promise<Locale>,
  ])
  const [{ footer }, settings] = await Promise.all([getNavigation(locale), getSiteSettings(locale)])
  const year = new Date().getFullYear()

  const page = (label: string, href: Route): NavLink => ({
    key: href,
    label,
    external: false,
    href,
  })

  const columns: NavColumn[] = footer.length
    ? footer
    : [
        {
          key: 'services',
          title: t('columns.services'),
          links: [
            ...services.slice(0, 6).map<NavLink>(({ key, slug }) => ({
              key,
              label: s(`${key}.short`),
              external: false,
              href: { pathname: '/services/[slug]', params: { slug: slug[locale] } },
            })),
            page(nav('allServices'), '/services'),
          ],
        },
        {
          key: 'company',
          title: t('columns.company'),
          links: [
            page(t('links.about'), '/about'),
            page(t('links.ourWork'), '/our-work'),
            page(t('links.careers'), '/careers'),
            page(t('links.blog'), '/blog'),
            page(t('links.becomeAPro'), '/become-a-pro'),
          ],
        },
        {
          key: 'support',
          title: t('columns.support'),
          links: [
            page(t('links.contact'), '/contact'),
            page(t('links.faq'), '/faq'),
            page(t('links.reviews'), '/reviews'),
            page(t('links.businesses'), '/businesses'),
            page(t('links.buildings'), '/buildings'),
          ],
        },
        {
          key: 'legal',
          title: t('columns.legal'),
          links: [
            page(t('links.privacy'), '/legal/privacy'),
            page(t('links.terms'), '/legal/terms'),
            page(t('links.disclaimer'), '/legal/disclaimer'),
          ],
        },
      ]

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
            <StoreBadges
              className="mt-8"
              playStoreUrl={settings.playStoreUrl}
              appStoreUrl={settings.appStoreUrl}
            />
          </div>

          <nav aria-label={t('label')} className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((column) => (
              <div key={column.key}>
                <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
                  {column.title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.key}>
                      <NavAnchor
                        to={link}
                        className={
                          isOverview(link) ? `${linkClass} font-semibold text-gold-300` : linkClass
                        }
                      >
                        {link.label}
                      </NavAnchor>
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
              href={settings.phone.href}
              className="flex items-center gap-2.5 text-white/80 hover:text-white"
            >
              <Phone aria-hidden className="size-4 text-gold-300" />
              <span>
                {settings.phone.display} <span className="text-white/50">· {t('call')}</span>
              </span>
            </a>
            <a
              href={`mailto:${settings.email}`}
              className="flex items-center gap-2.5 text-white/80 hover:text-white"
            >
              <Mail aria-hidden className="size-4 text-gold-300" />
              {settings.email}
            </a>
            <p className="flex items-center gap-2.5 text-white/80">
              <Clock aria-hidden className="size-4 text-gold-300" />
              {settings.hours ?? t('hours')}
            </p>
          </address>

          <div className="space-y-3 text-sm">
            {settings.offices.map((office) => {
              const address = `${office.address}, ${office.city}`
              return (
                <p key={office.key} className="flex gap-2.5 text-white/80">
                  <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-300" />
                  <span>
                    <span className="block font-semibold text-white">
                      {office.label ?? t(`offices.${office.key as OfficeKey}`)}
                    </span>
                    {office.mapUrl ? (
                      <a
                        href={office.mapUrl}
                        className="underline-offset-4 hover:text-white hover:underline"
                      >
                        {address}
                      </a>
                    ) : (
                      address
                    )}
                  </span>
                </p>
              )
            })}
          </div>

          {settings.socials.length ? (
            <div>
              <h2 className="text-sm font-semibold tracking-wide uppercase">{t('follow')}</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {settings.socials.map(({ key, label, url }) => (
                  <li key={key}>
                    <a
                      href={url}
                      className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-4 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
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
