# Requirements Specification

Version 1.0 · 2026-10-23 · Derived from [PLAN.md](PLAN.md) v1.1. Where this file and PLAN.md disagree on scope, PLAN.md wins; fix this file.

Every requirement has a stable ID. Code, tests, tracker items and PRs reference these IDs (e.g. `FR-HOME-02`). Priority uses MoSCoW: **M** must (launch blocker), **S** should, **C** could, **W** won't (this release).

---

## 1. Purpose and success criteria

**Problem.** The current handymandoit.com is a dated static site plus separate WordPress blog and WooCommerce shop. It doesn't explain the app, doesn't convert visitors to app users, and is hard to edit.

**Goal.** One fast, bilingual, CMS-editable website that turns visitors in Cameroon into app users and customers, and keeps the old site's search ranking.

| ID | Success metric | Target (90 days after launch) |
|---|---|---|
| KPI-1 | Store + web-app click-through rate (sessions with `store_click` or `webapp_click`) | ≥ 8 % |
| KPI-2 | WhatsApp/call contacts per month | ≥ baseline of old site |
| KPI-3 | Organic traffic retained after migration | ≥ 90 % of pre-launch by week 6 |
| KPI-4 | Core Web Vitals (field, mobile) | "Good" on all three |
| KPI-5 | Editor independence | All content changes made in CMS without a developer |

## 2. Stakeholders and audiences

| Who | Need |
|---|---|
| **Households** (primary) | Trust that pros are vetted, a clear price, safe payment, fast booking |
| **Businesses** | Quotes for signage, events, office remodels; a contact person |
| **Buildings / estates / property managers** | Run notices, charges and issue reports in the app |
| **Pros, sellers, kitchens** | Understand how to earn with the same app and sign up |
| **Editors** (company staff) | Edit all copy, media, FAQs, posts, jobs in FR and EN without code |
| **Owner / management** | Leads, analytics, brand consistency with the app |

## 3. Scope

**In scope:** every page in PLAN.md §4; CMS for all content; FR + EN; forms → CMS + email; SEO migration (301s); GA4 with consent; Hostinger deploy behind Cloudflare.

