import { Clock, Mail, MapPin, Phone, type LucideIcon } from 'lucide-react'
import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'
import type React from 'react'

import { CmsImage } from '@/components/ui/CmsImage'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { NavAnchor } from '@/components/ui/NavAnchor'
import { StoreBadges } from '@/components/ui/StoreBadges'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getSisterProducts } from '@/lib/home'
import type { ImageSource } from '@/lib/media'
import {
  balanceFooter,
  getNavigation,
  isOverview,
  type NavColumn,
  type NavLink,
} from '@/lib/navigation'
import { services } from '@/lib/services'
import { getSiteSettings } from '@/lib/settings'
import { site } from '@/lib/site'

const linkClass = 'text-[13px] text-white/70 transition-colors hover:text-white sm:text-sm'
const overviewClass =
  'text-[13px] font-semibold text-gold-300 transition-colors hover:text-white sm:text-sm'
const titleClass = 'text-xs font-semibold tracking-wide text-white uppercase sm:text-sm'

// One column per link list; phones keep three side by side, sized to their labels so French fits
// from 360 px, and four as two pairs.
const menuGrids: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-[repeat(3,auto)] justify-between sm:grid-cols-3 sm:justify-normal',
  4: 'grid-cols-2 sm:grid-cols-4',
}

// Sets per marquee half: 5 logos × 76 px ≈ 380 px, so three cover the widest track (≈ 900 px).
const marqueeRepeats = 3

// Logo only (owner, 2026-11-07): the aria-label names the link, the title shows the name on
// hover. Marquee copies are hidden from assistive tech and the tab order.
function GroupLogo({
  name,
  url,
  sources,
  label,
  hidden = false,
}: {
  name: string
  url: string
  sources: ImageSource[]
  label: string
  hidden?: boolean
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      aria-label={hidden ? undefined : label}
      title={name}
      tabIndex={hidden ? -1 : undefined}
      className="block rounded-xl"
    >
      <CmsImage
        sources={sources}
        alt=""
        width={56}
        height={56}
        className="size-14 rounded-xl object-cover ring-1 ring-white/15 transition hover:ring-white/50"
      />
    </a>
  )
}

type Route = Extract<NavLink, { external: false }>['href'] & string
type OfficeKey = (typeof site.offices)[number]['key']
type InfoRow = { key: string; icon: LucideIcon; label: string; value: string; href?: string }

