import type { CollectionSlug, PayloadRequest, Where, WidgetServerProps } from 'payload'

import type { Submission } from '@/payload-types'

import { adminCopy, adminLang, type AdminCopy } from './copy'

// Dashboard widgets (admin.dashboard, ADR-032). Server components: every count runs through the
// Local API as the signed-in user (overrideAccess: false), so nobody sees numbers their role
// can't open.

const adminPath = (req: PayloadRequest, path: string) => `${req.payload.config.routes.admin}${path}`

async function safeCount(req: PayloadRequest, collection: CollectionSlug, where?: Where) {
  try {
    const { totalDocs } = await req.payload.count({
      collection,
      where,
      req,
      overrideAccess: false,
    })
    return totalDocs
  } catch {
    // Forbidden for this role (or the table is missing in a half-migrated DB): show nothing.
    return null
  }
}

function firstName(user: WidgetServerProps['user']) {
  if (!user) return ''
  const name = 'name' in user && typeof user.name === 'string' ? user.name.trim() : ''
  if (name) return name.split(/\s+/)[0]
  return 'email' in user && typeof user.email === 'string' ? user.email.split('@')[0] : ''
}

export function WelcomeWidget({ req, user }: WidgetServerProps) {
  const lang = adminLang(req.i18n.language)
  const copy = adminCopy(lang)
  const name = firstName(user)
  const today = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Africa/Douala',
  }).format(new Date())

  return (
    <section className="hm-welcome" aria-labelledby="hm-welcome-title">
      <div className="hm-welcome__body">
        <p className="hm-eyebrow">
          {copy.studio} · <span className="hm-welcome__date">{today}</span>
        </p>
        <h1 id="hm-welcome-title" className="hm-welcome__title">
          {copy.greeting}
          {name ? `, ${name}` : ''}
        </h1>
        <p className="hm-welcome__intro">{copy.intro}</p>
        <div className="hm-welcome__actions">
          <a className="hm-btn hm-btn--gold" href={adminPath(req, '/collections/posts/create')}>
            {copy.newPost}
          </a>
          <a className="hm-btn hm-btn--ghost" href={adminPath(req, '/globals/home')}>
            {copy.editHome}
          </a>
          <a className="hm-btn hm-btn--ghost" href={`/${lang}`} target="_blank" rel="noopener">
            {copy.viewSite} <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative, admin only, fixed size */}
      <img className="hm-welcome__mark" src="/brand/logo.jpg" alt="" width={168} height={151} />
    </section>
  )
}

function relativeTime(date: string, lang: 'en' | 'fr') {
  const minutes = Math.round((Date.now() - new Date(date).getTime()) / 60_000)
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
  if (minutes < 60) return rtf.format(-minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (hours < 24) return rtf.format(-hours, 'hour')
  return rtf.format(-Math.round(hours / 24), 'day')
}

export async function InboxWidget({ req }: WidgetServerProps) {
  const lang = adminLang(req.i18n.language)
  const copy = adminCopy(lang)
  const fresh = await safeCount(req, 'submissions', { status: { equals: 'new' } })

  let latest: Submission[] = []
  if (fresh !== null) {
    const result = await req.payload.find({
      collection: 'submissions',
      sort: '-createdAt',
      limit: 5,
      depth: 0,
      select: { name: true, type: true, status: true, createdAt: true },
      req,
      overrideAccess: false,
    })
    latest = result.docs as Submission[]
  }

  return (
    <section className="hm-panel" aria-labelledby="hm-inbox-title">
      <header className="hm-panel__head">
        <h2 id="hm-inbox-title" className="hm-panel__title">
          {copy.inboxTitle}
          {fresh ? (
            <span className="hm-badge">
              {fresh} {copy.inboxNew}
            </span>
          ) : null}
        </h2>
        {fresh !== null && (
          <a className="hm-panel__more" href={adminPath(req, '/collections/submissions')}>
            {copy.inboxAll} →
          </a>
        )}
      </header>
      {fresh === null ? (
        <p className="hm-panel__empty">{copy.inboxDenied}</p>
      ) : latest.length === 0 ? (
        <p className="hm-panel__empty">{copy.inboxEmpty}</p>
      ) : (
        <ul className="hm-inbox">
          {latest.map((entry) => (
            <li key={entry.id}>
              <a
                className="hm-inbox__row"
                href={adminPath(req, `/collections/submissions/${entry.id}`)}
              >
                <span className={`hm-dot hm-dot--${entry.status}`} aria-hidden="true" />
                <span className="hm-inbox__main">
                  <span className="hm-inbox__name">{entry.name}</span>
                  <span className="hm-inbox__type">{copy.types[entry.type]}</span>
                </span>
                <span className="hm-inbox__meta">
                  <span className={`hm-status hm-status--${entry.status}`}>
                    {copy.statuses[entry.status]}
                  </span>
                  <time dateTime={entry.createdAt}>{relativeTime(entry.createdAt, lang)}</time>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

type Tile = {
  slug: keyof AdminCopy['collections'] & CollectionSlug
  total: number | null
  detail: number | null
  detailLabel: string
}

export async function ContentWidget({ req }: WidgetServerProps) {
  const copy = adminCopy(req.i18n.language)
  const draft: Where = { _status: { equals: 'draft' } }

  const [services, servicesDraft, projects, projectsDraft, posts, postsDraft, reviews, faqs] =
    await Promise.all([
      safeCount(req, 'services'),
      safeCount(req, 'services', draft),
      safeCount(req, 'projects'),
      safeCount(req, 'projects', draft),
      safeCount(req, 'posts'),
      safeCount(req, 'posts', draft),
      safeCount(req, 'testimonials'),
      safeCount(req, 'faqs'),
    ])
  const [jobs, jobsOpen] = await Promise.all([
    safeCount(req, 'jobs'),
    safeCount(req, 'jobs', { open: { equals: true } }),
  ])

  const tiles: Tile[] = [
    { slug: 'services', total: services, detail: servicesDraft, detailLabel: copy.contentDrafts },
    { slug: 'projects', total: projects, detail: projectsDraft, detailLabel: copy.contentDrafts },
    { slug: 'posts', total: posts, detail: postsDraft, detailLabel: copy.contentDrafts },
    { slug: 'testimonials', total: reviews, detail: null, detailLabel: '' },
    { slug: 'faqs', total: faqs, detail: null, detailLabel: '' },
    { slug: 'jobs', total: jobs, detail: jobsOpen, detailLabel: copy.contentOpen },
  ]

  return (
    <section className="hm-panel" aria-labelledby="hm-content-title">
      <header className="hm-panel__head">
        <h2 id="hm-content-title" className="hm-panel__title">
          {copy.contentTitle}
        </h2>
      </header>
      <ul className="hm-stats">
        {tiles
          .filter((tile) => tile.total !== null)
          .map((tile) => (
            <li key={tile.slug}>
              <a className="hm-stat" href={adminPath(req, `/collections/${tile.slug}`)}>
                <span className="hm-stat__value">{tile.total}</span>
                <span className="hm-stat__label">{copy.collections[tile.slug]}</span>
                {tile.detail ? (
                  <span className="hm-stat__detail">
                    {tile.detail} {tile.detailLabel}
                  </span>
                ) : null}
              </a>
            </li>
          ))}
      </ul>
    </section>
  )
}
