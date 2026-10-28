# Quality Assurance & Quality Control

Version 1.0 · 2026-10-23 · Applies to every change, every phase. **QA** = building quality in (process, standards, reviews). **QC** = checking the output (tests, audits, gates).

---

## 1. Quality principles

1. **Shift left.** Acceptance criteria are written before code (from [requirements.md](requirements.md)).
2. **Evidence, not assertion.** A task is done when its checks were *run* and *passed*; paste the command output or screenshot in the PR.
3. **Both languages, every time.** A feature verified only in one locale is not verified.
4. **Mobile-first verification.** 390 px on a throttled connection is the primary test device.
5. **Defects are tracked.** Anything found and not fixed immediately goes into the tracker with severity.

## 2. Test pyramid

| Level | Tool | Location | What | Runs |
|---|---|---|---|---|
| Static | `tsc`, ESLint, Prettier | — | Types, lint rules, formatting | Pre-commit (manual), CI |
| Unit | Vitest (jsdom) | `tests/unit/**/*.spec.ts` ⬜ | Pure helpers: zod schemas, seo builders, device detection, cue timing, slug utils, analytics payloads | CI |
| Integration | Vitest + Payload Local API | `tests/int/**/*.int.spec.ts` | Collections, access control, hooks (revalidate, email), seeds idempotency | CI (needs Postgres) |
| E2E | Playwright | `tests/e2e/**/*.e2e.spec.ts` | Critical journeys in both locales, redirects, forms, admin smoke | CI (planned) + pre-release |
| Accessibility | `@axe-core/playwright` ⬜ | inside e2e | Zero serious/critical violations per template | CI |
| Performance | Lighthouse CI ⬜ | `.lighthouserc` | Budgets in NFR-PERF | CI on PR (staging URL) |
| Visual | Playwright screenshots (optional) | e2e | Hero, header, footer at 390/1280 | Pre-release |
| Manual exploratory | Real devices | — | Low-end Android, iPhone, desktop | Each phase gate |

Current state: `tests/int/api.int.spec.ts` and `tests/e2e/admin.e2e.spec.ts` are Payload template tests. CI runs typecheck, lint, build only. Playwright `webServer.command` uses `pnpm dev` → must become `npm run dev` (T-0.12).

## 3. Automated checks to add (backlog)

| ID | Check | Verifies |
|---|---|---|
| QA-AUTO-01 | Typecheck + lint + build in CI | NFR-MAINT-01 ✅ |
| QA-AUTO-02 | Int tests in CI (Postgres service already present) | FR-CMS-* ✅ |
| QA-AUTO-03 | E2E smoke in CI: `/` redirects, `/fr` & `/en` 200, switcher, 404 | FR-I18N-* ✅ |
| QA-AUTO-04 | Message parity test: `fr.json` and `en.json` have identical key trees, no empty values | FR-I18N-03 ✅ |
| QA-AUTO-05 | Redirect table test: each legacy URL → 301 → expected target | FR-SEO-05 |
| QA-AUTO-06 | axe scan of each template in both locales | NFR-A11Y-01 |
| QA-AUTO-07 | Lighthouse CI with budgets | NFR-PERF-* |
| QA-AUTO-08 | Access-control tests: anonymous can't write; editor can't manage users/site | NFR-SEC-02, FR-CMS-02 |
| QA-AUTO-09 | Form handler tests: validation, honeypot, rate limit, stored + emailed | FR-FORM-* |
| QA-AUTO-10 | Metadata test: canonical, hreflang trio, title/description present per template | FR-SEO-01 |
| QA-AUTO-11 | `npm audit --omit=dev --audit-level=high` | NFR-SEC-04 |
| QA-AUTO-12 | Migration check: `payload migrate:status` clean against fresh DB | NFR-MAINT-02 ✅ (CI runs `npm run migrate` on an empty DB, then `npm run migrate:check -- --drift`; locally `npm run migrate:check`) |

## 4. Quality gates

### Gate A — Every commit/PR (QC)
- [ ] `npm run typecheck` ✔
- [ ] `npm run lint` ✔ (no new warnings)
- [ ] `npm run build` ✔
- [ ] Relevant tests added/updated and passing
- [ ] Schema changed? → types regenerated + migration committed
- [ ] UI changed? → checked `/fr` + `/en`, 390 px + 1280 px, keyboard, reduced motion
- [ ] Strings in both message files; no hardcoded copy
- [ ] Tracker updated; requirement IDs in PR description

### Gate B — Code review (QA)
Reviewer checks: correctness vs acceptance criteria · RSC/client boundary justified · access control on new data · no secrets/PII leaks · error and empty states · accessibility · performance impact (bundle, images) · naming/style matches surroundings · tests meaningful (would fail if the feature broke).

