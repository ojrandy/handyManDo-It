import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const mediaHost = process.env.MEDIA_PUBLIC_URL ? new URL(process.env.MEDIA_PUBLIC_URL) : null
const isDev = process.env.NODE_ENV === 'development'
// HSTS and upgrade-insecure-requests only make sense (and only work) behind HTTPS.
const isHttps = (process.env.NEXT_PUBLIC_SITE_URL || '').startsWith('https://')

// Pages are pre-rendered, so nonces are not an option; 'unsafe-inline' covers the
// inline scripts Next.js emits. Extend script-src/connect-src when GA4 lands (Phase 5).
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${mediaHost ? ` ${mediaHost.origin}` : ''}`,
  `media-src 'self'${mediaHost ? ` ${mediaHost.origin}` : ''}`,
  "font-src 'self'",
  `connect-src 'self'${isDev ? ' ws:' : ''}`,
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
