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

1. **Build time:** every locale × page × slug is pre-rendered (`generateStaticParams` + `setRequestLocale`). Slugs published after the build render on first visit (no `dynamicParams = false` above them; ADR-033).
2. **Edit time:** pages read CMS data only through `src/lib/payload.ts`, which caches each read (`unstable_cache`) tagged with its collection/global slug and `media`. Payload `afterChange`/`afterDelete` hooks (`src/hooks/revalidate.ts`) call `revalidateTag(slug, { expire: 0 })`, which invalidates every page that used that data in both locales without computing URLs. Draft saves don't purge; unpublishing does; seeds pass `context.disableRevalidate`. The next request regenerates once; subsequent requests are static. Open pages pick the edit up without a reload: each purge bumps a content version that `LiveRefresh` polls, then `router.refresh()` (ADR-033).
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
| **Performance** | RSC by default; IntersectionObserver-gated `React.lazy` for the mini-demo; scroll story is CSS sticky + GSAP loaded near the view (ADR-030); coverflow is a small server-rendered island; first-load JS checked by `tests/e2e/budget.e2e.spec.ts`; fonts via `next/font` (Poppins, Sora) with `display: swap`; no client data fetching for content |
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
| ADR-028 | 2026-11-03 | The hero phone is shown on every screen size, larger on desktop, and opens on the app's intro before Home. Supersedes ADR-026's "phone mock-up is desktop only" and its floating mobile notification; updates ADR-020 (screenshot sizes) and FR-HOME-02 for this clip | Owner: a bigger phone with a native-app feel, also on phones. Size follows screen height (`phone-hero`: 320–384 px wide on desktop, 74 vw up to 288 px on phones). On phones the order is copy + CTAs, phone, then film + trust rows, so the CTAs and the phone share the first screen. The source film is 16:9 and a cropped phone screen would cut the logo, so `npm run encode:splash` cuts a vertical clip (540×1170, 4.2 s, ~320 KB, no audio, sharp band over blurred wood; one file means one decode). The poster is in the server HTML, so Home never flashes first; notifications wait for the intro. Unlike hero footage, this clip plays on 4G mobile data (owner choice, budget 400 KB, once per tab session); Save-Data and 3G or slower keep the poster for 1.5 s, reduced motion goes straight to Home, and a failed, blocked or stalled video (2.5 s) opens Home. The clip starts when 40 % of the phone is in view, pauses out of view, and has an 8 s cap. H.264 only: every browser that matters plays it, and one without just skips to Home. The script encodes frame by frame with Chrome's WebCodecs and writes the MP4 itself, so it needs no ffmpeg and the result doesn't depend on machine load (MediaRecorder lost frames, returned empty files and wrote a clip that never fired `ended`). The clip is a static asset like the default film, so there is no CMS field and no migration. | Accepted (owner, 2026-11-03) |
| ADR-029 | 2026-11-05 | App screenshots are captured as a real phone shows them: `capture:screens` sets the app's `--hm-inset-*` to the iPhone's safe areas (47/34 px) and draws the status bar and home indicator; the `Phone` screen is exactly 390:844 (frame 18 × 37.5 em, was 9:19.5) | Owner: the app's header ran under the notch and its bars were clipped. The old captures had no safe areas, and `object-cover` cropped their sides because the frame was narrower than they are. Fixing the capture keeps one image per screen, follows the light/dark theme without extra code, and needs no schema change. Each environment's CMS needs `capture:screens -- --update` once. | Accepted (owner request, 2026-11-05) |
| ADR-030 | 2026-11-05 | Scroll story runs on **GSAP** + ScrollTrigger, on the owner's explicit instruction. Supersedes ADR-021's "no GSAP". One stage holds text, picture and phone; CSS `sticky` holds it (no ScrollTrigger `pin`, so no spacer or layout jump) and GSAP only scrubs the changes between chapters, snapping to each. `src/components/ui/storyTimeline.ts` is a dynamic import made when the section nears the view, so home first-load JS is unchanged, and it is never fetched on phones or under reduced motion (GSAP itself now reaches phones for the service panels, ADR-031). `StoryObserver` keeps `data-current` from scroll position, so a CSS crossfade still runs the story if GSAP fails to load. The `pinned` variant adds `(scripting: enabled)`: without JS the chapters are readable swipe cards. Picture column and phone share `--story-h`; the phone's `zoom` is measured from it so they align to the pixel. Pictures must show what the chapter says (Pexels stock, Q-20) |
| ADR-031 | 2026-11-05 | On phones the home services section is four panels (Home, Projects, Moving, Also in the app) driven by scroll with **GSAP**, one 2 × 2 screen at a time. Same tiles and DOM as the desktop bento: below 768 px on screens at least 544 px tall (`panels` variant), with motion allowed and scripts on, the group wrappers become a stacked stage; otherwise they are `display: contents` and the grid is unchanged | Owner: 14 tiles over two phone screens were too much and boring; wanted scroll animation with an app feel that also plays when scrolling back up. Built like ADR-030: CSS `sticky` holds the stage, `ServicePanels` keeps `data-current` from scroll position (CSS crossfade if GSAP fails), and `servicePanelsTimeline.ts` is a dynamic import made near the view. One scrubbed timeline covers the entrance and the changes, so scrolling up reverses all of it. Differs from the scroll story on purpose: no snap, so a phone scroll is never pulled away from the thumb, and tiles deal in rather than wipe. Scroll distance is about the same as the old grid (each change is 60 svh); it shows less at once rather than being shorter. Panels not next to the current one wait below the clipped track, so their lazy photos load only when close, and stay focusable. Groups are in code (`src/lib/serviceGroups.ts`), matched on slug, so no schema change or migration; a service we can't place joins the last group. Desktop order is now per group, which matches the seeded CMS order; an editor can't move a tile across groups. | Accepted (owner, 2026-11-05) |
| ADR-032 | 2026-11-07 | **Branded admin** without forking Payload: (1) `app/(payload)/custom.scss` remaps Payload's `--theme-*` variables onto the brand tokens (teal-tinted neutrals, teal accent, gold primary buttons with night text, night-navy sidebar in both themes by flipping the elevation scale inside `.nav`, branded login); (2) `admin.components` adds a fonts provider (Poppins/Sora via `next/font`, handed to Payload's `--font-body`), the logo graphics and a sidebar brand block; (3) Payload 3.92's widget dashboard gets three server widgets (welcome, inbox, site content) above the default collection cards; (4) a last-in-line config plugin (`adminLabels`) gives every collection, global and group FR/EN names and orders the groups Inbox → Content → Marketing → Company → Settings | Owner: the stock admin did not look professional. Admin strings live in `src/components/admin/copy.ts`, not `src/messages`, so they never reach the public client bundle (home JS has under 1 KB of headroom). Widget counts use the Local API with `overrideAccess: false`, so each role sees only what it can open. Labels and order only: no schema change, no migration; `payload-types.ts` reorders its interfaces with the collection order. Field labels inside documents stay English for now (follow-up) | Accepted (owner request, 2026-11-07) |
| ADR-033 | 2026-11-07 | **CMS edits reach open pages without a reload.** (1) `dynamicParams = false` moves from the locale layout to the home page. In Next 16 a layout's `false` applies to every route below it and a page can't override it, so a service, article, project or job published after the build returned 404 until the next deploy. The home page is the route root-level files (`/robots.txt`…) hit, so it keeps the 2026-10-29 guard. (2) Every cache purge (`src/hooks/revalidate.ts`) bumps an in-memory content version (`src/lib/contentVersion.ts`, on `globalThis` so all route bundles share it); `/api/content-version` returns it with `no-store`. (3) `LiveRefresh` (a small client shell in the locale layout) gets each render's time from the server and, after the `load` event, imports `liveRefreshWatch.ts`, which reads the version when the tab or window regains focus and every 30 s while visible, and calls `router.refresh()` when a save is newer than what the page shows (the version is the save time, 0 after a restart): server data re-renders in place, scroll and form input are kept | Owner: edits should show on the site with little or no reload. Polling is the only push-like option on Hostinger (no WebSockets, no workers). The endpoint does no DB work; hidden tabs never poll. One Node process is assumed: with several, versions differ per process and a page may refresh once without a change; a restart also refreshes open pages once. Cloudflare must not cache RSC requests (DEPLOY.md cache rule) or the refresh can be up to 5 minutes late; a full reload can still hit the 5-minute edge copy until the hook purges Cloudflare (R-07). Editors' draft preview stays T-1.05 (live preview) | Accepted (owner request, 2026-11-07) |
| ADR-034 | 2026-11-07 | **Home islands far down the page load near the view.** The screens coverflow and the testimonial carousel buttons are split into a presentational view (`CoverflowView`, `CarouselControlsView`: markup only, no hooks) and the interactive client code (`Coverflow`, `CarouselControls`). The server renders the view at its first state inside `NearView`, a small client loader that imports the interactive code when its wrapper comes within 600 px of the viewport (as `DemoLoader` does for the mini-demo) and swaps it in with identical markup. A wrapper hidden by CSS (the desktop or phone set of carousel buttons) never loads its island. Also: `GetTheAppButton` became a server component with no JS (touch screens link to `/download`; mouse + hover screens open the native popover, CSS variant `pointer-fine`), and the live-refresh watcher loads after the `load` event (ADR-033) | Home first-load JS was over the 170 KB budget (NFR-PERF-02), most likely since the 2026-11-05 GSAP panels. Owner chose the recommended fix (2026-11-07). The content, layout and no-JS behaviour are unchanged; the buttons do nothing until the code arrives, which starts 600 px before the section is on screen. Supersedes the "server-rendered island, not lazy" note of T-3.08 | Accepted (owner, 2026-11-07) |
| ADR-035 | 2026-11-09 | **SEO plumbing (Phase 5).** (1) `src/lib/seo.ts` `pageMetadata` gives every page title, description (≤ 160, cut at a word), canonical = self, hreflang fr/en/x-default→fr, Open Graph and Twitter tags; CMS SEO fields win over defaults; titles that would pass 65 characters with " · HandyMan Do IT" drop the suffix and are cut at a word (`og:title` keeps the whole title). (2) An article not yet written in French (ADR-019) declares only its English page: the French copy's canonical points to `/en/blog/x` and the sitemap lists the English URL only, so the two copies don't compete. (3) **One `sitemap.xml`** for both languages, each URL with its `xhtml:link` alternates, instead of PLAN §8's "a sitemap per language": same information for Google, one file to submit, and it refreshes through the CMS cache tags like the pages. (4) next-intl's own hreflang `Link` header is off (`alternateLinks: false`): it ignores translated slugs and our x-default, so it contradicted the page tags. (5) Share images: an `opengraph-image.tsx` per route renders the page's own metadata in brand colours (`src/lib/ogImage.tsx`, Sora/Poppins TTFs in `src/assets/fonts`), pre-rendered at build for every locale × slug, cached on first request for newer slugs; excluded from the locale middleware. (6) Legacy 301s (`src/lib/legacyRedirects.ts`, served from `next.config.ts`) go to the **English** pages: the old site was English only, so the same content in the same language keeps its ranking; WordPress dated permalinks keep the slug; WooCommerce `/shop/…` → the app. Next's trailing-slash redirect is replaced by the same rule placed after the legacy map, so old `/x/` URLs take one hop. (7) CMS editor redirects are followed where a URL would otherwise 404 (catch-all and slug pages), so they cost nothing on live pages (308/307). (8) JSON-LD: Organization, WebSite, MobileApplication and two HomeAndConstructionBusiness offices (from the `seo` and `site` globals) linked by `@id`; existing Service/Article/FAQPage/Review/BreadcrumbList unchanged. (9) Site CSS is inlined in the HTML (`experimental.inlineCss`): one round trip less before first paint | FR-SEO-01..05. Old URLs are English, and Google treats a language change as a different page. Alternatives (redirect to the French default, or to an unprefixed path left to language detection) would either change the language of a ranked page or add a second hop. | Accepted (dev, 2026-11-09); sitemap deviation from PLAN §8 to confirm with owner |
| ADR-036 | 2026-11-09 | **Consent before analytics, analytics after load.** GA4 (`NEXT_PUBLIC_GA_ID`) with Consent Mode v2 is **only loaded after the visitor accepts**: before that no Google script, request or cookie at all (stricter than loading gtag with consent denied, which sends cookieless pings). `track()` queues events until a choice; accept sends them, reject drops them. One client shell in the locale layout (`AfterLoad`, which also runs ADR-033's live refresh) imports, after the load event, `consent/runtime.ts`: plain code, one delegated listener that turns store / web-app / WhatsApp / call link clicks (recognised by URL), `<details data-track-faq>` toggles, the QR popover and the film's play into the FR-ANA-02 events, so server-rendered links need no JS of their own; it also adds the landing page's `utm_*` to store links at click time (Play `referrer`, App Store `ct`, `/download` query; kept for the session). The React banner (`ConsentBanner`) and the GA loader (`ga.ts`) are separate chunks, fetched only when needed. Banner: bilingual region at the bottom, not modal; Accept and Reject equal; Customise shows the two categories; the footer's "Cookie settings" reopens it with focus. Deviates from prompt 5.3 ("gtag with next/script afterInteractive"): that would load ~150 KB of third-party JS on every visit, before consent | FR-ANA-01..03; NFR-PERF (Lighthouse, home JS budget); privacy policy says "consent before analytics". Trade-off: a click in the first moments after load, before the runtime arrives, is not counted and gets no campaign tags | Accepted (dev, 2026-11-09) |
