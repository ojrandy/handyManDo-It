import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'
import { fileURLToPath } from 'url'

import { legacyRedirects } from './src/lib/legacyRedirects'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const mediaHost = process.env.MEDIA_PUBLIC_URL ? new URL(process.env.MEDIA_PUBLIC_URL) : null
const isDev = process.env.NODE_ENV === 'development'
// HSTS and upgrade-insecure-requests only make sense (and only work) behind HTTPS.
const isHttps = (process.env.NEXT_PUBLIC_SITE_URL || '').startsWith('https://')

// GA4 (FR-ANA-01) is only allowed when configured; it loads after consent (ADR-036).
const ga = process.env.NEXT_PUBLIC_GA_ID
  ? {
      script: ' https://www.googletagmanager.com',
      connect:
        ' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com',
      img: ' https://*.google-analytics.com https://*.googletagmanager.com',
    }
  : { script: '', connect: '', img: '' }

// Pages are pre-rendered, so nonces are not an option; 'unsafe-inline' covers the
// inline scripts Next.js emits.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}${ga.script}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${mediaHost ? ` ${mediaHost.origin}` : ''}${ga.img}`,
  `media-src 'self'${mediaHost ? ` ${mediaHost.origin}` : ''}`,
  "font-src 'self'",
  `connect-src 'self'${isDev ? ' ws:' : ''}${ga.connect}`,
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isHttps ? ['upgrade-insecure-requests'] : []),
].join('; ')

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  },
  // No includeSubDomains/preload: app.handymandoit.com is hosted elsewhere and preload is hard to undo.
  ...(isHttps ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }] : []),
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // The site stylesheet (~18 KB gzip) goes in the HTML head instead of a render-blocking request:
    // one round trip less before first paint on 4G (NFR-PERF-01). Pages are cached at the edge,
    // so the repeat cost of not sharing one CSS file is small.
    inlineCss: true,
  },
  // Old WordPress URLs end in "/". Next's own trailing-slash redirect would run before ours and add
  // a hop, so it is off and done last in redirects() instead (single-hop 301s, FR-SEO-05).
  skipTrailingSlashRedirect: true,
  async redirects() {
    return [
      ...legacyRedirects,
      // What Next does by default (308, same exclusions), after the legacy map.
      {
        source: '/:path((?!\.well-known(?:/.*)?)(?:[^/]+/)*[^/]+)/',
        destination: '/:path',
        permanent: true,
      },
    ]
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    // The Media imageSizes widths, so each srcset width names a file that really has it (the
    // CmsImage loader answers a width with the narrowest size covering it).
    deviceSizes: [480, 560, 960, 1600, 2400],
    localPatterns: [
      { pathname: '/api/media/file/**' },
      { pathname: '/badges/**' },
      { pathname: '/brand/**' },
      { pathname: '/icons/**' },
      { pathname: '/images/**' },
      { pathname: '/video/**' },
    ],
    remotePatterns: mediaHost
      ? [
          {
            protocol: mediaHost.protocol.replace(':', '') as 'https' | 'http',
            hostname: mediaHost.hostname,
          },
        ]
      : [],
  },
  // Browsers request /favicon.ico at the root whatever the <link> says; without this it falls
  // through to /[locale] and errors.
  async rewrites() {
    return [{ source: '/favicon.ico', destination: '/icons/favicon.ico' }]
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // FR-SEO-02: the CMS and API never show in search (uploaded images excepted).
      {
        source: '/:path(admin|admin/.*|api/(?!media/).*)',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      // The Payload admin relies on inline/eval code, so the CSP covers the public site only.
      {
        source: '/:path((?!admin|api).*)',
        headers: [{ key: 'Content-Security-Policy', value: contentSecurityPolicy }],
      },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(withNextIntl(nextConfig), { devBundleServerPackages: false })
