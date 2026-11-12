import { cache, type ReactNode } from 'react'
import type { PayloadRequest, Where, WidgetServerProps } from 'payload'

import type { Submission } from '@/payload-types'

import { adminCopy, adminLang, type AdminCopy, type AdminLang } from './copy'
import { adminPath, relativeTime, safeCount } from './widgets'

// Analytics widgets for the admin dashboard. The site's traffic numbers live in GA (browser side),
// so these chart what the database knows for sure: form entries and content. Same rules as
// widgets.tsx: server components, Local API as the signed-in user, nothing a role can't open.
// Charts are SVG + CSS (hover, focus), no chart library and no client JS in the admin.

const DAY = 86_400_000
const WINDOW = 30
const ZONE = 'Africa/Douala'

type Lead = Pick<Submission, 'type' | 'status' | 'locale' | 'utm' | 'createdAt'>

// YYYY-MM-DD in Cameroon time, so a day means the owner's day, not UTC's.
const dayKey = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function lastDays(count: number, offset = 0) {
  const now = Date.now()
  return Array.from({ length: count }, (_, i) =>
    dayKey.format(new Date(now - (offset + count - 1 - i) * DAY)),
  )
}

// One read of the last 60 days per dashboard render, shared by every widget (React cache keys on
// the request object). null = this role can't read submissions.
const loadLeads = cache(async (req: PayloadRequest): Promise<Lead[] | null> => {
  try {
    const { docs } = await req.payload.find({
      collection: 'submissions',
      where: { createdAt: { greater_than_equal: new Date(Date.now() - 61 * DAY).toISOString() } },
      sort: '-createdAt',
      limit: 5000,
      depth: 0,
      select: { type: true, status: true, locale: true, utm: true, createdAt: true },
      req,
      overrideAccess: false,
    })
    return docs as Lead[]
  } catch {
    return null
  }
})

type Period = { days: string[]; daily: number[]; leads: Lead[]; previous: number }

const loadPeriod = cache(async (req: PayloadRequest): Promise<Period | null> => {
  const all = await loadLeads(req)
  if (!all) return null
  const days = lastDays(WINDOW)
  const previousDays = new Set(lastDays(WINDOW, WINDOW))
  const index = new Map(days.map((day, i) => [day, i]))
  const daily = days.map(() => 0)
  const leads: Lead[] = []
  let previous = 0
  for (const lead of all) {
    if (lead.status === 'spam') continue
    const key = dayKey.format(new Date(lead.createdAt))
    const at = index.get(key)
    if (at !== undefined) {
      daily[at] += 1
      leads.push(lead)
    } else if (previousDays.has(key)) previous += 1
  }
  return { days, daily, leads, previous }
})

// ---------------------------------------------------------------- helpers

const locale = (lang: AdminLang) => (lang === 'fr' ? 'fr-FR' : 'en-GB')

