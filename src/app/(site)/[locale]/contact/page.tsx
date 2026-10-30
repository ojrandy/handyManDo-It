import { Clock, ExternalLink, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ContactForms } from '@/components/forms/ContactForms'
import { PageHero } from '@/components/sections/PageHero'
import type { Locale } from '@/i18n/routing'
import { getServices } from '@/lib/catalog'
import { pageMetadata, pathsFor } from '@/lib/seo'
import { getSiteSettings } from '@/lib/settings'
import type { site } from '@/lib/site'

type Props = { params: Promise<{ locale: string }> }

type OfficeKey = (typeof site.offices)[number]['key']

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale as Locale
  const t = await getTranslations({ locale, namespace: 'contactPage' })
  return pageMetadata({
    locale,
    title: t('metaTitle'),
    description: t('metaDescription'),
    paths: pathsFor('/contact'),
  })
}

// Contact (PLAN.md §6, FR-PG-13): question / quote / partnership forms, WhatsApp, phone, email,
// hours and both offices with "Open in Maps" links instead of an embedded map (ADR-024).
export default async function ContactPage({ params }: Props) {
  const locale = (await params).locale as Locale
  setRequestLocale(locale)
  const [t, footer, settings, services] = await Promise.all([
    getTranslations('contactPage'),
    getTranslations('footer'),
    getSiteSettings(locale),
    getServices(locale),
  ])

  const channels = [
    {
      key: 'whatsapp',
      icon: MessageCircle,
      title: t('channels.whatsapp'),
      body: t('channels.whatsappBody'),
      href: settings.whatsappUrl,
      external: true,
    },
    {
      key: 'call',
      icon: Phone,
      title: t('channels.call'),
      body: settings.phone.display,
      href: settings.phone.href,
      external: false,
    },
    {
      key: 'email',
      icon: Mail,
      title: t('channels.email'),
      body: settings.email,
      href: `mailto:${settings.email}`,
      external: false,
    },
  ]

  return (
    <main id="main">
      <PageHero
        breadcrumbs={[{ label: t('eyebrow'), href: '/contact' }]}
        eyebrow={t('eyebrow')}
        title={t('title')}
        lead={t('lead')}
      />

      <section aria-label={t('chooser.legend')} className="bg-mist-50 py-16 md:py-24">
        <div className="container-site grid gap-12 lg:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
          <ContactForms
            services={services.map(({ key, slug, title }) => ({ key: key ?? slug, title }))}
          />

          <aside aria-labelledby="channels-title" className="space-y-8">
            <h2 id="channels-title" className="font-display text-xl font-semibold text-teal-700">
              {t('channels.title')}
            </h2>
            <ul className="space-y-3">
              {channels.map(({ key, icon: Icon, title, body, href, external }) => (
                <li key={key}>
                  <a
                    href={href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="flex items-center gap-4 rounded-panel bg-white p-5 ring-1 ring-mist-200 transition-shadow hover:shadow-float"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-teal-600 text-white">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-teal-700">{title}</span>
                      <span className="block truncate text-slate-500">{body}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="rounded-panel bg-white p-5 ring-1 ring-mist-200">
              <h3 className="flex items-center gap-2 font-display font-semibold text-teal-700">
                <Clock aria-hidden className="size-5 text-teal-600" />
                {t('channels.hours')}
              </h3>
              <p className="mt-2 text-slate-500">{settings.hours ?? footer('hours')}</p>
            </div>

            <div>
              <h3 className="font-display font-semibold text-teal-700">{t('channels.offices')}</h3>
              <ul className="mt-3 space-y-3">
                {settings.offices.map((office) => (
                  <li
                    key={office.key}
                    className="flex items-start gap-4 rounded-panel bg-white p-5 ring-1 ring-mist-200"
                  >
                    <MapPin aria-hidden className="mt-0.5 size-5 shrink-0 text-teal-600" />
                    <div>
                      <p className="font-semibold text-teal-700">
                        {office.label ?? footer(`offices.${office.key as OfficeKey}`)}
                      </p>
                      <p className="text-slate-500">
                        {office.address}, {office.city}
                      </p>
                      <a
                        href={
                          office.mapUrl ??
                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${office.address}, ${office.city}, Cameroon`,
                          )}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 underline underline-offset-4"
                      >
                        {t('channels.openMap')}
                        <ExternalLink aria-hidden className="size-3.5" />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
