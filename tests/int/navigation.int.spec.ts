import { describe, expect, it } from 'vitest'

import { navigationFrom, resolveLink } from '@/lib/navigation'
import { siteSettingsFrom, telHref } from '@/lib/settings'
import { site } from '@/lib/site'
import type { Navigation, Service } from '@/payload-types'

// Pure helpers behind the header and footer's Payload reads (T-1.17). No database needed.

type Link = NonNullable<Navigation['header']>[number]['link']

const page = (label: string, path: Link['page']): Link => ({ label, type: 'page', page: path })

// At depth 1 a published doc arrives populated; one the public can't read stays an id.
const service = (slug: string) => ({ id: 7, slug }) as Service
const serviceLink = (label: string, value: number | Service): Link => ({
  label,
  type: 'doc',
  doc: { relationTo: 'services', value },
})

describe('resolveLink', () => {
  it('resolves site pages, docs and external URLs', () => {
    expect(resolveLink(page('À propos', '/about'))).toEqual({ external: false, href: '/about' })
    expect(resolveLink(serviceLink('Plomberie', service('plomberie')))).toEqual({
      external: false,
      href: { pathname: '/services/[slug]', params: { slug: 'plomberie' } },
    })
    expect(
      resolveLink({
        label: 'Projet',
        type: 'doc',
        doc: { relationTo: 'projects', value: { id: 1, slug: 'villa' } as never },
      }),
    ).toEqual({
      external: false,
      href: { pathname: '/our-work/[slug]', params: { slug: 'villa' } },
    })
    expect(
      resolveLink({ label: 'App', type: 'external', url: 'https://app.handymandoit.com' }),
    ).toEqual({ external: true, href: 'https://app.handymandoit.com' })
  })

  it('skips docs the public cannot read and half-filled rows', () => {
    expect(resolveLink(serviceLink('Brouillon', 7))).toBeNull()
    expect(resolveLink(page('Vide', null))).toBeNull()
    expect(resolveLink({ label: 'Vide', type: 'external', url: '' })).toBeNull()
    expect(resolveLink(undefined)).toBeNull()
  })
})

describe('navigationFrom', () => {
  it('is empty while the global is unfilled, so the built-in menus show', () => {
    expect(navigationFrom({})).toEqual({ header: [], footer: [] })
  })

  it('keeps one mega-menu: the first item with resolvable sub-links', () => {
    const { header } = navigationFrom({
      header: [
        {
          id: 'a',
          link: page('Services', '/services'),
          children: [{ link: serviceLink('Brouillon', 7) }],
        },
        {
          id: 'b',
          link: page('Entreprises', '/businesses'),
          children: [
            { id: 'b1', link: serviceLink('Plomberie', service('plomberie')), icon: 'wrench' },
          ],
        },
        {
          id: 'c',
          link: page('Immeubles', '/buildings'),
          children: [{ id: 'c1', link: page('Avis', '/reviews') }],
        },
      ],
    })
    // The first item's only sub-link is unpublished, so it is a plain link and the second opens.
    expect(header.map(({ key, children }) => [key, children?.length])).toEqual([
      ['a', undefined],
      ['b', 1],
      ['c', undefined],
    ])
    expect(header[1].children?.[0]).toMatchObject({
      key: 'b1',
      label: 'Plomberie',
      icon: 'wrench',
      description: null,
    })
  })

  it('drops unlinkable footer links and columns left empty', () => {
    const { footer } = navigationFrom({
      footerColumns: [
        { id: 'x', title: 'Société', links: [{ link: page('À propos', '/about') }] },
        { id: 'y', title: 'Vide', links: [{ link: serviceLink('Brouillon', 7) }] },
      ],
    })
    expect(footer).toEqual([
      {
        key: 'x',
        title: 'Société',
        links: [{ key: '0', label: 'À propos', external: false, href: '/about' }],
      },
    ])
  })
})

describe('siteSettingsFrom', () => {
  it('falls back to src/lib/site while the global is empty', () => {
    const settings = siteSettingsFrom({})
    expect(settings.phone).toEqual({ display: site.phoneDisplay, href: `tel:${site.phone}` })
    expect(settings.whatsappUrl).toBe(site.whatsappUrl)
    expect(settings.hours).toBeNull()
    expect(settings.offices.map(({ key, label }) => [key, label])).toEqual([
      ['technical', null],
      ['office', null],
    ])
    expect(settings.socials).toEqual([])
  })

  it('uses the editor values and hides emptied socials', () => {
    const settings = siteSettingsFrom({
      phone: '+237 600 00 00 00',
      hours: 'Tous les jours',
      offices: [
        {
          id: 'o1',
          label: 'Siège',
          address: 'Rue 1',
          city: 'Douala',
          mapUrl: 'javascript:alert(1)',
        },
      ],
      facebook: 'https://facebook.com/x',
      instagram: '',
      x: null,
    })
    expect(settings.phone.href).toBe('tel:+237600000000')
    expect(settings.hours).toBe('Tous les jours')
    // Only http(s) map links are rendered.
    expect(settings.offices).toEqual([
      { key: 'o1', label: 'Siège', address: 'Rue 1', city: 'Douala', mapUrl: null },
    ])
    expect(settings.socials).toEqual([
      { key: 'facebook', label: 'Facebook', url: 'https://facebook.com/x' },
    ])
  })

  it('formats tel: links from a displayed number', () => {
    expect(telHref('+237 652 767 674')).toBe('tel:+237652767674')
  })
})