function formatDay(key: string, lang: AdminLang, withWeekday = false) {
  return new Intl.DateTimeFormat(locale(lang), {
    weekday: withWeekday ? 'short' : undefined,
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${key}T12:00:00Z`))
}

const formatNumber = (value: number, lang: AdminLang) =>
  new Intl.NumberFormat(locale(lang)).format(value)

const percent = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0)

// Clean axis ticks: steps of 1, 2 or 5 × 10^n, about four of them.
function axis(max: number) {
  if (max <= 0) return { top: 4, ticks: [0, 1, 2, 3, 4] }
  const raw = max / 4
  const pow = 10 ** Math.floor(Math.log10(raw))
  const unit = raw / pow
  const step = Math.max(1, (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10) * pow)
  const top = Math.ceil(max / step) * step
  return { top, ticks: Array.from({ length: top / step + 1 }, (_, i) => i * step) }
}

function countBy<T extends string>(items: Lead[], pick: (lead: Lead) => T | null | undefined) {
  const counts = new Map<T, number>()
  for (const item of items) {
    const key = pick(item)
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

function utmValue(lead: Lead, key: 'utm_source' | 'utm_campaign') {
  const utm = lead.utm
  if (!utm || typeof utm !== 'object' || Array.isArray(utm)) return null
  const value = (utm as Record<string, unknown>)[key]
  return typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : null
}

function Denied({ copy, title, id }: { copy: AdminCopy; title: string; id: string }) {
  return (
    <section className="hm-panel" aria-labelledby={id}>
      <header className="hm-panel__head">
        <h2 id={id} className="hm-panel__title">
          {title}
        </h2>
      </header>
      <p className="hm-panel__empty">{copy.inboxDenied}</p>
    </section>
  )
}

function PanelHead({
  id,
  title,
  sub,
  more,
}: {
  id: string
  title: string
  sub?: string
  more?: ReactNode
}) {
  return (
    <header className="hm-panel__head">
      <div>
        <h2 id={id} className="hm-panel__title">
          {title}
        </h2>
        {sub ? <p className="hm-panel__sub">{sub}</p> : null}
      </div>
      {more}
    </header>
  )
}

// Stroke icons, 20 px, decorative (the tile label names the figure).
const icons = {
  inbox: 'M4 13h4l1.5 2.5h5L16 13h4M5.5 5h13L21 13v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5z',
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  check: 'M8.5 12.5l2.5 2.5 5-5.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  globe:
    'M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3zM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
}

function Icon({ path }: { path: string }) {
  return (
    <svg className="hm-kpi__icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values)
  const step = 100 / Math.max(1, values.length - 1)
  const points = values.map(
    (value, i) => `${(i * step).toFixed(2)},${(30 - (value / max) * 26 - 2).toFixed(2)}`,
  )
  const last = points[points.length - 1]?.split(',') ?? ['100', '28']
  return (
    <svg className="hm-spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points.join(' ')} vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="2.6" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

// ---------------------------------------------------------------- KPI strip

export async function KpiWidget({ req }: WidgetServerProps) {
  const lang = adminLang(req.i18n.language)
  const copy = adminCopy(lang)
  const published: Where = { _status: { equals: 'published' } }
  const draft: Where = { _status: { equals: 'draft' } }

  const [period, waiting, total, done, spam, oldest, ...content] = await Promise.all([
    loadPeriod(req),
    safeCount(req, 'submissions', { status: { equals: 'new' } }),
    safeCount(req, 'submissions'),
    safeCount(req, 'submissions', { status: { equals: 'done' } }),
    safeCount(req, 'submissions', { status: { equals: 'spam' } }),
    req.payload
      .find({
        collection: 'submissions',
        where: { status: { equals: 'new' } },
        sort: 'createdAt',
        limit: 1,
        depth: 0,
        select: { createdAt: true },
        req,
        overrideAccess: false,
      })
      .then((result) => result.docs[0]?.createdAt ?? null)
      .catch(() => null),
    safeCount(req, 'services', published),
    safeCount(req, 'projects', published),
    safeCount(req, 'posts', published),
    safeCount(req, 'testimonials'),
    safeCount(req, 'faqs'),
    safeCount(req, 'jobs', { open: { equals: true } }),
    safeCount(req, 'services', draft),
    safeCount(req, 'projects', draft),
    safeCount(req, 'posts', draft),
  ])

  const live = content.slice(0, 6)
  const drafts = content.slice(6)
  const liveTotal = live.every((value) => value === null)
    ? null
    : live.reduce<number>((sum, value) => sum + (value ?? 0), 0)
  const draftTotal = drafts.reduce<number>((sum, value) => sum + (value ?? 0), 0)

  const current = period ? period.daily.reduce((sum, value) => sum + value, 0) : 0
  const change = period ? current - period.previous : 0
  const changePct = period?.previous ? Math.round((change / period.previous) * 100) : null
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'flat'

  const handledBase = total !== null && spam !== null ? total - spam : null
  const handledRate = handledBase && done !== null ? percent(done, handledBase) : null

  return (
    <section className="hm-kpis" aria-label={copy.trendTitle}>
      {period ? (
        <a className="hm-kpi" href={adminPath(req, '/collections/submissions')}>
          <span className="hm-kpi__top">
            <span className="hm-kpi__label">{copy.kpiLeads}</span>
            <Icon path={icons.inbox} />
          </span>
          <span className="hm-kpi__value">{formatNumber(current, lang)}</span>
          <span className="hm-kpi__foot">
            {period.previous ? (
              <span className={`hm-delta hm-delta--${trend}`}>
                <span aria-hidden="true">
                  {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                </span>
                {change > 0 ? '+' : ''}
                {formatNumber(change, lang)}
                {changePct !== null ? ` (${changePct > 0 ? '+' : ''}${changePct}%)` : ''}
              </span>
            ) : null}
            <span className="hm-kpi__note">
              {period.previous ? copy.kpiVsPrevious : copy.kpiNoPrevious}
            </span>
          </span>
          <Sparkline values={period.daily} />
        </a>
      ) : null}

      {waiting !== null ? (
        <a
          className={`hm-kpi${waiting ? ' hm-kpi--attention' : ''}`}
          href={adminPath(req, '/collections/submissions?where[status][equals]=new')}
        >
          <span className="hm-kpi__top">
            <span className="hm-kpi__label">{copy.kpiWaiting}</span>
            <Icon path={icons.clock} />
          </span>
          <span className="hm-kpi__value">{formatNumber(waiting, lang)}</span>
          <span className="hm-kpi__foot">
            <span className="hm-kpi__note">
              {waiting && oldest ? copy.kpiOldest(relativeTime(oldest, lang)) : copy.kpiCaughtUp}
            </span>
          </span>
        </a>
      ) : null}

      {handledRate !== null && handledBase !== null && done !== null ? (
        <a className="hm-kpi" href={adminPath(req, '/collections/submissions')}>
          <span className="hm-kpi__top">
            <span className="hm-kpi__label">{copy.kpiHandled}</span>
            <Icon path={icons.check} />
          </span>
          <span className="hm-kpi__value">
            {handledRate}
            <span className="hm-kpi__unit">%</span>
          </span>
          <span className="hm-kpi__foot">
            <span className="hm-kpi__note">{copy.kpiHandledDetail(done, handledBase)}</span>
          </span>
          <span className="hm-meter" aria-hidden="true">
            <span style={{ width: `${handledRate}%` }} />
          </span>
        </a>
      ) : null}

      {liveTotal !== null ? (
        <div className="hm-kpi">
          <span className="hm-kpi__top">
            <span className="hm-kpi__label">{copy.kpiLive}</span>
            <Icon path={icons.globe} />
          </span>
          <span className="hm-kpi__value">{formatNumber(liveTotal, lang)}</span>
          <span className="hm-kpi__foot">
            {draftTotal ? (
              <span className="hm-delta hm-delta--flat">
                {draftTotal} {copy.contentDrafts}
              </span>
            ) : null}
            <span className="hm-kpi__note">{copy.kpiLiveDetail}</span>
          </span>
        </div>
      ) : null}
    </section>
  )
}

// ---------------------------------------------------------------- trend chart

export async function TrendWidget({ req }: WidgetServerProps) {
  const lang = adminLang(req.i18n.language)
  const copy = adminCopy(lang)
  const period = await loadPeriod(req)
  if (!period) return <Denied copy={copy} title={copy.trendTitle} id="hm-trend-title" />

  const { days, daily } = period
  const total = daily.reduce((sum, value) => sum + value, 0)
  const peak = Math.max(...daily)
  const peakDay = days[daily.indexOf(peak)]
  const { top, ticks } = axis(peak)
  const n = days.length
  const x = (i: number) => ((i + 0.5) / n) * 100
  const y = (value: number) => 100 - (value / top) * 100
  const line = daily
    .map((value, i) => `${i ? 'L' : 'M'}${x(i).toFixed(2)},${y(value).toFixed(2)}`)
    .join(' ')
  const area = `${line} L${x(n - 1).toFixed(2)},100 L${x(0).toFixed(2)},100 Z`

  return (
    <section className="hm-panel" aria-labelledby="hm-trend-title">
      <PanelHead
        id="hm-trend-title"
        title={copy.trendTitle}
        sub={copy.trendSub}
        more={
          <a className="hm-panel__more" href={adminPath(req, '/collections/submissions')}>
            {copy.inboxAll} →
          </a>
        }
      />

      <dl className="hm-figures">
        <div>
          <dt>{copy.trendTotal}</dt>
          <dd>{formatNumber(total, lang)}</dd>
        </div>
        <div>
          <dt>{copy.trendAverage}</dt>
          <dd>
            {new Intl.NumberFormat(locale(lang), { maximumFractionDigits: 1 }).format(total / n)}
          </dd>
        </div>
        <div>
          <dt>{copy.trendPeak}</dt>
          <dd>
            {peak ? (
              <>
                {formatNumber(peak, lang)}{' '}
                <span className="hm-figures__note">{formatDay(peakDay, lang)}</span>
              </>
            ) : (
              '—'
            )}
          </dd>
        </div>
      </dl>

      <div className="hm-chart" aria-hidden="true">
        <div className="hm-chart__y">
          {ticks.map((tick) => (
            <span key={tick} style={{ bottom: `${(tick / top) * 100}%` }}>
              {tick}
            </span>
          ))}
        </div>
        <div className="hm-chart__plot">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="hm-chart__grid"
              style={{ bottom: `${(tick / top) * 100}%` }}
            />
          ))}
          <svg className="hm-chart__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path className="hm-chart__area" d={area} />
            <path className="hm-chart__line" d={line} vectorEffect="non-scaling-stroke" />
          </svg>
          <ol className="hm-chart__cols" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
            {daily.map((value, i) => (
              <li
                key={days[i]}
                className={`hm-chart__col${i === n - 1 ? ' is-last' : ''}${
                  i < 5 ? ' is-start' : i > n - 6 ? ' is-end' : ''
                }`}
              >
                <span className="hm-chart__cross" />
                <span className="hm-chart__dot" style={{ bottom: `${100 - y(value)}%` }} />
                <span className="hm-chart__tip" style={{ bottom: `${100 - y(value)}%` }}>
                  <strong>
                    {value} {copy.leads(value)}
                  </strong>
                  <span>{i === n - 1 ? copy.trendToday : formatDay(days[i], lang, true)}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="hm-chart__x">
          <span>{formatDay(days[0], lang)}</span>
          <span>{formatDay(days[Math.floor(n / 2)], lang)}</span>
          <span>{copy.trendToday}</span>
        </div>
      </div>

      <details className="hm-table">
        <summary>{copy.trendTable}</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">{copy.tableDate}</th>
              <th scope="col">{copy.tableLeads}</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day, i) => (
              <tr key={day}>
                <td>{formatDay(day, lang, true)}</td>
                <td>{daily[i]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  )
}

// ---------------------------------------------------------------- ranked bars

type Row = {
  key: string
  label: string
  value: number
  accent?: boolean
  muted?: boolean
  href?: string
}

function Bars({ rows, total, lang }: { rows: Row[]; total: number; lang: AdminLang }) {
  const max = Math.max(1, ...rows.map((row) => row.value))
  return (
    <ul className="hm-bars">
      {rows.map((row) => {
        const body = (
          <>
            <span className="hm-bars__label">{row.label}</span>
            <span className="hm-bars__value">
              {formatNumber(row.value, lang)}
              <span className="hm-bars__share">{percent(row.value, total)}%</span>
            </span>
            <span className="hm-bars__track" aria-hidden="true">
              <span
                className={`hm-bars__fill${row.accent ? ' is-accent' : ''}${row.muted ? ' is-muted' : ''}`}
                style={{ width: `${(row.value / max) * 100}%` }}
              />
            </span>
          </>
        )
        return (
          <li key={row.key}>
            {row.href ? (
              <a className="hm-bars__row" href={row.href}>
                {body}
              </a>
            ) : (
              <span className="hm-bars__row">{body}</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

// ---------------------------------------------------------------- pipeline

const STATUSES = ['new', 'in-progress', 'done', 'spam'] as const

export async function PipelineWidget({ req }: WidgetServerProps) {
  const lang = adminLang(req.i18n.language)
  const copy = adminCopy(lang)
  const counts = await Promise.all(
    STATUSES.map((status) => safeCount(req, 'submissions', { status: { equals: status } })),
  )
  if (counts.some((count) => count === null)) {
    return <Denied copy={copy} title={copy.pipelineTitle} id="hm-pipeline-title" />
  }
  const values = counts as number[]
  const total = values.reduce((sum, value) => sum + value, 0)

  return (
    <section className="hm-panel" aria-labelledby="hm-pipeline-title">
      <PanelHead id="hm-pipeline-title" title={copy.pipelineTitle} sub={copy.pipelineSub} />
      <p className="hm-big">
        {formatNumber(total, lang)}
        <span>{copy.leads(total)}</span>
      </p>
      <Bars
        lang={lang}
        total={total}
        rows={STATUSES.map((status, i) => ({
          key: status,
          label: copy.statuses[status],
          value: values[i],
          accent: status === 'new',
          muted: status === 'spam',
          href: adminPath(req, `/collections/submissions?where[status][equals]=${status}`),
        }))}
      />
    </section>
  )
}

// ---------------------------------------------------------------- lead mix

export async function MixWidget({ req }: WidgetServerProps) {
  const lang = adminLang(req.i18n.language)
  const copy = adminCopy(lang)
  const period = await loadPeriod(req)
  if (!period) return <Denied copy={copy} title={copy.mixTitle} id="hm-mix-title" />

  const { leads } = period
  const byType = countBy(leads, (lead) => lead.type)
  const fr = leads.filter((lead) => lead.locale === 'fr').length
  const en = leads.filter((lead) => lead.locale === 'en').length
  const langTotal = fr + en

  return (
    <section className="hm-panel" aria-labelledby="hm-mix-title">
      <PanelHead id="hm-mix-title" title={copy.mixTitle} sub={copy.mixSub} />
      {leads.length === 0 ? (
        <p className="hm-panel__empty">{copy.noLeads}</p>
      ) : (
        <>
          <Bars
            lang={lang}
            total={leads.length}
            rows={byType.map(([type, value]) => ({ key: type, label: copy.types[type], value }))}
          />
          {langTotal ? (
            <div className="hm-split">
              <p className="hm-split__title">{copy.languageTitle}</p>
              <span
                className="hm-split__bar"
                role="img"
                aria-label={`${copy.locales.fr} ${percent(fr, langTotal)}%, ${copy.locales.en} ${percent(en, langTotal)}%`}
              >
                {fr ? <span className="is-fr" style={{ flexGrow: fr }} /> : null}
                {en ? <span className="is-en" style={{ flexGrow: en }} /> : null}
              </span>
              <ul className="hm-legend">
                <li>
                  <span className="hm-legend__key is-fr" aria-hidden="true" />
                  {copy.locales.fr} <strong>{percent(fr, langTotal)}%</strong>
                </li>
                <li>
                  <span className="hm-legend__key is-en" aria-hidden="true" />
                  {copy.locales.en} <strong>{percent(en, langTotal)}%</strong>
                </li>
              </ul>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}

// ---------------------------------------------------------------- sources

export async function SourcesWidget({ req }: WidgetServerProps) {
  const lang = adminLang(req.i18n.language)
  const copy = adminCopy(lang)
  const period = await loadPeriod(req)
  if (!period) return <Denied copy={copy} title={copy.sourcesTitle} id="hm-sources-title" />

  const { leads } = period
  const sources = countBy(leads, (lead) => utmValue(lead, 'utm_source'))
  const tagged = sources.reduce((sum, [, value]) => sum + value, 0)
  // Five named sources at most; the tail folds into "Other" (never a sixth bar).
  const shown = sources.slice(0, 5)
  const rest = sources.slice(5).reduce((sum, [, value]) => sum + value, 0)
  const rows: Row[] = [
    ...shown.map(([source, value]) => ({ key: source, label: source, value })),
    ...(rest ? [{ key: '__other', label: copy.sourcesOther, value: rest }] : []),
    ...(leads.length - tagged
      ? [{ key: '__direct', label: copy.sourcesDirect, value: leads.length - tagged, muted: true }]
      : []),
  ]
  const campaigns = countBy(leads, (lead) => utmValue(lead, 'utm_campaign')).slice(0, 4)

  return (
    <section className="hm-panel" aria-labelledby="hm-sources-title">
      <PanelHead id="hm-sources-title" title={copy.sourcesTitle} sub={copy.sourcesSub} />
      {leads.length === 0 ? (
        <p className="hm-panel__empty">{copy.noLeads}</p>
      ) : (
        <>
          <Bars lang={lang} total={leads.length} rows={rows} />
          <div className="hm-split">
            <p className="hm-split__title">{copy.campaignsTitle}</p>
            {campaigns.length ? (
              <ol className="hm-rank">
                {campaigns.map(([campaign, value]) => (
                  <li key={campaign}>
                    <span>{campaign}</span>
                    <strong>{formatNumber(value, lang)}</strong>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="hm-panel__hint">{copy.campaignsEmpty}</p>
            )}
          </div>
        </>
      )}
    </section>
  )
}
