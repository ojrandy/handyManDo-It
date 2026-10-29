# Project Tracker

Last updated: **2026-10-28** · Current phase: **Phase 0 — Foundations (in progress)** · Plan status: PLAN.md v1.1 **approved** (2026-10-23)

Status: ✅ done · 🔄 in progress · ⬜ to do · ⛔ blocked · ➖ dropped
Update this file in the same PR as the work. Every task lists the requirement IDs it satisfies.

---

## 1. Phase overview (PLAN.md §12)

| Phase | Goal | Sign-off gate | Status |
|---|---|---|---|
| 0. Foundations | Stack wired, i18n, tokens, CI, staging | Staging loads `/fr`, `/en`; `/admin` works | 🔄 code done; staging gate deferred (owner, 2026-10-24) |
| 1. Content & assets | Migrations/seeds, CMS model, screens, video, FR copy | All content visible in CMS | 🔄 build plan written 2026-10-27 (§3, data-model.md §8) |
| 2. Hero prototype | Header + synced-story hero + light-data mode | **Owner approves the look** | ✅ owner moved on to Phase 3, 2026-10-24 (footage, captions, Lighthouse on device still open) |
| 3. Home page | Sections 5.3–5.17 | Home complete in both locales | 🔄 |
| 4. Inner pages | All §6 pages, forms, `/download` | Every page live on staging | ⬜ |
| 5. SEO & analytics | JSON-LD, sitemaps, hreflang, OG, redirects, GA4 | Rich results pass; events in DebugView | ⬜ |
| 6. QA & launch | Device/perf/a11y audit, content review, DNS cut-over | Go-live | ⬜ |

## 2. Phase 0 — Foundations

| ID | Task | Req | Status | Notes |
|---|---|---|---|---|
| T-0.01 | Scaffold Next.js 16.3.3 + Payload 3.92 + TS strict | NFR-MAINT-01 | ✅ | |
| T-0.02 | Postgres adapter, docker compose (PG 17) | ADR-002 | ✅ | |
| T-0.03 | R2 storage plugin (toggle on `S3_BUCKET`) | ADR-003 | ✅ | Not yet tested against a real bucket |
| T-0.04 | Email adapter (nodemailer, console fallback) | FR-FORM-02 | ✅ | SMTP provider not chosen |
| T-0.05 | Payload localization fr/en, admin i18n | FR-I18N-04 | ✅ | |
| T-0.06 | next-intl routing with translated pathnames, `proxy.ts` | FR-I18N-01 | ✅ | |
| T-0.07 | Design tokens, fonts (Sora + Poppins), utilities | design-system | ✅ | |
| T-0.08 | `Users` (roles, first-user admin), `Media` (sizes), `Site` global | FR-CMS-02 | ✅ | Media create/update/delete restricted to editors (`isEditor`), 2026-10-23 |
| T-0.09 | Placeholder home + LanguageSwitcher + skip link | FR-I18N-02, FR-GLB-05 | ✅ | |
| T-0.10 | PWA manifest, icons, OG default | FR-SEO-04 | ✅ | |
| T-0.11 | CI: typecheck, lint, build | QA-AUTO-01 | ✅ | Extended by T-0.21 (migrate, int, e2e) |
| T-0.12 | Align tooling on npm (Playwright `webServer.command`, `.vscode` `npm.packageManager`) | ADR-010 | ✅ | Both now npm |
| T-0.13 | **Initial DB migration** `src/migrations/` | NFR-MAINT-02 | ✅ | `20261023_172405_initial` created + applied locally (15 tables) |
| T-0.14 | First git commit + GitHub repo + branch protection | — | 🔄 | `0253fb0` pushed to `origin/main` 2026-10-23 (owner-approved). First CI run green (GitHub Actions, 2026-10-23). Remaining (owner, GitHub settings; runbook DEPLOY.md §1 "GitHub"): decide visibility (repo is currently **public**), then protect `main` requiring the `check` job once the hardening PR is green |
| T-0.15 | Neon project + `staging` branch | ADR-002, ADR-013 | ⏸ deferred | Project exists in **us-east-1** (kept, owner decision 2026-10-23). Pooled connection string obtained (default branch `neondb`). Remaining (owner, Neon console; runbook DEPLOY.md §1 "Neon"): create the `staging` branch and put its pooled string in Hostinger env vars **only**; local `.env` points at Docker again (2026-10-23), because dev schema-push would otherwise alter Neon |
| T-0.16 | R2 bucket, token, CORS, r2.dev | ADR-003, ADR-014 | ⏸ deferred | Owner decision 2026-10-23: later. Until then media is stored on local disk. On Hostinger, uploads may be lost on redeploy, so don't upload final content to staging before R2 |
| T-0.23 | First-user form: hide `roles` from non-admins | FR-CMS-02 | ✅ | Field `access.create` admin-only; hook still makes first user admin |
| T-0.17 | Hostinger Node app + env vars + first deploy | NFR-HOST-01 | ⏸ deferred | Owner decision 2026-10-24: finish the design first, deploy afterwards; until then work is only pushed to GitHub. Needs hPanel access (owner). Runbook + env table + gate checks: DEPLOY.md §1 "Hostinger" and "First deploy and Phase 0 gate"; gate verified with `E2E_BASE_URL=… npm run test:smoke` |
| T-0.18 | Cloudflare zone (copy DNS, keep `app` record intact) | — | ⬜ | Can wait until launch |
| T-0.19 | Localized `not-found.tsx` + `error.tsx` | FR-PG-16 | ✅ | `[locale]/not-found.tsx`, `error.tsx`, `[...rest]` catch-all → localized 404 with status 404; shared `StatusMessage` |
| T-0.20 | Security headers in `next.config.ts` | NFR-SEC-01 | ✅ | CSP on site routes (not `/admin`, `/api`), nosniff, XFO, Referrer, COOP, Permissions; HSTS only on https (ADR-015) |
| T-0.21 | Message parity test + int/e2e in CI | QA-AUTO-02..04 | ✅ | CI: migrate (QA-AUTO-12) → int → build → e2e on `next start`; Vitest env `node` |
| T-0.22 | Replace Payload template tests with project smoke tests | QA-AUTO-03 | ✅ | `messages`, `access` int specs; `site`, `admin` e2e specs; seeding refuses non-local DBs |

