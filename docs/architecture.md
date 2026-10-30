# Architecture

Version 1.0 · 2026-10-23 · Owner: tech lead. Update the **decision log (§10)** whenever you make a structural choice.

---

## 1. System context

```
                         ┌──────────────────────────────┐
  Visitor (mobile/desktop)│        Cloudflare            │
  ───────────────────────▶│ DNS · TLS · HTTP/3 · Brotli  │
                         │ edge cache (HTML + assets)    │
                         └──────────────┬───────────────┘
                                        │ origin
                         ┌──────────────▼───────────────┐
                         │ Hostinger Node.js Web App     │
                         │ Next.js 16 + Payload 3        │
                         │  ├─ /fr /en  public site (RSC)│
                         │  ├─ /admin   Payload admin    │
                         │  ├─ /api     Payload REST/GQL │
                         │  └─ /download store redirect  │
                         └───┬──────────────┬───────────┘
                             │ SQL (TLS)    │ S3 API
                  ┌──────────▼───┐   ┌──────▼──────────────┐
                  │ Neon Postgres│   │ Cloudflare R2        │
                  │ us-east-1    │   │ media.handymandoit.com│
                  └──────────────┘   └──────────────────────┘
  External links (no integration): app.handymandoit.com (the product), Google Play,
  App Store (later), WhatsApp (wa.me), GA4/Search Console, SMTP provider.
```

**This repo is the marketing website only.** The booking app, payments, wallet and pro onboarding live in the separate app at `app.handymandoit.com`; the site links into it.

## 2. Logical architecture

| Layer | Location | Responsibility |
|---|---|---|
| Edge | Cloudflare | TLS, caching, compression, DDoS, DNS |
| Routing / locale | `src/proxy.ts` (next-intl middleware) | Detect locale, redirect `/` → `/fr` or `/en`, cookie |
| Presentation | `src/app/(site)/[locale]/**`, `src/components/**` | Server Components render pages; small client islands for interactivity |
| UI strings | `src/messages/{fr,en}.json` | Chrome text (nav, buttons, aria) |
| Content | Payload collections/globals (`src/collections`, `src/globals`) | All editorial content, localized |
| Data access | Payload **Local API** (`getPayload`) | Typed reads inside RSC; no HTTP hop |
| Admin | `src/app/(payload)/**` (generated) | Editor UI, REST, GraphQL |
| Persistence | Postgres via `@payloadcms/db-postgres` (Drizzle) | Content, users, submissions |
| Files | R2 via `@payloadcms/storage-s3` | Images (pre-sized), video, PDFs, CVs |
| Email | `@payloadcms/email-nodemailer` | Form notifications (console fallback in dev) |

## 3. Route map

| Path | Kind | Rendering |
|---|---|---|
| `/` | proxy redirect | → `/fr` or `/en` by Accept-Language/cookie |
| `/{locale}` and all pages in `routing.pathnames` | public | Static (SSG) with on-demand revalidation |
| `/{locale}/…/[slug]` | public | SSG via `generateStaticParams` from Payload; unknown slug → 404 (`dynamicParams` allowed so newly published items render on first hit, then cache) |
| `/admin/**` | Payload | Dynamic, noindex, excluded from proxy |
| `/api/**` | Payload REST/GraphQL + custom route handlers (forms, revalidate, og) | Dynamic, excluded from proxy |
| `/download` | route handler | Dynamic: UA sniff → 302 to store / QR page; excluded from proxy |
| `/manifest.webmanifest`, `/sitemap.xml`, `/robots.txt` | metadata routes | Static |
| Old URLs (`*.html`, `/shop/*`, …) | redirects | 301, defined in `next.config.ts` `redirects()` (or Payload redirects plugin for editor-managed ones) |

The proxy matcher is `/((?!admin|api|download|_next|_vercel|.*\..*).*)`. Any new non-localized route must be added to that negative lookahead.

## 4. Rendering and caching model

**Principle:** the origin (Hostinger, shared CPU) should almost never render a page for a visitor.

