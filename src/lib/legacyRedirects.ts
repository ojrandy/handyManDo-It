import { site } from './site'

// 301s from the old handymandoit.com (PLAN.md §8, FR-SEO-05), read from the live site's pages and
// WordPress sitemaps on 2026-11-08. The old site was English only, so every old URL goes to the
// English page holding the same content (ADR-035); French visitors switch language from there.
// Shared with tests/e2e/redirects.e2e.spec.ts, which checks each one is a single 301 hop.
// Paths must be literal (no regex) except the marked patterns, so the test can request them.

type Redirect = { source: string; destination: string; statusCode: 301 }

const pages: Record<string, string> = {
  '/index.html': '/en',
  '/company-info.html': '/en/about',
  '/affiliations.html': '/en/about#partners',
  '/csr-policy.html': '/en/about#csr',
  '/our-works.html': '/en/our-work',
  '/reviews.html': '/en/reviews',
  '/careers.html': '/en/careers',
  '/contact-us.html': '/en/contact',
  '/disclaimer.html': '/en/legal/disclaimer',
  '/services-details.html': '/en/services',
  '/interior-exterior-design.html': '/en/services/interior-exterior-design',
  '/upholstery-funiture.html': '/en/services/upholstery-furniture',
  '/repairs-installations.html': '/en/services/repairs-installations',
  '/home-office-remodelling.html': '/en/services/remodeling',
  '/signage-signboards.html': '/en/services/signage',
  '/events-design-setup.html': '/en/services/events',
  // WordPress pages, with and without the trailing slash WordPress used.
  '/blog/': '/en/blog',
  '/blog/latest-insights': '/en/blog',
  '/blog/latest-insights/': '/en/blog',
  '/blog/contact-us': '/en/contact',
  '/blog/contact-us/': '/en/contact',
  '/blog/feed': '/en/blog',
  '/blog/feed/': '/en/blog',
  // WooCommerce: the shop now lives in the app.
  '/shop/': site.webAppUrl,
}

// Patterns: WordPress archives and dated permalinks (the 20 articles keep their slug), and the
// three shop products. `/blog` and `/shop` without a slash are left to the locale middleware,
// because they are also what a visitor of the new site types.
const patterns: Redirect[] = [
  {
    source: '/blog/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/:slug/',
    destination: '/en/blog/:slug',
    statusCode: 301,
  },
  {
    source: '/blog/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/:slug',
    destination: '/en/blog/:slug',
    statusCode: 301,
  },
  {
    source: '/blog/:archive(category|tag|page|author)/:rest*',
    destination: '/en/blog',
    statusCode: 301,
  },
  { source: '/shop/:rest+', destination: site.webAppUrl, statusCode: 301 },
]

export const legacyRedirects: Redirect[] = [
  ...Object.entries(pages).map(([source, destination]) => ({
    source,
    destination,
    statusCode: 301 as const,
  })),
  ...patterns,
]

// Concrete old URLs for the redirect test, one per rule plus real articles and products.
export const legacyRedirectSamples: [from: string, to: string][] = [
  ...Object.entries(pages),
  [
    '/blog/2026/01/22/professional-carpentry-installations-design-services-for-homes-and-businesses-in-cameroon/',
    '/en/blog/professional-carpentry-installations-design-services-for-homes-and-businesses-in-cameroon',
  ],
  [
    '/blog/2024/09/11/how-to-choose-the-right-upholstery-for-your-home-tips-from-the-experts',
    '/en/blog/how-to-choose-the-right-upholstery-for-your-home-tips-from-the-experts',
  ],
  ['/blog/category/news-updates/', '/en/blog'],
  ['/blog/tag/handyman-services/', '/en/blog'],
  ['/shop/product/kitchen-cabinets/', site.webAppUrl],
  ['/shop/product/upholstery-beds/', site.webAppUrl],
  ['/shop/product/upholstery-chairs/', site.webAppUrl],
]
