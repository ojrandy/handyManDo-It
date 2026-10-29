import { describe, expect, it } from 'vitest'

import { pageMetadata, pathsFor } from '@/lib/seo'

describe('seo helpers', () => {
  it('resolves translated pathnames per locale', () => {
    expect(pathsFor('/our-work')).toEqual({ fr: '/fr/nos-realisations', en: '/en/our-work' })
    expect(pathsFor({ pathname: '/services/[slug]', params: { slug: 'x' } })).toEqual({
      fr: '/fr/services/x',
      en: '/en/services/x',
    })
  })

  it('sets the canonical to the page language and French as x-default', () => {
    const paths = { fr: '/fr/services/demenagement', en: '/en/services/moving' }
    const meta = pageMetadata({ locale: 'en', title: 'Moving', description: 'd', paths })
    expect(meta.alternates).toEqual({
      canonical: '/en/services/moving',
      languages: { ...paths, 'x-default': '/fr/services/demenagement' },
    })
  })
})
