import { expect, test, type APIRequestContext } from '@playwright/test'

// QA-AUTO-10 (FR-SEO-01..04): every URL in the sitemap, both locales, every template. Pages are
// read as HTML (no browser), so the whole site is checked in well under a minute.

type Page = { path: string; alternates: Record<string, string> }

const attr = (tag: string, name: string) =>
  tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1]?.replace(/&amp;/g, '&') ?? null

const decode = (text: string) =>
  text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

const tags = (html: string, pattern: RegExp) => [...html.matchAll(pattern)].map((m) => m[0])

const pathOf = (url: string) => {
  const { pathname, search } = new URL(url)
  return pathname + search
}

async function sitemapPages(request: APIRequestContext): Promise<Page[]> {
  const response = await request.get('/sitemap.xml')
  expect(response.status()).toBe(200)
  const xml = await response.text()
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, entry]) => ({
    path: pathOf(entry.match(/<loc>([^<]+)<\/loc>/)![1]),
    alternates: Object.fromEntries(
      [...entry.matchAll(/hreflang="([^"]+)"\s+href="([^"]+)"/g)].map(([, lang, href]) => [
        lang,
        pathOf(href),
      ]),
    ),
  }))
}

test.describe('SEO', () => {
  test('robots.txt keeps the CMS out and names the sitemap', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text()
    expect(body).toMatch(/Disallow: \/admin/)
    expect(body).toMatch(/Disallow: \/api\//)
    expect(body).toMatch(/Sitemap: \S+\/sitemap\.xml/)
  })

  test('the CMS answers with noindex', async ({ request }) => {
    const response = await request.get('/admin/login', { maxRedirects: 0 })
    expect(response.headers()['x-robots-tag']).toContain('noindex')
  })

  test('the sitemap lists both locales of every template', async ({ request }) => {
    const pages = await sitemapPages(request)
    const paths = pages.map(({ path }) => path)
    for (const expected of [
      '/fr',
      '/en',
      '/fr/a-propos',
      '/en/about',
      '/fr/services',
      '/en/services/moving',
      '/fr/services/demenagement',
      '/fr/mentions/confidentialite',
    ]) {
      expect(paths).toContain(expected)
    }
    expect(paths.some((path) => /^\/en\/our-work\/./.test(path))).toBe(true)
    // Every alternate names a page that is itself in the sitemap (reciprocity).
    for (const { path, alternates } of pages) {
      expect(alternates['x-default'], path).toBeTruthy()
      for (const [lang, href] of Object.entries(alternates)) {
        if (lang !== 'x-default') expect(paths, `${path} → ${lang}`).toContain(href)
      }
    }
  })

  test('every page: status, canonical, hreflang, title, description, H1, JSON-LD', async ({
    request,
  }) => {
    test.setTimeout(240_000)
    const pages = await sitemapPages(request)
    const titles = new Map<string, string>()
    const problems: string[] = []

    for (const { path, alternates } of pages) {
      const response = await request.get(path, { maxRedirects: 0 })
      if (response.status() !== 200) {
        problems.push(`${path}: status ${response.status()}`)
        continue
      }
      const html = await response.text()
      const head = html.slice(0, html.indexOf('</head>'))

      const canonical = tags(head, /<link[^>]+rel="canonical"[^>]*>/g)
      if (canonical.length !== 1) problems.push(`${path}: ${canonical.length} canonical tags`)
      else if (pathOf(attr(canonical[0], 'href')!) !== path) {
        problems.push(`${path}: canonical ${attr(canonical[0], 'href')}`)
      }

      const langs = Object.fromEntries(
        tags(head, /<link[^>]+rel="alternate"[^>]+hrefLang="[^"]+"[^>]*>/gi).map((tag) => [
          attr(tag, 'hrefLang') ?? attr(tag, 'hreflang'),
          pathOf(attr(tag, 'href')!),
        ]),
      )
      expect(langs, `${path} hreflang`).toEqual(alternates)

      const title = decode(head.match(/<title>([^<]*)<\/title>/)?.[1] ?? '')
      if (title.length < 10 || title.length > 70) problems.push(`${path}: title "${title}"`)
      const lang = path.split('/')[1]
      const key = `${lang} ${title}`
      if (titles.has(key)) problems.push(`${path}: same title as ${titles.get(key)}`)
      titles.set(key, path)

      const description = decode(
        attr(tags(head, /<meta[^>]+name="description"[^>]*>/g)[0] ?? '', 'content') ?? '',
      )
      if (!description || description.length < 50 || description.length > 160) {
        problems.push(`${path}: description length ${description?.length ?? 0}`)
      }

      for (const property of ['og:title', 'og:description', 'og:url', 'og:image', 'og:locale']) {
        if (!head.includes(`property="${property}"`)) problems.push(`${path}: no ${property}`)
      }

      const h1s = tags(html, /<h1[\s>]/g).length
      if (h1s !== 1) problems.push(`${path}: ${h1s} h1`)

      for (const [, json] of html.matchAll(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
      )) {
        try {
          const data = JSON.parse(json)
          if (data['@context'] !== 'https://schema.org') problems.push(`${path}: JSON-LD context`)
        } catch {
          problems.push(`${path}: invalid JSON-LD`)
        }
      }
    }
    expect(problems).toEqual([])
  })

  test('share images are 1200×630 PNGs for every template', async ({ request }) => {
    for (const path of [
      '/fr',
      '/en/about',
      '/fr/services/demenagement',
      '/en/faq',
      '/fr/mentions/conditions',
    ]) {
      const html = await (await request.get(path)).text()
      const tag = tags(html, /<meta[^>]+property="og:image"[^>]*>/g)[0]
      expect(tag, path).toBeTruthy()
      expect(html).toContain('property="og:image:width" content="1200"')
      const image = await request.get(pathOf(attr(tag, 'content')!))
      expect(image.status(), path).toBe(200)
      expect(image.headers()['content-type']).toBe('image/png')
    }
  })

  test('home carries Organization, WebSite, MobileApplication and both offices', async ({
    request,
  }) => {
    const html = await (await request.get('/en')).text()
    const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) ?? []
    const types = json.flatMap((block) => {
      const data = JSON.parse(block.replace(/<\/?script[^>]*>/g, ''))
      return (data['@graph'] ?? [data]).map((node: { '@type': string }) => node['@type'])
    })
    expect(types).toEqual(
      expect.arrayContaining([
        'Organization',
        'WebSite',
        'MobileApplication',
        'HomeAndConstructionBusiness',
      ]),
    )
    expect(types.filter((type) => type === 'HomeAndConstructionBusiness')).toHaveLength(2)
  })
})