**Verified 2026-10-23:**
- `tsc --noEmit` clean; `eslint .` 0 errors; `fr.json`/`en.json` key parity OK.
- `npm run build` passes (Next 16.3.3 Turbopack; `/fr`, `/en` SSG). Took about 8 min on the dev machine, so watch Hostinger build time and memory.
- `next start` smoke test:
  - `/` → 307 `/fr` (fr browser) or `/en` (en browser); `/fr`, `/en` 200 with correct `lang`, title and H1
  - hreflang `Link` header (fr, en, x-default)
  - `/admin` → create-first-user
- Screenshots checked: `/fr` at 1440 px, `/en` at 390 px.

**Hardening, verified 2026-10-23 (branch `chore/phase-0-hardening`):** see change log. Commands and results are listed in the PR description.

## 3. Phase 1 — Content & assets

| ID | Task | Req | Status |
|---|---|---|---|
| T-1.01 | Collections: services, projects, testimonials, team, partners, faqs | FR-CMS-01 | ✅ 2026-10-27: team + partners, services, projects + testimonials, faqs (one migration each, branches 1–4) |
| T-1.02 | Collections: posts, categories, jobs, appScreens, submissions (+ private files) | FR-CMS-01 | ✅ 2026-10-27: posts + categories, jobs + submissions + private files, app screens (branches 5–7) |
| T-1.03 | Globals: navigation, home (with hero cues), seo | FR-CMS-01 | ✅ 2026-10-27: navigation + seo (branch 8), home with drafts + hero cues (branch 9) |
| T-1.04 | Revalidation hooks for all public content | FR-CMS-04 | ✅ 2026-10-27: every public collection and global purges its tag (`src/hooks/revalidate.ts`); in effect on the home page since T-1.15 |
| T-1.05 | Drafts + live preview | FR-CMS-03, FR-CMS-05 | ⬜ |
| T-1.06 | SEO plugin + redirects plugin config | FR-SEO-01 | ✅ 2026-10-27: SEO tab on services, projects, posts; redirects collection (editor write, normalised unique `from`, 301 default). Serving editor redirects at request time is Phase 5 |
| T-1.07 | `scripts/seed.ts` (idempotent) from old site | FR-CMS-07 | ✅ 2026-10-28: `npm run seed` fills 11 services, 4 testimonials, 3 team, 8 partners, 9 FAQs (8 on home), `site`, `navigation`, `home` (published) from messages + `src/lib`; 22 media uploaded once. Matches on service key / name / logo file / FR question; skips existing records (`--update` overwrites); refuses non-local DB without `--force`. Team roles are placeholders (Q-16); cancellation FAQ written from the owner policy (cancel while the work has not started and the pro is not on the way; 50% refund once work has started; FR review in T-1.11) |
| T-1.16 | Int tests share the dev DB: `home.int.spec` leaves test copy in `home`, `globals.int.spec` empties `navigation`. Restore globals after each spec (or a separate test DB); raise the 60 s `hookTimeout`, since parallel Payload boots take 48–64 s on the dev machine. Smoke e2e against `next dev`: `/admin/login` takes ~30 s on first compile, over the 30 s test timeout | QA-AUTO-03 | ✅ 2026-10-28: int tests run on their own database (`handymandoit_test`, or `TEST_DATABASE_URL`), created by the global setup and schema-pushed on first boot; dev content is no longer touched and CI seeds once (no `--update`). `hookTimeout` 120 s. Smoke admin check marked slow (90 s). Fixed a seed bug the empty DB exposed: partner logos were re-uploaded on every run when a same-named file was already on disk (Payload re-encodes them, so the size match failed); renamed copies now match on `name-N.ext` + image dimensions |
| T-1.08 | `scripts/migrate-wordpress.ts` (20 posts + media, legacyUrl) | FR-PG-11 | ✅ 2026-10-28: `npm run migrate:wordpress` imports the 20 published posts from the WordPress REST API in the `en` locale (FR reads need `fallbackLocale: en`, ADR-019), 2 categories (FR names added, “Uncategorized” dropped), covers and ~140 inline images as Lexical upload nodes (148 files, originals capped at 2400 px). Matches on `legacyUrl` / slug / file name; skips existing unless `--update`; a post whose image fails is not saved, so a re-run retries it. WordPress alt text was empty: alt = caption, descriptive media title or post title (editor review). Old-site links inside articles are kept for the Phase 5 301 map |
| T-1.09 | `scripts/capture-screens.ts` (fr/en × light/dark) | FR-HOME-10 | ✅ 2026-10-28: `npm run capture:screens` captures welcome, home, services, category, shop, food, help × fr/en × light/dark at 390×844 @3× (1170×2532 WebP) from the signed-out app and upserts `app-screens` (key × lang × theme) with FR/EN captions and alt. Language from the browser locale, theme via the in-app toggle; the app’s static files are cached in `.cache/app-assets` (cold load took ~4 min from the dev machine). Tracking, wallet, chat, completion need a signed-in account with a booking: 2026-10-29, “Continue as guest” only browses (Activity sends back to sign-in) and the app’s demo paths are off on the live backend, so they stay HTML rebuilds. The hero and download-band phones now show the captured home screen (light/dark, page language), HTML rebuild as fallback. 2026-10-29: `pro` screen added (owner consent: a real pro's public profile, the first featured pro on the app home), migration `phone_size_pro_screen` |
| T-1.10 | Hero video: select stock, encode MP4/WebM ×3, poster AVIF < 120 KB, cue list | FR-HOME-01 | ✅ 2026-10-29: hero is a still photo for now (owner, 2026-10-29: use old-site photos): two HandyMan pros cutting timber (old site `about-bg`), AVIF 111 KB, under the overlay with a slow zoom (static under reduced motion); cues run on the timer. Footage stays optional (Q-4). 2026-10-28: pipeline done. `home.hero.video` gains 1080p and 480p MP4/WebM fields (migration `hero_video_sizes`, ADR-018), the hero plays them through `<source media>`; `npm run encode:hero -- <clip>` encodes 480/720/1080p MP4 + WebM and an AVIF poster within 120 KB, `--upload` attaches them to the published `home`, `--cues=` retimes the 5 cues; `--poster=<photo>` sets a still without ffmpeg. Video encoding not run end to end: ffmpeg is not installed on the dev machine |
| T-1.11 | French + English copy for all sections | FR-I18N-04 | ✅ 2026-10-28: every home section has FR + EN copy in messages, seeded into `home`. FR pass: no-break spaces before ? ! : ; %, inside « » and in numbers (test in `messages.int.spec`), hours “de 7 h à 21 h”, “bloqué” → “sécurisé” for held payments, “L’esprit tranquille, à chaque étape”, “appels de charges” for buildings, cancellation FAQ reviewed. Seed FAQ lookup also matches the old plain-space questions, so `npm run seed -- --update` fixes them in place. Native-speaker sign-off stays T-6.03 (Q-8) |
| T-1.12 | Access-control int tests (extend `tests/int/access.int.spec.ts` to the editor/admin matrix) | QA-AUTO-08 | ✅ 2026-10-29: declared anonymous × editor × admin matrix for every collection, global and operation (incl. Payload defaults: `readVersions`, `unlock`), fails when a new collection has no row; real Local API checks for accounts, roles, `site`/`seo`, drafts. Found and fixed: editors could unlock locked accounts (`users.unlock` now admin), anonymous `?draft=true` returned unpublished `home` drafts (`home.read` now `publishedOrEditor`) |
| T-1.13 | `src/lib/payload.ts`: cached `getPayload()` + typed query helpers (architecture §6) | NFR-MAINT-01 | ✅ `getPayloadClient`, `getGlobal`, `findDocs` (tagged `unstable_cache`, public access rules), 2026-10-27 |
| T-1.14 | `site` global: `afterChange` → `revalidateTag('site')` when pages start reading it (part of T-1.04) | FR-CMS-04 | ✅ hook in place 2026-10-27; pages switch in T-1.15 |
| T-1.15 | Switch home sections from `src/lib/*` (services, showcase, hero, site) to Payload reads; `lib` files stay as seed source and fallbacks | FR-CMS-01, FR-CMS-04 | ✅ 2026-10-28: all 11 home sections read `home`, `site`, services, partners, testimonials and FAQs through `src/lib/home.ts` (cached, tagged). Empty field or collection ⇒ messages / `src/lib` copy; a failed read throws so Next keeps the last good page. CMS images use their upload sizes (`CmsImage`). Hero avatars are now the featured testimonials' photos; partner `url` links the logo. CI reseeds before build (T-1.16). Build now needs a migrated DB (Q-17) |
| T-1.17 | Header + footer read the `navigation` and `site` globals (menu, footer columns, contact, socials, store links); `GetTheApp`, `WhatsAppFab`, `StoreBadges` defaults from `site` | FR-CMS-01, FR-GLB-01/02 | ✅ 2026-10-29: `src/lib/navigation.ts` (link resolver, one mega-menu, unpublished docs skipped; read tagged with the linked collections), `src/lib/settings.ts` (`getSiteSettings` moved from `lib/home.ts`, + contact, hours, offices, socials). Empty global ⇒ built-in menus. Seed footer column aligned with the built-in one (6 short names): the dev DB keeps the old 11-link column until `npm run seed -- --update`. `StatusMessage` (404/error) still uses `lib/site` (client error boundary can't read Payload) |

**Build plan (2026-10-27).** One branch per row, one migration per branch, merged in order (data-model.md §8). Branch 0 is helpers only (no schema change).

| # | Branch | Migration | Scope | Tasks |
|---|---|---|---|---|
| 0 | `chore/cms-helpers` | — | `src/access/`, `src/fields/slug.ts` + `order.ts`, `src/hooks/revalidate.ts`, `src/lib/payload.ts`, `site` revalidation | T-1.04, T-1.13, T-1.14 |
| 1 | `feat/cms-team-partners` | `add-team-partners` | team, partners | T-1.01 |
| 2 | `feat/cms-services` | `add-services` | services (drafts, SEO plugin) | T-1.01, T-1.06 |
| 3 | `feat/cms-projects-testimonials` | `add-projects-testimonials` | projects, testimonials, joins on services | T-1.01 |
| 4 | `feat/cms-faqs` | `add-faqs` | faqs, join on services | T-1.01 |
| 5 | `feat/cms-blog` | `add-posts-categories` | categories, posts | T-1.02 |
| 6 | `feat/cms-jobs-submissions` | `add-jobs-submissions` | jobs, private `files`, submissions | T-1.02 |
| 7 | `feat/cms-app-screens` | `add-app-screens` | appScreens | T-1.02 |
| 8 | `feat/cms-nav-seo` | `add-navigation-seo-globals` | navigation, seo globals | T-1.03 |
| 9 | `feat/cms-home` | `add-home-global` | home global (hero cues) | T-1.03 |
| 10 | `feat/cms-redirects` | `add-redirects` | redirects plugin | T-1.06 |

Phase 2/3 sections are unaffected: they read `src/lib/*`, not Payload. Field shapes match those files (service `key` + slugs + icon, hero cue keys) so T-1.15 is a swap.

## 4. Phase 2 — Hero prototype

| ID | Task | Req | Status |
|---|---|---|---|
| T-2.01 | Header (transparent → frosted, mega-menu, mobile menu) | FR-GLB-01 | ✅ `Header` + `HeaderShell`; mega-menu (click/hover, Esc returns focus), mobile menu as modal `<dialog>` with store badge + language switch |
| T-2.02 | Button, StoreBadges, GetTheApp (smart), PaymentBadges | FR-GLB-04/06 | ✅ `buttonClasses()`, official Google Play badges (fr/en), App Store link hidden until URL (official badge to add with Q-3); QR popover encodes the Play URL until `/download` (T-4.10) |
| T-2.03 | Hero: video + overlay + H1/CTAs + trust row | FR-HOME-01 | ✅ code; footage pending T-1.10/Q-4 (`heroVideo` in `src/lib/hero.ts`, designed background meanwhile). Trust avatars are initials until testimonials (T-1.01); rating row hidden (Q-6). Scroll cue added with Phase 3 sections |
| T-2.04 | Phone frame + cue-synced notifications | FR-HOME-01 | ✅ `device/Phone` + HTML `AppHomeScreen` until real screens (T-1.09); cues sync via `requestVideoFrameCallback` (timeupdate fallback); cue list moves to the `home` global (T-1.03) |
| T-2.05 | Light-data / reduced-motion mode | FR-HOME-02 | ✅ `useLightData` (Save-Data, slow/cellular, reduced motion); video never rendered or requested (e2e); pause control for WCAG 2.2.2 |
| T-2.06 | Brand film lightbox with captions | FR-HOME-01, NFR-A11Y-01 | 🔄 lightbox done (native `<dialog>`, `preload="none"`); captions need the film's audio transcript from the owner |
| T-2.07 | Lighthouse + device check of hero; owner approval | NFR-PERF-01 | 🔄 2026-10-29: desktop LCP is the phone screenshot (owner: keep it, make it fast); mobile LCP stays the subhead. The srcset now names real file widths (`images.deviceSizes` = Media sizes; before, 2× screens got the 960 px file, ~95 KB), a 560 px `phone` size serves 2× desktops and phones (~40 KB), the image is preloaded at high priority, the media origin preconnected, and the hero photo and film poster no longer compete with it. Local production build, desktop profile (40 ms RTT, 10 Mbps): LCP 1.2–1.5 s (one 2.2 s outlier); slow 4G + 4× CPU: ~3 s desktop, 2.3–2.6 s mobile text. Pending: Lighthouse against the deployed site (R2/Cloudflare), mid-range Android, owner approval |

## 5. Phase 3 — Home page

| ID | Task | Req | Status |
|---|---|---|---|
| T-3.01 | Trusted-by marquee | FR-HOME-03 | ✅ 8 logos from the old site, CSS marquee (pauses on hover/focus, static under reduced motion); names and 300 px logos confirmed from the live site 2026-10-28 (Q-10) |
| T-3.02 | Services bento | FR-HOME-04 | ✅ 8 real project photos from the old site (low-res, Q-12), icon tiles for moving/packing/transport, Shop + Food, custom-quote tile; "Clear price before you book" until prices (Q-5) |
| T-3.03 | Pillars + trust features | FR-HOME-05 | ✅ copy in messages until the `home` global (T-1.03) |
| T-3.04 | Numbers + map | FR-HOME-06 | ✅ counters (final value server-rendered), Natural Earth outline, towns light via CSS view timeline; numbers from the `site` global (T-1.15) |
| T-3.05 | Scroll story + mobile swipe | FR-HOME-07 | 🔄 2026-10-29: code done. 6 chapters + laptop/phone finale; phone pinned with CSS `sticky` (≥ 768 px, motion allowed: `pinned` variant), current chapter from an IntersectionObserver (`StoryObserver`), screens crossfade; horizontal scroll-snap swipe on phones and under reduced motion. No GSAP (ADR-021, **owner sign-off needed**: PLAN.md named GSAP). Browse = captured home screen; price/pay/track/code/rewards are HTML rebuilds (not capturable, T-1.09). Copy in messages (no `home` fields yet). e2e pass 2026-10-29 (production build). Pending: owner visual check at 1440/390 |
| T-3.06 | How it works | FR-HOME-08 | ✅ line draws via CSS view timeline, static fallback |
| T-3.07 | Mini-demo | FR-HOME-09 | 🔄 2026-10-29: code done. Category → pros → booking sheet → done + “open the app”; real buttons in a labelled group, focus moves to each screen heading, `aria-pressed` options; code loads on view (`DemoLoader`, `React.lazy`); `demo_interact {step}` queued on `dataLayer` via `src/lib/analytics.ts` (GA4 in Phase 5). Sample pros, labelled as sample data. e2e pass 2026-10-29. Pending: owner visual check |
| T-3.08 | Screens gallery | FR-HOME-10 | 🔄 2026-10-29: code done. Coverflow of the 8 captured screens in the page language, light/dark toggle (`aria-pressed`), drag/swipe (pointer events), arrow keys/Home/End, prev/next; only slides within 2 load images; caption is an `aria-live` region; never auto-advances. Hidden while < 3 screens have both themes. Server-rendered island, not lazy (small; measured by T-3.16). e2e pass 2026-10-29. Pending: owner visual check |
| T-3.09 | Testimonials | FR-HOME-11 | ✅ 4 real reviews (verbatim EN, FR translated, R-08 review), scroll-snap + prev/next, no auto-advance; rating hidden (Q-6) |
| T-3.10 | Audiences cards | FR-HOME-12 | ✅ |
| T-3.11 | Earn tabs | FR-HOME-13 | ✅ ARIA tabs + step strip; per-tab photos with Phase 1 content |
| T-3.12 | FAQ teaser | FR-HOME-14 | ✅ 8 Q&As from PLAN facts, native `<details>`, FAQPage JSON-LD; "cancellations" replaced by "not satisfied?" until a policy exists (Q-11). `faq_open` event in Phase 5 |
| T-3.13 | Download band | FR-HOME-15 | ✅ light + dark phones, QR on desktop; says "Android and the web" until an App Store URL exists (Q-3) |
| T-3.14 | Latest posts | FR-HOME-16 | 🔄 2026-10-29: code done. 3 newest published posts (`getLatestPosts`, `fallbackLocale: en` per ADR-019), cover, date, excerpt, card link to `/blog/[slug]` (page is Phase 4), heading from `home.blog`. Hidden with no posts. e2e pass 2026-10-29. Pending: owner visual check |
| T-3.15 | Footer + WhatsApp FAB | FR-GLB-02/03 | ✅ contact from the `site` global (T-1.17); FAB shows after the first screen; `whatsapp_click` event in Phase 5 |
| T-3.16 | Home perf budget check (JS < 170 KB) | NFR-PERF-02 | ✅ 2026-10-29: `tests/e2e/budget.e2e.spec.ts` gzips every script the home loads (390 px, no scroll) and fails above 170 KB; runs in CI (`next start`) or with `E2E_BUDGET=1`. ✅ 2026-10-29: passes against the local production build |

## 6. Phase 4 — Inner pages

| ID | Task | Req | Status |
|---|---|---|---|
| T-4.01 | Services index + detail ×11 | FR-PG-01/02 | ⬜ |
| T-4.02 | Businesses, Buildings, Shop, Food | FR-PG-03..05 | ⬜ |
| T-4.03 | Become a pro + application form | FR-PG-06 | ⬜ |
| T-4.04 | Our work + case study | FR-PG-07 | ⬜ |
| T-4.05 | Reviews, About, FAQ, Legal | FR-PG-08/09/12/15 | ⬜ |
| T-4.06 | Careers + apply (CV upload) | FR-PG-10 | ⬜ |
| T-4.07 | Blog index + article | FR-PG-11 | ⬜ |
| T-4.08 | Contact + forms | FR-PG-13 | ⬜ |
| T-4.09 | Form intake API (zod, honeypot, rate limit, store, email) | FR-FORM-* | ⬜ |
| T-4.10 | `/download` route | FR-PG-14 | ⬜ |

## 7. Phase 5 — SEO & analytics

| ID | Task | Req | Status |
|---|---|---|---|
| T-5.01 | `lib/seo.ts`, metadata on all templates, hreflang | FR-SEO-01 | ⬜ |
| T-5.02 | sitemap.ts, robots.ts | FR-SEO-02 | ⬜ |
| T-5.03 | JSON-LD components | FR-SEO-03 | ⬜ |
| T-5.04 | Dynamic OG images | FR-SEO-04 | ⬜ |
| T-5.05 | Legacy 301 map + redirect test | FR-SEO-05 | ⬜ |
| T-5.06 | Consent banner + GA4 + typed events | FR-ANA-01/02 | ⬜ |
| T-5.07 | UTM pass-through to stores | FR-ANA-03 | ⬜ |

## 8. Phase 6 — QA & launch

| ID | Task | Req | Status |
|---|---|---|---|
| T-6.01 | Full manual device matrix | quality-assurance §9 | ⬜ |
| T-6.02 | Lighthouse CI + axe in CI | QA-AUTO-06/07 | ⬜ |
| T-6.03 | FR native review + content freeze | FR-I18N-04 | ⬜ |
| T-6.04 | Security review + `npm audit` | NFR-SEC-* | ⬜ (2026-10-24: critical Next + high sharp advisories fixed (ADR-016). Open: 3 high / 5 moderate inside Payload (lexical→happy-dom, drizzle-kit→esbuild-kit); re-check on each Payload release) |
| T-6.05 | Go-live checklist + DNS cut-over | quality-assurance §7 | ⬜ |
| T-6.06 | Post-launch monitoring T+1h/24h/7d | operations §6 | ⬜ |

## 9. Risks

| ID | Risk | L | I | Mitigation | Owner |
|---|---|---|---|---|---|
| R-01 | Hostinger build OOM (Next + Payload) | M | H | Heap cap 3 GB; fallback build in GitHub Actions | Tech lead |
| R-02 | First deploy without migrations → empty DB | H | H | T-0.13 before T-0.17 | Tech lead |
| R-03 | Neon free tier cold starts slow first render | M | M | Pre-render everything; edge cache | Tech lead |
| R-04 | Moving DNS to Cloudflare breaks `app.handymandoit.com` or email | L | H | Record-by-record comparison (DEPLOY.md); `app` grey cloud | Owner + tech lead |
| R-05 | Hero video hurts LCP on 3G | M | H | Light-data mode, H1 as LCP, poster < 120 KB | Frontend |
| R-06 | Late assets (App Store URL, footage, prices) | H | L | CMS-switchable placeholders | Owner |
| R-07 | Cloudflare serves stale HTML after CMS edit | M | M | Short `s-maxage` + SWR; optional purge from hook | Tech lead |
| R-08 | French copy quality | M | M | Native-speaker review gate (T-6.03) | Owner |
| R-09 | Loss of legacy SEO | M | H | Complete 301 map + automated test + Search Console watch | SEO |
| R-10 | Form spam | M | L | Honeypot + timing + rate limit; Turnstile fallback (ADR-012) | Backend |

## 10. Open questions / decisions needed from owner

| # | Question | Needed by | Default if no answer |
|---|---|---|---|
| Q-1 | ~~Final sign-off of PLAN.md v1.1~~ | — | ✅ Approved by owner 2026-10-23 |
| Q-2 | SMTP provider (Hostinger mail vs Resend) | Phase 4 | Hostinger SMTP |
| Q-3 | App Store URL | Launch | iOS badge hidden |
| Q-4 | Real job footage | Phase 2 | 2026-10-29: owner chose old-site photos for now; hero uses a still (T-1.10). 2026-10-28: Mixkit (free commercial licence) has carpentry and building clips but none with Cameroonian or West African craftspeople, and Pexels blocks scripted search, so no clip was picked. Owner: send own footage, or pick a licensed clip (Pexels/Mixkit link); then `npm run encode:hero -- <clip> --upload` |
| Q-5 | "From" prices per service (FCFA) | Phase 3 | "Clear price before you book" |
| Q-6 | Play Store rating & download count | Phase 3 | Rating row hidden |
| Q-7 | Vector logo | Phase 2 | Traced SVG |
| Q-8 | Native French reviewer | Phase 6 | — |
| Q-9 | Error monitoring: Sentry? (ADR-011) | Phase 6 | Logs only |
| Q-10 | Names of 4 partner logos (lion, green frames, orange mountain, leaf) from the old site | Phase 6 | ✅ Resolved 2026-10-28 from the live site: Spectron Limited LLC (lion), Web Spectron (green frames), Luxecam Tours Ltd (orange mountain), Kenta Beauty Clinic (leaf); logos replaced with the live 300 px originals |
| Q-11 | Cancellation policy (for the FAQ) | Phase 4 | Not stated; FAQ covers "not satisfied?" with facts only |
| Q-12 | Higher-resolution project photos (old site has 500–750 px) | Phase 6 | Use the old-site files |
| Q-13 | Services ↔ faqs/projects: child-side relationships + `join` fields on services instead of two-way relationships (ADR-017) | Phase 1, branch 3 | ✅ Approved by owner 2026-10-27: join fields |
| Q-14 | Submissions 24-month retention without cron (NFR-PRIV-01): purge on each new submission, manual admin purge, or both | Phase 1, branch 6 | ✅ Approved by owner 2026-10-27: both. Done: purge after each new submission; admins bulk-delete from the list; attachments are deleted with their submission |
| Q-15 | Rename `appScreens.locale` to `lang` (avoids confusion with Payload's `locale` argument) | Phase 1, branch 7 | ✅ Approved by owner 2026-10-27: rename. Done (collection slug `app-screens`) |
| Q-16 | Roles (FR + EN) and photos for J. Batholomew, Mbeng Nkeng S., ANU Ernest | Phase 4 (About) | Seeded as "Équipe HandyMan / HandyMan team"; edit in /admin, re-runs keep the edit |
| Q-17 | Hostinger build command becomes `npm run migrate && npm run build`: pre-rendering now reads Payload, so the schema must be migrated before the build (fresh Neon DB or schema change would fail the build otherwise) | Before T-0.17 (first deploy) | Proposed 2026-10-28; DEPLOY.md and operations.md updated, owner to confirm |

## 11. Change log

| Date | Change | By |
|---|---|---|
| 2026-10-23 | Phase 0 scaffold: Next 16 + Payload 3, i18n, tokens, Users/Media/Site, CI, DEPLOY.md | Dev |
| 2026-10-23 | Added CLAUDE.md, prompt.md and docs (requirements, architecture, data-model, design-system, quality-assurance, operations, project-tracker) | Dev |
| 2026-10-23 | Initial migration; npm tooling alignment; flat ESLint config (eslint-config-next 16); roles hidden on first-user form; build + smoke test verified; GitHub remote added | Dev |
| 2026-10-23 | Phase 0 hardening: localized 404/error (T-0.19), security headers (T-0.20), project int/e2e tests + CI migrate/int/e2e (T-0.21, T-0.22), Media explicit access, logo `Link`, local `.env` back on Docker, Cloudflare HTML cache rule documented (DEPLOY.md) | Dev |
| 2026-10-24 | Deployment (T-0.15, T-0.17) deferred until the design is done; work continues on GitHub only | Owner |
| 2026-10-24 | Security upgrade Next 16.4.2 + sharp 0.35.5 (ADR-016); Vitest hook timeout 60 s | Dev |
| 2026-10-24 | Phase 2 built: header (mega-menu, mobile menu), smart Get the app + QR, store/payment badges, synced-story hero with phone + lifecycle notifications, light-data mode, film lightbox; deps lucide-react 1.52.0, qrcode 1.5.4 | Dev |
| 2026-10-24 | Phase 2 accepted (owner started Phase 3); hero merged to main | Owner |
| 2026-10-27 | Phase 3 batch 1: pillars, numbers + map, how it works, audiences, earn tabs, download band, footer, WhatsApp button | Dev |
| 2026-10-27 | Phase 3 batch 2: trusted-by marquee, services bento with real project photos, testimonials, FAQ + JSON-LD; open questions Q-10..Q-12 | Dev |
| 2026-10-27 | Phase 1 CMS build plan: helpers, branch/migration order, migration rules (data-model §8, ADR-017 proposed); Q-13..Q-15; T-1.15 | Dev |
| 2026-10-27 | Phase 1 branch 0: `src/access`, slug + order fields, tag-based revalidate hooks, `lib/payload.ts`; no schema change | Dev |
| 2026-10-27 | Phase 1 branch 1: `team` + `partners` collections and migration; `npm run migrate:check` (drift + empty-DB apply), drift check in CI | Dev |
| 2026-10-27 | Phase 1 branch 2: `services` collection (drafts, localized slug unique per locale, built-in `key`, icon, SEO tab) + migration; `src/lib/service-keys.ts` shared by site and CMS | Dev |
| 2026-10-27 | Phase 1 branch 3: `projects` (drafts, SEO, before/after) + `testimonials` + migration; `services` lists both via `join` fields (ADR-017); public joins verified to hide draft projects | Dev |
| 2026-10-27 | Phase 1 branch 4: `faqs` collection (category, optional service, showOnHome) + migration; `services.faqs` join; int-test global setup boots Payload once (fixes a dev schema-push race between parallel test files) | Dev |
| 2026-10-27 | Phase 1 branch 5: `posts` (drafts, SEO, auto publishedAt, unique legacyUrl, shared slug) + `categories` + migration | Dev |
| 2026-10-27 | Phase 1 branch 6: `jobs`, `submissions` (read-only except status, email to site inbox, 24-month purge), private `files` (PDF/DOC ≤ 5 MB, random names, separate `S3_PRIVATE_BUCKET`) + migration | Dev |
| 2026-10-27 | Phase 1 branch 7: `app-screens` collection (key × lang × theme unique) + migration | Dev |
| 2026-10-27 | Phase 1 branch 8: `navigation` (header with mega-menu children, footer columns; shared `linkField`: site page / document / external) and `seo` (defaults + Organization JSON-LD) globals + migration | Dev |
| 2026-10-27 | Phase 1 branch 9: `home` global (one tab per section, drafts, hero video/film/cues; empty fields fall back to messages copy until T-1.15) + migration | Dev |
| 2026-10-27 | Phase 1 branch 10: redirects plugin (`redirects` collection) + migration. CMS model for Phase 1 complete: 15 collections, 4 globals, 11 migrations | Dev |
| 2026-10-28 | T-1.15: home sections read Payload (`src/lib/home.ts`, `CmsImage`, icon map); CI seeds before build; T-1.17 proposed (header/footer globals); Q-17 (migrate before build on Hostinger) | Dev |
| 2026-10-28 | T-1.07 seed script (`npm run seed`, FR-CMS-07); owner decisions: skip existing by default, FAQs matched on FR question, new cancellation FAQ. Q-16 (team roles), T-1.16 (int tests overwrite dev globals). Q-10 resolved: 4 partner names and all 8 logos (300 px) from the live site; cancellation FAQ from the owner policy | Dev |
| 2026-10-28 | T-1.16: separate int-test database, longer hook timeout, slow-marked admin smoke check; seed matches renamed media by dimensions | Dev |
| 2026-10-28 | T-1.08 WordPress import, T-1.09 app screen capture, T-1.10 hero video pipeline (3 sizes, ADR-018; footage open, Q-4), T-1.11 FR/EN copy pass; ADR-019 (English-only posts) | Dev |
| 2026-10-29 | Fix: root `/favicon.ico` and other root-level files (`/robots.txt`, `/apple-touch-icon.png`) crashed with a 500 (static-to-dynamic error in the `[locale]` route). `/favicon.ico` now rewrites to `/icons/favicon.ico`; the locale layout sets `dynamicParams = false` (unknown locale = plain 404), `[...rest]` stays dynamic. Verified: typecheck, lint, build, `test:smoke` 8/8 | Dev |
| 2026-10-29 | Hero LCP image: honest srcset widths, `phone` media size (560 px), preload + media preconnect, backdrop photo after load, film poster on open; `pro` app screen captured (owner consent) | Dev |
| 2026-10-29 | Hero still photo from the old site (poster, slow zoom), real app screens in the hero and download-band phones; guest mode checked for logged-in screens (none reachable) | Dev |
| 2026-10-29 | T-1.12 access matrix tests (2 fixes: `users.unlock` admin-only, `home` drafts private); T-1.17 header/footer/store links/WhatsApp from the `navigation` and `site` globals | Dev |
| 2026-10-29 | T-3.05 scroll story (CSS sticky, ADR-021), T-3.07 mini-demo, T-3.08 screens gallery, T-3.14 latest posts, T-3.16 JS budget test; `findDocs` takes `fallbackLocale`; `track()` helper. Verified: typecheck, lint, messages int spec. Build/e2e pending (Docker down) | Dev |
| 2026-10-29 | Phase 3 batch verified: typecheck, lint, `migrate:check` (13 migrations), `test:int` 121/121, `build`, `test:e2e` 33/33 on the production build (2 test locators fixed: hero phone list scoped to the hero; mini-demo test scrolls to the section so the lazy demo loads) | Dev |