1. **Build time:** every locale × page × slug is pre-rendered (`generateStaticParams` + `setRequestLocale`).
2. **Edit time:** pages read CMS data only through `src/lib/payload.ts`, which caches each read (`unstable_cache`) tagged with its collection/global slug and `media`. Payload `afterChange`/`afterDelete` hooks (`src/hooks/revalidate.ts`) call `revalidateTag(slug, { expire: 0 })`, which invalidates every page that used that data in both locales without computing URLs. Draft saves don't purge; unpublishing does; seeds pass `context.disableRevalidate`. The next request regenerates once; subsequent requests are static.
3. **Edge:** Next emits `s-maxage=31536000` for pre-rendered pages and overrides `Cache-Control` set in `next.config`, so the HTML edge TTL is set by a **Cloudflare Cache Rule** (Edge TTL override, short, see DEPLOY.md), not by origin headers. Cloudflare caches HTML; static assets (`/_next/static`) immutable for 1 year. On revalidation, purge the matching Cloudflare URLs (via Cloudflare API from the same hook) — **optional**, add only if stale edge HTML becomes a problem (tracked as risk R-07).
4. **Images:** sizes generated at upload (thumb 480, card 960, wide 1600, hero 2400, WebP). Components pick the right size; `next/image` optimisation is used for local `/public` assets only. No per-request resizing of CMS media.
5. **Video:** MP4 H.264 + WebM, 3 sizes, on R2 behind Cloudflare. Loaded only when FR-HOME-02 conditions allow.

**Forbidden on this platform:** cron, queues/workers, WebSockets, long-running requests (>120 s), writing to local disk in production.

## 5. Data flow examples

**Visitor views a service page**
`Cloudflare cache hit → HTML` (normal case). On miss: `Hostinger → RSC page → payload.find({ collection: 'services', locale, where: { slug } }) → Neon → HTML (cached)`.

**Editor publishes a FAQ change**
`/admin save → Payload → Neon → afterChange hook → revalidatePath('/fr/faq', '/en/faq', '/fr', '/en') → next request rebuilds`.

**Visitor submits a quote form**
`SiteForm island mounts → GET /api/forms/token (HMAC-signed issue time) → visitor submits → same zod schema in the browser (src/lib/forms/schema.ts) → POST /api/forms/{type} (multipart) → per-IP rate limit (5 / 10 min, in memory) → honeypot (filled = fake success) → token ≥ 3 s and ≤ 6 h old → zod again → CV checks + private files upload (job) → payload.create({ collection: 'submissions' }) → afterChange hook emails the inbox (with the extra fields) and purges > 24 months → 200 → client queues quote_submit / pro_apply / job_apply` (2026-10-30, ADR-023).

**Visitor taps "Get the app"**
`/download?utm_… → route handler reads UA → Android: 302 Play (referrer=utm) · iOS: App Store if site.appStoreUrl else web app · desktop: 302 /{locale}/get-the-app (fr: /telecharger; cookie, then Accept-Language), keeping utm_*` (`Cache-Control: private, no-store`, `Vary: User-Agent`). Every QR on the site encodes `/download` (ADR-027).

## 6. Module structure (target)

```
src/
  app/
    (site)/[locale]/
      layout.tsx  page.tsx  not-found.tsx
      services/  services/[slug]/  …one folder per routing.pathnames key
    (payload)/            generated
    api/forms/[type]/route.ts   form intake
    api/forms/token/route.ts    time-to-submit token
    api/og/route.tsx            dynamic OG image (or opengraph-image.tsx per segment)
    download/route.ts           smart store redirect
    sitemap.ts  robots.ts  manifest.ts
  collections/  globals/        schema (see data-model.md)
  hooks/                        Payload hooks (revalidate, notify)
  components/
    sections/                   one component per home/inner section
    device/                     Phone, Laptop frames
    demo/                       mini-demo screens
    ui/                         Button, Badge, Accordion, Marquee, StoreBadges, …
  lib/
    payload.ts                  cached getPayload() + typed query helpers
    seo.ts                      metadata + JSON-LD builders
    analytics.ts                typed event helper (track(name, params))
    device.ts                   UA / Save-Data / connection detection
    site.ts                     defaults
    validation/                 zod schemas shared by client and server
  i18n/  messages/
  migrations/                   committed Payload migrations
scripts/
  seed.ts  migrate-wordpress.ts  capture-screens.ts
```

## 7. Cross-cutting concerns