**Out of scope (W):** transactional booking or payment on the website (that is the app's job); user accounts for the public; Pidgin site language (later); e-commerce checkout (old shop redirects to the app).

---

## 4. Functional requirements

### 4.1 Global / layout

| ID | P | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-GLB-01 | M | Header with logo, nav (Services mega-menu, Businesses, Become a pro, Our work, About, Blog), language switch, "Get the app" pill | Transparent over hero, frosted dark after scroll; all links work in both locales; keyboard operable; mobile full-screen menu with store buttons |
| FR-GLB-02 | M | Footer: logo, tagline, values, 4 link columns, contact, offices, socials, store badges, language switch, © | All contact data comes from the `site` global |
| FR-GLB-03 | M | Floating WhatsApp button on every public page | Appears after a delay; doesn't overlap CTAs on 390 px; fires `whatsapp_click` |
| FR-GLB-04 | M | Smart "Get the app": Android → Play, iOS → App Store if set else web app + Add-to-Home hint, desktop → QR popover | Verified on Android, iPhone, desktop; UTM passed through (FR-ANA-03) |
| FR-GLB-05 | M | Skip-to-content link | First focusable element; visible on focus |
| FR-GLB-06 | M | iOS badge hidden while `site.appStoreUrl` is empty | Toggling the CMS field shows/hides it after revalidation |

### 4.2 Internationalisation

| ID | P | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-I18N-01 | M | Routes are `/{fr\|en}/…` with translated slugs per `src/i18n/routing.ts` | `/` redirects by `Accept-Language`; choice remembered in cookie |
| FR-I18N-02 | M | Language switcher keeps visitor on the equivalent page | Works on static and dynamic (`[slug]`) routes |
| FR-I18N-03 | M | All UI strings in `messages/fr.json` and `messages/en.json` with identical keys | Automated parity check passes (QA-AUTO-04) |
| FR-I18N-04 | M | All editable CMS content localized FR/EN | Editors see both; missing-FR indicator in admin (S) |
| FR-I18N-05 | M | `<html lang>` matches locale; OG locale `fr_CM` / `en_CM` | Verified in page source |

### 4.3 Home page (PLAN.md §5)

| ID | P | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-HOME-01 | M | Synced-story hero: looping footage, H1, subhead, 2 CTAs, "Watch the film" lightbox, trust row, 3D phone with notifications on video timestamps from a CMS cue list | Cues fire within ±250 ms of timestamps; H1 is LCP and never waits for video |
| FR-HOME-02 | M | Light-data mode: on Save-Data, slow connection, mobile data, or reduced motion → poster image + timer-driven notifications | Video file not requested in these modes (Network panel) |
| FR-HOME-03 | S | Partner logo marquee + "Featured on Spectron Magazine" | Pauses on hover; static under reduced motion |
| FR-HOME-04 | M | Services bento grid (2 large + 9 small + Shop + Food) linking to service pages | Each tile: photo, icon, "From X FCFA" or fallback "Clear price before you book" |
| FR-HOME-05 | M | Value pillars (Punctual, Polite, Professional) + 4 trust features | Copy from CMS |
| FR-HOME-06 | S | Animated counters + Cameroon map | Numbers from `site` global; counters static under reduced motion |
| FR-HOME-07 | M | Pinned scroll story, 6 chapters, laptop + phone finale; horizontal swipe on mobile | No pinning < 768 px; GSAP loaded only when in view |
| FR-HOME-08 | M | How it works (3 steps) | Line draws on scroll; static fallback |
| FR-HOME-09 | S | Interactive mini-demo phone (category → pros → booking sheet) | Keyboard & screen-reader operable; fires `demo_interact {step}` |
| FR-HOME-10 | S | 3D coverflow screens gallery with light/dark toggle, localized screenshots | Drag, swipe, arrow keys |
| FR-HOME-11 | M | Testimonials slider (4 real reviews) + aggregate rating (hidden until real numbers) | Data from `testimonials` + `site` |
| FR-HOME-12 | M | Homes / Businesses / Buildings cards with CTAs | |
| FR-HOME-13 | M | Earn with HandyMan tabs (Pros / Sellers / Kitchens) + step strip → `/become-a-pro` | Accessible tabs pattern |
| FR-HOME-14 | M | FAQ accordion (8 `showOnHome` FAQs) with FAQPage JSON-LD | Fires `faq_open` |
| FR-HOME-15 | M | Download band: badges, QR on desktop, web-app link | |
| FR-HOME-16 | S | Latest 3 blog posts | |

### 4.4 Inner pages (PLAN.md §6)

| ID | P | Page | Acceptance criteria |
|---|---|---|---|
| FR-PG-01 | M | Services index | Filterable grid, pricing explainer, quote CTA |
| FR-PG-02 | M | Service detail ×11 | Hero, inclusions, from-price, process, related work, service FAQs, sticky Book/Quote bar, `Service` JSON-LD |
| FR-PG-03 | M | Businesses | Case studies, logos, B2B quote form |
| FR-PG-04 | S | Buildings | Features for residents & managers, CTA |
| FR-PG-05 | S | Shop, Food | Marketing pages linking into the app |
| FR-PG-06 | M | Become a pro | Benefits, requirements, 4-step onboarding, payouts, application form |
| FR-PG-07 | M | Our work + case study | Masonry, filter by service & city, before/after slider |
| FR-PG-08 | M | Reviews | All testimonials, `Review`/`AggregateRating` JSON-LD |
| FR-PG-09 | M | About | Story, mission, values, team, partners (`#partners`), CSR (`#csr`) |
| FR-PG-10 | S | Careers + role | Open roles from CMS; apply form with CV upload to R2 |
| FR-PG-11 | M | Blog + article | 20 migrated posts, categories, search, related posts, `Article` JSON-LD |
| FR-PG-12 | M | FAQ | Full list by category |
| FR-PG-13 | M | Contact | General / quote / partnership forms, WhatsApp, map with 2 pins, hours |
| FR-PG-14 | M | `/download` | Server-side UA detection → store redirect; desktop QR page |
| FR-PG-15 | M | Legal: privacy, terms, disclaimer | CMS-editable rich text |
| FR-PG-16 | M | Localized 404 page | Links home; correct status 404 |

### 4.5 Forms and submissions

| ID | P | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-FORM-01 | M | Forms: contact, quote (home/business), partnership, pro application, job application | Validated client and server with the same zod schema |
| FR-FORM-02 | M | Submissions stored in `submissions` (read-only to editors) and emailed to the site inbox | Email arrives; record visible in admin |
| FR-FORM-03 | M | Spam protection: honeypot + time-to-submit + per-IP rate limit | Bot submission blocked; human not impacted |
| FR-FORM-04 | M | File upload (CV) limited to PDF/DOC ≤ 5 MB, stored privately | Not publicly listable |
| FR-FORM-05 | M | Accessible errors, localized messages, success state | Errors announced via `aria-live` |

### 4.6 CMS / editor experience

| ID | P | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-CMS-01 | M | All collections/globals in [data-model.md](data-model.md) | Editors can create/edit/publish all content |
| FR-CMS-02 | M | Roles: admin, editor | Editors can't manage users or site settings |
| FR-CMS-03 | M | Draft/publish for pages with public impact | Drafts never visible publicly |
| FR-CMS-04 | M | On publish, only affected pages revalidate | Change visible on site within 10 s, no redeploy |
| FR-CMS-05 | S | Live preview | Preview shows draft in chosen locale |
| FR-CMS-06 | M | Media alt text required + localized | Save blocked without alt |
| FR-CMS-07 | M | Seed script fills the CMS with the old site's content in FR and EN | `npm run seed` twice: 2nd run creates nothing; refuses a non-local DB without `--force`; never overwrites editor changes without `--update` |

### 4.7 SEO and migration

| ID | P | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-SEO-01 | M | Per-page localized title/description, canonical, `hreflang` fr/en/x-default→fr | Validated on every template |
| FR-SEO-02 | M | `sitemap.xml` (both locales) + `robots.txt`; `/admin` noindex | Search Console accepts sitemap |
| FR-SEO-03 | M | JSON-LD: LocalBusiness ×2, MobileApplication, Service, FAQPage, Article, Review/AggregateRating, BreadcrumbList | Rich Results Test passes |
| FR-SEO-04 | M | Dynamic OG image per page (`next/og`) | 1200×630, brand colours |
| FR-SEO-05 | M | 301 redirects for every old URL in PLAN.md §8 | Automated redirect test: 100 % pass |

### 4.8 Analytics

| ID | P | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-ANA-01 | M | GA4 with Consent Mode v2, bilingual cookie banner; no analytics cookies before consent | Verified in DevTools |
| FR-ANA-02 | M | Events: `store_click{store,placement}`, `webapp_click`, `qr_view`, `whatsapp_click`, `call_click`, `quote_submit{type}`, `pro_apply`, `job_apply`, `lang_switch`, `video_play`, `demo_interact{step}`, `faq_open` | Each visible in GA4 DebugView |
| FR-ANA-03 | M | UTM parameters forwarded to store links (Play `referrer`) | Verified on a tagged URL |

---

## 5. Non-functional requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-PERF-01 | Performance | LCP < 1.8 s, INP < 150 ms, CLS < 0.05 on mid-range Android over 4G |
| NFR-PERF-02 | Performance | Home first-load JS < 170 KB gzip; hero poster < 120 KB AVIF |
| NFR-PERF-03 | Performance | Lighthouse ≥ 95 / 100 / 100 / 100 (Perf / A11y / BP / SEO) on home and one page per template |
| NFR-PERF-04 | Performance | Pages pre-rendered; TTFB from Cloudflare cache < 200 ms in Douala |
| NFR-A11Y-01 | Accessibility | WCAG 2.2 AA; full keyboard; visible focus; captions on brand film |
| NFR-A11Y-02 | Accessibility | `prefers-reduced-motion` disables pinning, parallax, marquees, autoplay |
| NFR-SEC-01 | Security | Secrets only in env; HTTPS only (Cloudflare Full strict); security headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, frame-ancestors) |
| NFR-SEC-02 | Security | Admin protected by Payload auth; strong passwords; first-user bootstrap done before public exposure |
| NFR-SEC-03 | Security | Forms validated server-side, rate-limited; uploads type/size checked |
| NFR-SEC-04 | Security | Dependencies: no known high/critical vulns at release (`npm audit --omit=dev`) |
| NFR-PRIV-01 | Privacy | Consent before analytics; privacy policy lists data collected by forms; submissions retained ≤ 24 months |
| NFR-REL-01 | Reliability | Uptime ≥ 99.5 % monthly; cached pages survive origin outage (Cloudflare) |
| NFR-REL-02 | Reliability | Neon point-in-time restore available; R2 media not on Hostinger disk |
| NFR-MAINT-01 | Maintainability | TypeScript strict, lint clean, CI green on every PR |
| NFR-MAINT-02 | Maintainability | Schema changes always ship with a migration |
| NFR-COMPAT-01 | Compatibility | Last 2 versions of Chrome, Safari (iOS 16+), Firefox, Samsung Internet; Android 9+ Chrome; 360 px minimum width |
| NFR-HOST-01 | Platform | Runs within Hostinger limits: no WebSockets, no workers/cron, 120 s request cap, ~3 GB RAM |

## 6. Constraints and assumptions

- Hostinger Node.js hosting provides MySQL only → database is external (Neon Postgres).
- App Store URL, real footage, demo account, store ratings, prices and vector logo may arrive late; each has a CMS-switchable placeholder (PLAN.md §13). None blocks the build.
- French copy written in-house, reviewed by a native speaker before launch.

## 7. Traceability

Each tracker task in [project-tracker.md](project-tracker.md) lists the requirement IDs it satisfies. Each test case in [quality-assurance.md](quality-assurance.md) lists the IDs it verifies. A requirement is **Done** only when it has passing verification evidence.
