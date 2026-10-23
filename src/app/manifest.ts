import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HandyMan Do IT',
    short_name: 'HandyMan',
    description: 'Trusted home, office and business services in Cameroon.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f9fa',
    theme_color: '#0f2530',
    icons: [
      { src: '/icons/favicon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