| Concern | Approach |
|---|---|
| **i18n** | next-intl; `localePrefix: 'always'`; translated pathnames; Payload localization `fr` (default) + `en` with fallback; `hreflang` via `generateMetadata` `alternates.languages` |
| **SEO** | `generateMetadata` per route via `lib/seo.ts`; JSON-LD components; `sitemap.ts` reads Payload; `@payloadcms/plugin-seo` fields on content |
| **Security** | Payload auth for admin; role-based access functions; security headers in `next.config.ts` `headers()`; CSP allowing GA4 + R2 + YouTube (if used); rate limiting in form handlers (in-memory LRU per process is acceptable at this scale); secrets via env |
| **Analytics** | GA4 via `gtag` loaded after consent; Consent Mode v2 defaults to denied; `lib/analytics.ts` typed `track()`; events per FR-ANA-02 |
| **Errors / logging** | Route handlers return typed errors; `console.error` with context (Hostinger log viewer); `error.tsx` + `not-found.tsx` per locale; optional Sentry later (ADR pending) |
| **Accessibility** | Semantic landmarks; focus management for menus/dialogs; reduced-motion branches in every animated component |
| **Performance** | RSC by default; IntersectionObserver-gated `React.lazy` for the mini-demo; scroll story is CSS sticky + a small observer (ADR-021); coverflow is a small server-rendered island; first-load JS checked by `tests/e2e/budget.e2e.spec.ts`; fonts via `next/font` (Poppins, Sora) with `display: swap`; no client data fetching for content |
| **Config** | All environment-specific values in env vars (see [operations.md](operations.md) §2); defaults in `lib/site.ts` |

## 8. Environments

| Env | Where | DB | Media | Purpose |
|---|---|---|---|---|
| Local | developer machine | docker Postgres 17 | local `/media` | Development (Payload schema push) |
| CI | GitHub Actions | service Postgres 17 | none | typecheck, lint, migrate (fresh DB), int tests, build, e2e on `next start` |
| Staging | Hostinger temp URL / `staging.` subdomain | Neon branch `staging` | R2 (r2.dev URL) | Client review, QA |
| Production | handymandoit.com via Cloudflare | Neon `main` | R2 `media.handymandoit.com` | Live |

## 9. Quality attributes and how the design meets them

| Attribute | Mechanism |
|---|---|
| Speed (NFR-PERF) | SSG + edge cache + pre-sized media + lazy client islands |
| Editability (KPI-5) | Everything content-shaped in Payload, localized |
| Resilience (NFR-REL) | Cloudflare serves cached HTML if origin down; Neon PITR; media off-host |
| Portability | Standard Next.js + Postgres + S3 API → can move to any Node host/Vercel without code change |
| Cost | Free tiers for Neon and R2; single Hostinger Business plan |

## 10. Decision log (ADRs)

Format: **ID · date · decision · context · consequences · status.** Never delete; supersede.

