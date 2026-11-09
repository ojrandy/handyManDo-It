import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'

import sharp from 'sharp'

import { imageRefs } from './html'

// The old blog's REST API (docs/PLAN.md §13: 20 posts). It goes away when handymandoit.com moves
// to the new site, so the import reads the archive below by default.
export const defaultApi = 'https://handymandoit.com/blog/wp-json/wp/v2'

// A copy of the blog committed to the repo (`npm run archive:wordpress`): the API replies the
// import uses, and every image it uploads.
export const archiveDir = path.resolve('data/wordpress')

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

type Archive = {
  posts: WpPost[]
  categories: WpCategory[]
  media: WpMedia[]
  // Image URL → file name in `files/`.
  files: Record<string, string>
}

const archiveParts = ['posts', 'categories', 'media', 'files'] as const

const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T

export const hasArchive = (dir = archiveDir) => existsSync(path.join(dir, 'posts.json'))

// The import's view of the archive: no network, same data as the live blog when it was saved.
export function archiveSource(dir = archiveDir): WordPressSource {
  const [posts, categories, media, files] = archiveParts.map((part) =>
    readJson(path.join(dir, `${part}.json`)),
  ) as [Archive['posts'], Archive['categories'], Archive['media'], Archive['files']]
  return {
    posts: async () => posts,
    categories: async () => categories,
    media: async (ids) => media.filter(({ id }) => ids.includes(id)),
    async download(url) {
      const name = files[url]
      if (!name) throw new Error(`${url} is not in the archive (${dir})`)
      return path.join(dir, 'files', name)
    },
  }
}

// Saves everything the import reads from `source` into `dir`. Image URLs are the ones the import
// asks for (run.ts: the attachment's source_url, else the <img> src), so the archive answers them.
export async function saveArchive(
  source: WordPressSource,
  dir = archiveDir,
  log: (line: string) => void = console.log,
): Promise<{ posts: number; categories: number; media: number; files: number }> {
  const posts = await source.posts()
  const categories = await source.categories()

  const ids = new Set<number>()
  for (const post of posts) {
    if (post.featured_media) ids.add(post.featured_media)
    for (const { wpId } of imageRefs(post.content.rendered)) if (wpId) ids.add(wpId)
  }
  const media = (await source.media([...ids])).sort((a, b) => a.id - b.id)
  const byId = new Map(media.map((m) => [m.id, m]))

  const urls = new Set<string>()
  for (const post of posts) {
    const featured = byId.get(post.featured_media)
    if (featured) urls.add(featured.source_url)
    for (const ref of imageRefs(post.content.rendered)) {
      const url = (ref.wpId ? byId.get(ref.wpId)?.source_url : undefined) ?? ref.src
      if (url) urls.add(url)
    }
  }

  const filesDir = path.join(dir, 'files')
  mkdirSync(filesDir, { recursive: true })
  const files: Record<string, string> = {}
  const used = new Set<string>()
  for (const [index, url] of [...urls].entries()) {
    log(`  ${index + 1}/${urls.size} ${url}`)
    const local = await source.download(url)
    // Two uploads folders can hold the same file name; the second gets a numbered prefix.
    let name = path.basename(local)
    for (let n = 2; used.has(name.toLowerCase()); n++) name = `${n}-${path.basename(local)}`
    used.add(name.toLowerCase())
    copyFileSync(local, path.join(filesDir, name))
    files[url] = name
  }

  const archive: Archive = { posts, categories, media, files }
  for (const part of archiveParts) {
    writeFileSync(path.join(dir, `${part}.json`), `${JSON.stringify(archive[part], null, 2)}\n`)
  }
  return {
    posts: posts.length,
    categories: categories.length,
    media: media.length,
    files: urls.size,
  }
}
