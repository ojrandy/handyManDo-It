import type { Metadata } from 'next'
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { site } from './site'

// Share cards (FR-SEO-04): 1200×630 in brand colours, the page's own title and description. Each
// route's `opengraph-image.tsx` passes its page's metadata, so a card never disagrees with the
// page. Rendered at build for pre-rendered pages, on first request for newer slugs, then cached.

export const ogSize = { width: 1200, height: 630 }
export const ogContentType = 'image/png'

const asset = (file: string) => readFile(path.join(process.cwd(), file))

const assets = Promise.all([
  asset('src/assets/fonts/Sora-Bold.ttf'),
  asset('src/assets/fonts/Poppins-Medium.ttf'),
  asset('public/icons/icon-512.png'),
])

const textOf = (value: Metadata['title'] | Metadata['description']): string => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if ('absolute' in value && value.absolute) return value.absolute
  if ('default' in value) return value.default
  return ''
}

const clamp = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, text.lastIndexOf(' ', max - 1) || max - 1)}…` : text

export async function ogImage(metadata: Metadata) {
  const [sora, poppins, icon] = await assets
  const title = clamp(textOf(metadata.openGraph?.title ?? metadata.title) || site.name, 90)
  const description = clamp(textOf(metadata.description), 150)
  const host = new URL(site.url).host.replace(/^www\./, '')

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 80px',
        background: '#0f2530',
        color: '#ffffff',
        fontFamily: 'Poppins',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: 96, height: 8, borderRadius: 4, background: '#e7ab34' }} />
        <div
          style={{
            marginTop: 36,
            fontFamily: 'Sora',
            fontSize: title.length > 48 ? 58 : 70,
            lineHeight: 1.12,
            letterSpacing: -1,
          }}
        >
          {title}
        </div>
        {description ? (
          <div
            style={{
              marginTop: 28,
              fontSize: 28,
              lineHeight: 1.4,
              color: 'rgba(255,255,255,0.78)',
              maxWidth: 1000,
            }}
          >
            {description}
          </div>
        ) : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img> */}
        <img
          src={`data:image/png;base64,${icon.toString('base64')}`}
          width={72}
          height={72}
          alt=""
          style={{ borderRadius: 16 }}
        />
        <div style={{ marginLeft: 20, fontFamily: 'Sora', fontSize: 30 }}>{site.name}</div>
        <div style={{ marginLeft: 'auto', fontSize: 26, color: '#e7ab34' }}>{host}</div>
      </div>
    </div>,
    {
      ...ogSize,
      fonts: [
        { name: 'Sora', data: sora, weight: 700, style: 'normal' },
        { name: 'Poppins', data: poppins, weight: 500, style: 'normal' },
      ],
    },
  )
}

// Slug pages list their slugs per locale (the parent segment passes it); an image route has to
// list every locale × slug pair itself to be pre-rendered.
export const imageParamsFor =
  <P extends Record<string, string>>(
    pageParams: (args: { params: { locale: string } }) => P[] | Promise<P[]>,
    locales: readonly string[],
  ) =>
  async () =>
    (
      await Promise.all(
        locales.map(async (locale) =>
          (await pageParams({ params: { locale } })).map((params) => ({ ...params, locale })),
        ),
      )
    ).flat()