| ID | Date | Decision | Context / consequences | Status |
|---|---|---|---|---|
| ADR-001 | 2026-10-23 | Next.js (App Router) + Payload 3 in one app | One deploy, typed Local API, editors in `/admin`. Couples CMS and site release cycles (acceptable). | Accepted |
| ADR-002 | 2026-10-23 | Neon Postgres instead of Hostinger MySQL | Payload has no MySQL adapter. Adds an external dependency; EU region keeps latency acceptable. | Accepted |
| ADR-003 | 2026-10-23 | Cloudflare R2 for media | Uploads survive redeploys; no egress fees; S3-compatible. | Accepted |
| ADR-004 | 2026-10-23 | Pre-render everything + hook-driven revalidation; no cron/workers | Hostinger lacks workers/WebSockets and has a 120 s cap. | Accepted |
| ADR-005 | 2026-10-23 | next-intl with `localePrefix: 'always'`, FR default, translated slugs | Clear hreflang, predictable caching per URL. `/` always redirects. | Accepted |
| ADR-006 | 2026-10-23 | Tailwind 4 CSS-first tokens in `globals.css` `@theme` | Tokens mirror the app; no JS config. | Accepted |
| ADR-007 | 2026-10-23 | Sora as display font (Clash Display not on Google Fonts) | Self-hosted via `next/font`. Revisit if a Clash licence is obtained. | Accepted |
| ADR-008 | 2026-10-23 | Image sizes generated at upload as WebP (AVIF deferred) | PLAN mentions AVIF; sharp AVIF encoding is slow on upload. Revisit for hero poster (NFR-PERF-02). | Accepted, revisit |
| ADR-009 | 2026-10-23 | `src/proxy.ts` is the middleware (Next 16 naming) | Matcher excludes admin/api/download/static. | Accepted |
| ADR-010 | 2026-10-23 | npm is the package manager | `package-lock.json` exists; Playwright config and `.vscode` aligned to npm (T-0.12, done). | Accepted |
| ADR-011 | — | Error monitoring (Sentry vs logs only) | Decide before Phase 6. | Proposed |
| ADR-012 | — | Form spam protection: honeypot + timing + rate limit vs Cloudflare Turnstile | Turnstile adds a third-party script; start without, add if spam appears. | Proposed |
| ADR-013 | 2026-10-23 | Keep the Neon project in AWS us-east-1 (supersedes the EU-region note in ADR-002) | Owner decision. Pages are pre-rendered and revalidated by hooks, so visitors are unaffected; CMS admin and build-time queries pay ~100 ms per round trip from Hostinger EU. Revisit if the admin feels slow. | Accepted |
| ADR-014 | 2026-10-23 | Defer Cloudflare R2; media on local disk meanwhile | Owner decision. Staging uploads may not survive Hostinger redeploys, so final content goes in after R2 is enabled (set `S3_*` + `MEDIA_PUBLIC_URL`, no code change). | Accepted, temporary |
| ADR-015 | 2026-10-23 | Static CSP with `'unsafe-inline'` scripts on public routes only; no CSP on `/admin`, `/api` | Nonce-based CSP forces dynamic rendering, which breaks ADR-004 (pre-render everything). Still blocks third-party script/frame/object injection, framing (`frame-ancestors 'self'`) and base/form hijacking. Payload admin needs eval/inline code, so it gets the other headers only. HSTS without `includeSubDomains`/`preload` (`app.` is hosted elsewhere). Extend `script-src`/`connect-src` for GA4 in Phase 5. | Accepted |
| ADR-016 | 2026-10-24 | Security upgrade: Next 16.3.3 → **16.4.2**, eslint-config-next to match, sharp 0.35.4 → **0.35.5** | `npm audit` flagged a critical Next advisory set (RCE in image optimisation and `use cache`, SSG/ISR cache poisoning on self-hosted apps, SSRF) fixed after 16.4.0, and a sharp/librsvg CVE. 16.4.2 chosen over 16.4.3 (one day old) for bake time; within Payload 3.92's peer range (`>=16.3.3 <17`). Remaining advisories (lexical→happy-dom, drizzle-kit→esbuild-kit) are inside Payload; npm's only fix is a Payload downgrade, so they are tracked under T-6.04 and re-checked on each Payload update. | Accepted |
| ADR-017 | 2026-10-27 | Single-sided relationships to `services` with Payload `join` fields (no `services.faqs` / `services.relatedProjects` columns) | One source of truth per link, no circular build order; join fields are virtual (no migration cost) and still list related docs in the service editor. | Accepted (Q-13) |
| ADR-018 | 2026-10-28 | Hero video in three sizes chosen by `<source media>`: `home.hero.video` keeps `mp4`/`webm` as 720p and adds `mp4Large`/`webmLarge` (1080p, ≥ 1280 px) and `mp4Small`/`webmSmall` (480p) | PLAN.md §2 asks for 3 sizes. Additive fields keep the migration non-destructive. `media` on video `<source>` is honoured by current Chrome, Safari and Firefox; older browsers take the first source (1080p WebM), and only Wi-Fi/desktop visitors play video at all (FR-HOME-02). Files come from `npm run encode:hero` (ffmpeg). | Accepted |
| ADR-019 | 2026-10-28 | Imported WordPress posts stay English-only; French blog pages read them with `fallbackLocale: 'en'` | Payload's fallback goes to the default locale (`fr`), so FR → EN needs an explicit fallback. A global `fr → en` fallback was rejected: it would show English in home sections whose empty French fields must fall back to the French messages copy. Machine-translating 20 articles was rejected (R-08). | Accepted |
| ADR-020 | 2026-10-29 | `images.deviceSizes` equals the Media `imageSizes` widths (480, 560, 960, 1600, 2400); the desktop hero LCP is the phone screenshot, preloaded | `CmsImage` maps each srcset width to the narrowest generated size covering it. With Next's default widths the srcset labelled the 960 px file `640w`, so every 2× screen downloaded ~95 KB for a 268 px image. A test (`imageSizes.int.spec.ts`) keeps the two lists equal. Owner chose the screenshot over the H1 as desktop LCP (2026-10-29), so it gets a 560 px size (~40 KB), `preload` + `fetchPriority=high`, a preconnect to `MEDIA_PUBLIC_URL`, and the hero photo waits for `load`. | Accepted |
| ADR-021 | 2026-10-29 | Scroll story pins with CSS `position: sticky` and follows chapters with an IntersectionObserver; **no GSAP** (supersedes the GSAP ScrollTrigger choice in PLAN.md §9/§11 for this section) | The story only needs a pinned stage and a current-chapter index; screens crossfade on a `data-current` attribute. That is a ~1 KB island instead of ~45 KB gzip for GSAP + ScrollTrigger, nothing to lazy-load, and it matches the CSS-first approach of the numbers map and how-it-works line. Pinning is limited to ≥ 768 px with motion allowed (`pinned` custom variant in `globals.css`); elsewhere the chapters are a horizontal scroll-snap track. GSAP can still come back if a later design needs scrubbed timelines. | Proposed (owner sign-off: deviates from PLAN.md) |
| ADR-022 | 2026-10-29 | Phase 4 page model: fixed page copy in `messages/*.json` (one namespace per page), CMS collections for lists and detail pages; legal text in a `legal` global (3 localized rich-text tabs) | Same split as the home page before its global: chrome and fixed copy versioned with the code, editor-owned content in Payload. A generic `pages` collection was rejected for three fixed legal pages (more schema, a page builder nobody asked for). | Accepted (owner: "use all recommendations", 2026-10-29) |
| ADR-023 | 2026-10-29 | Forms: native `<form>` + a small hook around the shared zod schema; `zod` becomes a pinned direct dependency; no react-hook-form | Same validation on client and server (FR-FORM-01) without ~10 KB of form library on pages with one form. Spam: honeypot + signed time-to-submit + per-IP rate limit (ADR-012 stays: Turnstile only if spam appears). | Accepted (owner, 2026-10-29) |
| ADR-024 | 2026-10-29 | Contact page shows office cards with "Open in Maps" links, no embedded map; blog search filters the pre-rendered list in the browser | An embedded map needs a CSP `frame-src` exception and loads heavy third-party code on every visit; the `site` offices already hold map URLs. 20 posts need no server search; revisit past ~100 posts. | Accepted (owner, 2026-10-29) |
| ADR-025 | 2026-10-29 | The language switcher follows the page's hreflang alternate (`pageMetadata` in `src/lib/seo.ts`) | Translated slugs differ per language, so keeping the route params would switch to a 404. The alternates are needed for SEO anyway (FR-SEO-01), so one source drives both. Pages without alternates keep the route + params behaviour. | Accepted |
| ADR-026 | 2026-10-30 | Hero background is a slider of our crews at work (`home.hero.slides`, 2–6 localized rows) while there is no footage; the phone mock-up is desktop only, phones get one floating notification over the photo | Owner asked for a classic hero slider with the old site's crew photos (trust, Q-4 still open). Slides crossfade with a slow ken-burns pan every 6.5 s; the first photo is server-rendered and preloaded (`fetchPriority=high`), later ones mount after `load` and lazy-load. Light-data and reduced-motion visitors get the first photo only, still, with no controls. One pause button stops slides and cues (WCAG 2.2.2); bullets carry `aria-current` and the caption. Video, when uploaded, still wins over the slides. Supersedes the single-still backdrop of T-1.10; the 3D phone left the mobile hero to keep photo, H1 and CTAs on the first screen. | Accepted (owner request, 2026-10-30) |
| ADR-027 | 2026-10-30 | The site's QR codes (Get the app popover, download band, get-the-app page) encode `/download`, not the Play listing; desktop visitors of `/download` land on a localized get-the-app page | One code works for Android and iPhone (the phone that scans it is sniffed, not the desktop showing it), carries campaign tags to Play's install `referrer` (FR-ANA-03), and follows the App Store URL once it exists (Q-3) without reprinting. Costs one redirect on scan. The QR is rendered at build time from `NEXT_PUBLIC_SITE_URL`, so that variable must be the public domain in every deployed environment. | Accepted |
