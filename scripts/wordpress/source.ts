import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import sharp from 'sharp'

// The old blog's REST API (docs/PLAN.md §13: 20 posts).
export const defaultApi = 'https://handymandoit.com/blog/wp-json/wp/v2'

type Rendered = { rendered: string }

export type WpPost = {
  id: number
  date_gmt: string
  slug: string
  status: string
  link: string
  title: Rendered
  excerpt: Rendered
  content: Rendered
  featured_media: number
  categories: number[]
}

export type WpCategory = { id: number; slug: string; name: string }

export type WpMedia = {
  id: number
  source_url: string
  alt_text: string
  title: Rendered
  caption: Rendered
  mime_type: string
}

// What the import needs from WordPress. The int tests pass a local stand-in.
export type WordPressSource = {
  posts(): Promise<WpPost[]>
  categories(): Promise<WpCategory[]>
  media(ids: number[]): Promise<WpMedia[]>
  // Local path of the downloaded file, ready to upload.
  download(url: string): Promise<string>
}

// The old host is slow: a 50 KB file can take a minute.
const timeoutMs = 180_000
const attempts = 3

async function request(url: string): Promise<Response> {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
      if (response.ok) return response
      lastError = new Error(`${response.status} ${response.statusText} for ${url}`)
      if (response.status < 500) break
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

async function json<T>(url: string): Promise<T> {
  return (await (await request(url)).json()) as T
}

async function all<T>(api: string, resource: string, fields: string): Promise<T[]> {
  const out: T[] = []
  for (let page = 1; ; page++) {
    const response = await request(`${api}/${resource}?per_page=100&page=${page}&_fields=${fields}`)
    out.push(...((await response.json()) as T[]))
    if (page >= Number(response.headers.get('x-wp-totalpages') ?? 1)) return out
  }
}

// Originals larger than the biggest site size (Media `hero`, 2400 px) are scaled down before
// upload: nothing serves more, and R2 stores less.
const maxWidth = 2400

export function wordPressSource(api = defaultApi, cacheDir = path.resolve('.cache/wordpress')) {
  mkdirSync(cacheDir, { recursive: true })
  return {
    posts: () =>
      all<WpPost>(
        api,
        'posts',
        'id,date_gmt,slug,status,link,title,excerpt,content,featured_media,categories',
      ),
    categories: () => all<WpCategory>(api, 'categories', 'id,slug,name'),
    async media(ids) {
      const out: WpMedia[] = []
      for (let i = 0; i < ids.length; i += 100) {
        const include = ids.slice(i, i + 100).join(',')
        out.push(
          ...(await json<WpMedia[]>(
            `${api}/media?include=${include}&per_page=100&_fields=id,source_url,alt_text,title,caption,mime_type`,
          )),
        )
      }
      return out
    },
    // Downloads are kept in .cache/wordpress, so a re-run (or a failed run) doesn't fetch again.
    async download(url) {
      const file = path.join(cacheDir, decodeURIComponent(path.basename(new URL(url).pathname)))
      if (existsSync(file)) return file
      const bytes = Buffer.from(await (await request(url)).arrayBuffer())
      const image = sharp(bytes)
      const { width } = await image.metadata().catch(() => ({ width: undefined }))
      const data =
        width && width > maxWidth
          ? await image.resize({ width: maxWidth, withoutEnlargement: true }).toBuffer()
          : bytes
      // Written under a temporary name first, so an interrupted run never leaves a half file.
      writeFileSync(`${file}.part`, data)
      renameSync(`${file}.part`, file)
      return file
    },
  } satisfies WordPressSource
}