// Footer (docs/PLAN.md §5.17, FR-GLB-02). Columns come from the `navigation` global, contact data
// from the `site` global (T-1.17); the built-in columns below cover an unfilled global. Every
// column holds the same number of rows (balanceFooter); what doesn't fit goes to the bottom bar.
export async function Footer() {
  const [t, nav, s, hero, locale] = await Promise.all([
    getTranslations('footer'),
    getTranslations('nav'),
    getTranslations('services'),
    getTranslations('hero'),
    getLocale() as Promise<Locale>,
  ])
  const [{ footer }, settings, sisterProducts] = await Promise.all([
    getNavigation(locale),
    getSiteSettings(locale),
    getSisterProducts(locale),
  ])
  const year = new Date().getFullYear()

  const page = (label: string, href: Route): NavLink => ({
    key: href,
    label,
    external: false,
    href,
  })

  const source: NavColumn[] = footer.length
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

  const { columns, bottom } = balanceFooter(source)
  const rows = columns[0]?.links.length ?? 0

  // Three columns of two rows each: same shape, same reading order.
  const info: { key: string; title: string; rows: InfoRow[] }[] = [
    {
      key: 'contact',
      title: t('contactTitle'),
      rows: [
        {
          key: 'phone',
          icon: Phone,
          label: t('call'),
          value: settings.phone.display,
          href: settings.phone.href,
        },
        {
          key: 'email',
          icon: Mail,
          label: t('email'),
          value: settings.email,
          href: `mailto:${settings.email}`,
        },
      ],
    },
    {
      // Support (phone/WhatsApp) and office visits keep different hours (Q-19).
      key: 'hours',
      title: t('hoursTitle'),
      rows: [
        {
          key: 'support',
          icon: Clock,
          label: t('supportLabel'),
          value: settings.hours ?? t('hours'),
        },
        {
          key: 'offices',
          icon: Clock,
          label: t('officeHoursLabel'),
          value: settings.officeHours ?? t('officeHours'),
        },
      ],
    },
    {
      key: 'offices',
      title: t('officesTitle'),
      rows: settings.offices.map((office) => ({
        key: office.key,
        icon: MapPin,
        label: office.label ?? t(`offices.${office.key as OfficeKey}`),
        value: `${office.address}, ${office.city}`,
        href: office.mapUrl ?? undefined,
      })),
    },
  ]
  const infoRows = Math.max(...info.map((group) => group.rows.length))

  return (
    <footer className="grain relative overflow-hidden bg-night-950 pt-20 pb-24 text-white xl:pb-10">
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

          {/* Subgrid: the rows line up across columns even when a long label wraps on a phone. */}
          <nav
            aria-label={t('label')}
            className={`grid gap-x-3 gap-y-2.5 sm:gap-x-8 ${
              menuGrids[columns.length] ?? 'grid-cols-2 sm:grid-cols-4'
            }`}
          >
            {columns.map((column) => (
              <div
                key={column.key}
                className="grid grid-rows-subgrid"
                style={{ gridRow: `span ${rows + 1}` }}
              >
                <h2 className={`${titleClass} mb-1.5`}>{column.title}</h2>
                <ul className="grid grid-rows-subgrid" style={{ gridRow: `span ${rows}` }}>
                  {column.links.map((link) => (
                    <li key={link.key}>
                      <NavAnchor to={link} className={isOverview(link) ? overviewClass : linkClass}>
                        {/* Short here, whatever the CMS calls it: three columns must fit a phone. */}
                        {isOverview(link) ? t('links.allServices') : link.label}
                      </NavAnchor>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <address className="mt-14 grid gap-x-8 gap-y-3 border-t border-white/10 pt-10 text-sm not-italic md:grid-cols-3">
          {info.map((group) => (
            <div
              key={group.key}
              className="mb-5 grid gap-y-3 last:mb-0 md:mb-0 md:grid-rows-subgrid md:[grid-row:span_var(--rows)]"
              style={{ '--rows': infoRows + 1 } as React.CSSProperties}
            >
              <h2 className={titleClass}>{group.title}</h2>
              {group.rows.map(({ key, icon: Icon, label, value, href }) => (
                <p key={key} className="flex gap-2.5 text-white/80">
                  <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-300" />
                  <span className="min-w-0">
                    <span className="block font-semibold text-white">{label}</span>
                    {href ? (
                      <a
                        href={href}
                        className="break-words underline-offset-4 hover:text-white hover:underline"
                      >
                        {value}
                      </a>
                    ) : (
                      value
                    )}
                  </span>
                </p>
              ))}
            </div>
          ))}
        </address>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-5 border-t border-white/10 pt-8">
          {settings.socials.length ? (
            <ul aria-label={t('follow')} className="flex flex-wrap gap-2">
              {settings.socials.map(({ key, label, url }) => (
                <li key={key}>
                  <a
                    href={url}
                    className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-3 text-sm text-white/80 hover:bg-white/10 hover:text-white sm:px-4"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <span />
          )}
          <LanguageSwitcher />
        </div>

        <div className="mt-8 grid gap-8 border-t border-white/10 pt-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-10">
          <section aria-labelledby="footer-parent-title" className="flex items-center gap-4">
            <h2 id="footer-parent-title" className={titleClass}>
              {t('group.parent')}
            </h2>
            <GroupLogo
              name={site.parentCompany.name}
              url={site.parentCompany.url}
              sources={[{ url: site.parentCompany.logo, width: 300 }]}
              label={t('group.visit', { name: site.parentCompany.name })}
            />
          </section>

          {sisterProducts.length > 0 && (
            <section
              aria-labelledby="footer-group-title"
              className="min-w-0 lg:flex lg:items-center lg:gap-8 lg:border-l lg:border-white/10 lg:pl-10"
            >
              <h2 id="footer-group-title" className={`${titleClass} shrink-0`}>
                {t('group.title')}
              </h2>
              {/* Logo marquee (owner, 2026-11-10), CSS only like the home partner row. Each half
                  repeats the set so it is wider than the track and the loop has no gap; only the
                  first set is in the accessibility tree and the tab order. Pauses on hover and
                  focus; under reduced motion it is one static, wrapped row. */}
              <div className="group mt-4 overflow-hidden py-1 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] lg:mt-0 lg:flex-1 motion-reduce:[mask-image:none]">
                <div className="flex w-max motion-safe:animate-marquee group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused] motion-reduce:w-full">
                  {[0, 1].map((half) => (
                    <ul
                      key={half}
                      aria-hidden={half === 1 || undefined}
                      className={`flex shrink-0 motion-reduce:flex-wrap motion-reduce:gap-y-4 ${
                        half === 1 ? 'motion-reduce:hidden' : ''
                      }`}
                    >
                      {Array.from({ length: marqueeRepeats }, (_, round) =>
                        sisterProducts.map(({ key, name, url, sources }) => {
                          const copy = half > 0 || round > 0
                          return (
                            <li
                              key={`${key}-${round}`}
                              aria-hidden={(half === 0 && copy) || undefined}
                              className={`shrink-0 pr-5 ${copy ? 'motion-reduce:hidden' : ''}`}
                            >
                              <GroupLogo
                                name={name}
                                url={url}
                                sources={sources}
                                label={t('group.visit', { name })}
                                hidden={copy}
                              />
                            </li>
                          )
                        }),
                      )}
                    </ul>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="mt-8 grid gap-4 border-t border-white/10 pt-8 text-sm text-white/60 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-8">
          <p>
            © {year} {site.name}. {t('rights')}
          </p>
          {bottom.length ? (
            <nav aria-label={t('columns.legal')}>
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {bottom.map((link) => (
                  <li key={link.key}>
                    <NavAnchor to={link} className="transition-colors hover:text-white">
                      {link.label}
                    </NavAnchor>
                  </li>
                ))}
                {/* Reopens the consent banner (FR-ANA-01); only when analytics are configured. */}
                {process.env.NEXT_PUBLIC_GA_ID ? (
                  <li>
                    <button
                      type="button"
                      data-consent-open
                      className="transition-colors hover:text-white"
                    >
                      {t('links.cookies')}
                    </button>
                  </li>
                ) : null}
              </ul>
            </nav>
          ) : (
            <span />
          )}
          <p className="lg:text-right">
            {t.rich('credit', {
              company: (name) => (
                <a
                  href={site.developerUrl}
                  target="_blank"
                  rel="noopener"
                  className="font-semibold text-white/85 underline-offset-4 hover:text-white hover:underline"
                >
                  {name}
                </a>
              ),
            })}
          </p>
        </div>
      </div>
    </footer>
  )
}
