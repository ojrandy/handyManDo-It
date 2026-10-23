# Project Tracker

Last updated: **2026-10-23** · Current phase: **Phase 0 — Foundations (in progress)** · Plan status: PLAN.md v1.1 **approved** (2026-10-23)

Status: ✅ done · 🔄 in progress · ⬜ to do · ⛔ blocked · ➖ dropped
Update this file in the same PR as the work. Every task lists the requirement IDs it satisfies.

---

## 1. Phase overview (PLAN.md §12)

| Phase | Goal | Sign-off gate | Status |
|---|---|---|---|
| 0. Foundations | Stack wired, i18n, tokens, CI, staging | Staging loads `/fr`, `/en`; `/admin` works | 🔄 |
| 1. Content & assets | Migrations/seeds, CMS model, screens, video, FR copy | All content visible in CMS | ⬜ |
| 2. Hero prototype | Header + synced-story hero + light-data mode | **Owner approves the look** | ⬜ |
| 3. Home page | Sections 5.3–5.17 | Home complete in both locales | ⬜ |
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
| T-0.08 | `Users` (roles, first-user admin), `Media` (sizes), `Site` global | FR-CMS-02 | ✅ | |
| T-0.09 | Placeholder home + LanguageSwitcher + skip link | FR-I18N-02, FR-GLB-05 | ✅ | |
| T-0.10 | PWA manifest, icons, OG default | FR-SEO-04 | ✅ | |
| T-0.11 | CI: typecheck, lint, build | QA-AUTO-01 | ✅ | Tests not in CI yet |
| T-0.12 | Align tooling on npm (Playwright `webServer.command`, `.vscode` `npm.packageManager`) | ADR-010 | ✅ | Both now npm |
| T-0.13 | **Initial DB migration** `src/migrations/` | NFR-MAINT-02 | ✅ | `20261023_172405_initial` created + applied locally (15 tables) |
| T-0.14 | First git commit + GitHub repo + branch protection | — | 🔄 | Remote `origin` = github.com/ojrandy/handyManDo-It (empty). Commit/push awaiting owner approval |
| T-0.15 | Neon project + `staging` branch | ADR-002, ADR-013 | 🔄 | Project exists in **us-east-1** (kept, owner decision 2026-10-23). Needs the pooled **Postgres connection string** (not the Data API URL), set as a Hostinger env var |
| T-0.16 | R2 bucket, token, CORS, r2.dev | ADR-003, ADR-014 | ⏸ deferred | Owner decision 2026-10-23: later. Until then media is stored on local disk. On Hostinger, uploads may be lost on redeploy, so don't upload final content to staging before R2 |
| T-0.23 | First-user form: hide `roles` from non-admins | FR-CMS-02 | ✅ | Field `access.create` admin-only; hook still makes first user admin |
| T-0.17 | Hostinger Node app + env vars + first deploy | NFR-HOST-01 | ⬜ | Needs hPanel access |
| T-0.18 | Cloudflare zone (copy DNS, keep `app` record intact) | — | ⬜ | Can wait until launch |
| T-0.19 | Localized `not-found.tsx` + `error.tsx` | FR-PG-16 | ⬜ | |
| T-0.20 | Security headers in `next.config.ts` | NFR-SEC-01 | ⬜ | |
| T-0.21 | Message parity test + int/e2e in CI | QA-AUTO-02..04 | ⬜ | |
| T-0.22 | Replace Payload template tests with project smoke tests | QA-AUTO-03 | ⬜ | |

**Verified 2026-10-23:**
- `tsc --noEmit` clean; `eslint .` 0 errors; `fr.json`/`en.json` key parity OK.
- `npm run build` passes (Next 16.3.3 Turbopack; `/fr`, `/en` SSG). Took about 8 min on the dev machine, so watch Hostinger build time and memory.
- `next start` smoke test:
  - `/` → 307 `/fr` (fr browser) or `/en` (en browser); `/fr`, `/en` 200 with correct `lang`, title and H1
  - hreflang `Link` header (fr, en, x-default)
  - `/admin` → create-first-user
- Screenshots checked: `/fr` at 1440 px, `/en` at 390 px.

## 3. Phase 1 — Content & assets