### Gate C — Phase sign-off (PLAN.md §12)
- [ ] All Must requirements of the phase have passing evidence
- [ ] Staging deployed from `main`, smoke-tested
- [ ] Open defects: 0 Critical, 0 High
- [ ] Demo to owner; written approval recorded in the tracker

### Gate D — Release / go-live (see §7 checklist)

## 5. Definition of Ready / Done

**Ready:** requirement ID linked · acceptance criteria clear · content/assets available or placeholder agreed · dependencies done · design reference exists for UI.

**Done:** code merged · Gate A + B passed · deployed to staging · verified in both locales on mobile + desktop · docs/tracker updated · no known regressions.

## 6. Defect management

| Severity | Definition | Example | Response |
|---|---|---|---|
| **S1 Critical** | Site down, data loss, security hole, legal exposure | `/admin` open, forms leak PII, prod 500 | Fix immediately; hotfix; incident note |
| **S2 High** | Core journey broken, no workaround | Store button dead on Android; FR pages 404 | Fix before next release; blocks phase gate |
| **S3 Medium** | Feature degraded, workaround exists | Carousel no swipe on iOS | Schedule in current phase |
| **S4 Low** | Cosmetic, copy | Misaligned icon, typo | Batch |

Bug report template: *Title · Env/URL · Locale · Device/browser/viewport · Steps · Expected · Actual · Evidence (screenshot/log) · Severity · Requirement ID.*

## 7. Release / go-live checklist

**Content**
- [ ] All pages populated in FR and EN; native-speaker FR review signed off
- [ ] No placeholder/lorem text; all images have alt in both locales
- [ ] Legal pages reviewed; contact data correct in `site` global

**Functional**
- [ ] Every page in PLAN.md §4 returns 200 in both locales; unknown slug → 404
- [ ] Forms submit, store, email, and show success in both locales
- [ ] Store/QR/web-app/WhatsApp/call links correct on Android, iPhone, desktop
- [ ] Language switcher on every template keeps the equivalent page

**SEO**
- [ ] 100 % of legacy redirects pass (QA-AUTO-05) — on the production domain
- [ ] Sitemap, robots, canonical, hreflang verified; `/admin` noindex
- [ ] Rich Results Test passes for each JSON-LD type
- [ ] Search Console: sitemap submitted, change of address not needed (same domain)

**Performance & accessibility**
- [ ] Lighthouse budgets met on home + each template (mobile)
- [ ] axe: 0 serious/critical; manual keyboard + screen reader (TalkBack, VoiceOver) pass
- [ ] Low-end Android test on real device

**Security & ops**
- [ ] Real admin created; template/test users removed; strong passwords
- [ ] Security headers present; HTTPS Full (strict); HSTS
- [ ] Env vars set in Hostinger; `PAYLOAD_SECRET` unique to prod
- [ ] Migrations applied; Neon backup/branch taken right before launch
- [ ] R2 custom domain live, r2.dev disabled; CORS correct
- [ ] Analytics: consent banner works; events in DebugView
- [ ] Rollback plan rehearsed (operations.md §5)

**Post-launch (T+1h, T+24h, T+7d)**
- [ ] Error logs clean · Search Console coverage · 404 report → add missing redirects · CWV field data · form submissions arriving

## 8. Test data and accounts

- Test admin for e2e: created/destroyed by `tests/helpers/seedUser.ts` (`e2e-admin@handymandoit.test`). **Never** run against staging/prod DBs; the helper refuses any `DATABASE_URL` host other than localhost.
- Deployed-site smoke: `E2E_BASE_URL=https://<env> npm run test:smoke` runs `tests/e2e/site.e2e.spec.ts` only (no DB access), used for the Phase 0 staging gate and after every deploy.
- Vitest runs in the `node` environment (int tests use the Payload Local API). Component tests opt in to jsdom per file with `// @vitest-environment jsdom`.
- Int tests use their own database, `DATABASE_URL`'s name + `_test` (`handymandoit_test`), or `TEST_DATABASE_URL` if set (`tests/int/testDatabase.ts`). The global setup creates it on the same server when missing and Payload's dev schema push builds the tables, so tests never overwrite seeded dev content. Drop it (`docker compose exec postgres psql -U postgres -c "drop database handymandoit_test"`) to start from empty.
- Seeds (`scripts/seed.ts`) are idempotent and the canonical demo content.
- Never use real customer data in tests.

## 9. Manual test matrix (phase gates)

| Device | Browser | Viewport | Network |
|---|---|---|---|
| Low-end Android (e.g. Tecno/Itel, Android 9–11) | Chrome | 360×740 | Fast 3G / Save-Data on |
| Mid Android | Chrome, Samsung Internet | 390×844 | 4G |
| iPhone (iOS 16+) | Safari | 390×844 | 4G |
| Desktop | Chrome, Firefox, Safari | 1280×800, 1920×1080 | Wi-Fi |

Each in **FR and EN**, with and without reduced motion on at least one device.