| ID | Task | Req | Status |
|---|---|---|---|
| T-1.01 | Collections: services, projects, testimonials, team, partners, faqs | FR-CMS-01 | ⬜ |
| T-1.02 | Collections: posts, categories, jobs, appScreens, submissions (+ private files) | FR-CMS-01 | ⬜ |
| T-1.03 | Globals: navigation, home (with hero cues), seo | FR-CMS-01 | ⬜ |
| T-1.04 | Revalidation hooks for all public content | FR-CMS-04 | ⬜ |
| T-1.05 | Drafts + live preview | FR-CMS-03, FR-CMS-05 | ⬜ |
| T-1.06 | SEO plugin + redirects plugin config | FR-SEO-01 | ⬜ |
| T-1.07 | `scripts/seed.ts` (idempotent) from old site | — | ⬜ |
| T-1.08 | `scripts/migrate-wordpress.ts` (20 posts + media, legacyUrl) | FR-PG-11 | ⬜ |
| T-1.09 | `scripts/capture-screens.ts` (fr/en × light/dark) | FR-HOME-10 | ⬜ |
| T-1.10 | Hero video: select stock, encode MP4/WebM ×3, poster AVIF < 120 KB, cue list | FR-HOME-01 | ⬜ |
| T-1.11 | French + English copy for all sections | FR-I18N-04 | ⬜ |
| T-1.12 | Access-control int tests | QA-AUTO-08 | ⬜ |

## 4. Phase 2 — Hero prototype

| ID | Task | Req | Status |
|---|---|---|---|
| T-2.01 | Header (transparent → frosted, mega-menu, mobile menu) | FR-GLB-01 | ⬜ |
| T-2.02 | Button, StoreBadges, GetTheApp (smart), PaymentBadges | FR-GLB-04/06 | ⬜ |
| T-2.03 | Hero: video + overlay + H1/CTAs + trust row | FR-HOME-01 | ⬜ |
| T-2.04 | Phone frame + cue-synced notifications | FR-HOME-01 | ⬜ |
| T-2.05 | Light-data / reduced-motion mode | FR-HOME-02 | ⬜ |
| T-2.06 | Brand film lightbox with captions | FR-HOME-01, NFR-A11Y-01 | ⬜ |
| T-2.07 | Lighthouse + device check of hero; owner approval | NFR-PERF-01 | ⬜ |

## 5. Phase 3 — Home page

| ID | Task | Req | Status |
|---|---|---|---|
| T-3.01 | Trusted-by marquee | FR-HOME-03 | ⬜ |
| T-3.02 | Services bento | FR-HOME-04 | ⬜ |
| T-3.03 | Pillars + trust features | FR-HOME-05 | ⬜ |
| T-3.04 | Numbers + map | FR-HOME-06 | ⬜ |
| T-3.05 | Scroll story (GSAP, lazy) + mobile swipe | FR-HOME-07 | ⬜ |
| T-3.06 | How it works | FR-HOME-08 | ⬜ |
| T-3.07 | Mini-demo | FR-HOME-09 | ⬜ |
| T-3.08 | Screens gallery | FR-HOME-10 | ⬜ |
| T-3.09 | Testimonials | FR-HOME-11 | ⬜ |
| T-3.10 | Audiences cards | FR-HOME-12 | ⬜ |
| T-3.11 | Earn tabs | FR-HOME-13 | ⬜ |
| T-3.12 | FAQ teaser | FR-HOME-14 | ⬜ |
| T-3.13 | Download band | FR-HOME-15 | ⬜ |
| T-3.14 | Latest posts | FR-HOME-16 | ⬜ |
| T-3.15 | Footer + WhatsApp FAB | FR-GLB-02/03 | ⬜ |
| T-3.16 | Home perf budget check (JS < 170 KB) | NFR-PERF-02 | ⬜ |

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
| T-6.04 | Security review + `npm audit` | NFR-SEC-* | ⬜ |
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
| Q-4 | Real job footage | Phase 2 | Licensed stock |
| Q-5 | "From" prices per service (FCFA) | Phase 3 | "Clear price before you book" |
| Q-6 | Play Store rating & download count | Phase 3 | Rating row hidden |
| Q-7 | Vector logo | Phase 2 | Traced SVG |
| Q-8 | Native French reviewer | Phase 6 | — |
| Q-9 | Error monitoring: Sentry? (ADR-011) | Phase 6 | Logs only |

## 11. Change log

| Date | Change | By |
|---|---|---|
| 2026-10-23 | Phase 0 scaffold: Next 16 + Payload 3, i18n, tokens, Users/Media/Site, CI, DEPLOY.md | Dev |
| 2026-10-23 | Added CLAUDE.md, prompt.md and docs (requirements, architecture, data-model, design-system, quality-assurance, operations, project-tracker) | Dev |
| 2026-10-23 | Initial migration; npm tooling alignment; flat ESLint config (eslint-config-next 16); roles hidden on first-user form; build + smoke test verified; GitHub remote added | Dev |
