# Prompt Library — HandyMan Do IT Website

The prompts that take this project from kickoff to production and keep it healthy afterwards. Each one is written to be pasted into Claude Code (or any capable coding agent) running in this repository.

**How it's organised**

| Part | Contents |
|---|---|
| [0. How to use this library](#0-how-to-use-this-library) | Prompt anatomy, variables, the golden rules |
| [1. Standard blocks](#1-standard-blocks) | Reusable context, output contract, QA footer: appended to every prompt |
| [2. Session prompts](#2-session-prompts) | Start, resume, hand over, end a session |
| [3. Phase prompts](#3-phase-prompts) | Phase −1 (discovery) through Phase 7 (post-launch) |
| [4. Build recipes](#4-build-recipes) | Repeatable prompts for a page, section, component, collection, form, etc. |
| [5. QA/QC prompts](#5-qaqc-prompts) | Reviews, audits, test writing, gate checks |
| [6. Utility & troubleshooting prompts](#6-utility--troubleshooting-prompts) | Fixing every common class of problem |
| [7. Documentation & communication](#7-documentation--communication) | Docs, commits, PRs, status reports |

---

## 0. How to use this library

### 0.1 Anatomy of every prompt

Every prompt here follows the same structure, because it is what reliably gets senior-quality output:

1. **Role**: who the agent is for this task.
2. **Context**: which files and docs to read first (the agent should *read*, not guess).
3. **Task**: one clear objective, with requirement IDs.
4. **Constraints**: the rules that must not be broken.
5. **Process**: the steps, including a plan-before-code checkpoint for non-trivial work.
6. **Acceptance criteria**: how we know it's done.
7. **Verification**: the exact commands and manual checks to run.
8. **Output**: what to report back.

### 0.2 Variables

Replace `{{LIKE_THIS}}` before sending. Common ones:

| Variable | Example |
|---|---|
| `{{REQ_IDS}}` | `FR-HOME-01, FR-HOME-02` |
| `{{TASK_ID}}` | `T-2.03` |
| `{{FILES}}` | `src/components/sections/Hero.tsx` |
| `{{ERROR}}` | the full error text + stack trace |
| `{{URL}}` | `http://localhost:3000/fr/services/demenagement` |

### 0.3 Golden rules

1. **One objective per prompt.** Large features are split into tracker tasks; one prompt per task.
2. **Always attach the standard blocks** (§1.1 context + §1.2 output contract). Phase and recipe prompts say `[+STD]` where they belong.
3. **Plan, then build.** For anything beyond a one-file change, ask for the plan first and approve it before code is written (the prompts include a `STOP` checkpoint).
4. **Evidence over claims.** Never accept "done" without the verification output.
5. **Both locales, mobile first.** Every UI prompt verifies `/fr` and `/en` at 390 px.
6. **Update the tracker.** Every build prompt ends by updating `docs/project-tracker.md`.
7. **Paste real errors.** For debugging, paste the whole error, the command, and what changed. No paraphrasing.
8. **New session = fresh context.** Start each session with §2.1.

---

## 1. Standard blocks

### 1.1 `[STD-CONTEXT]`: project context block

> Paste at the top of any prompt when starting cold, or rely on CLAUDE.md being auto-loaded.

```text
You are a senior software engineer and systems analyst (10+ years) working on the
HandyMan Do IT website: a bilingual (FR default, EN) Next.js 16 + Payload CMS 3
marketing site that sells the HandyMan Do IT app in Cameroon. Hosting: Hostinger
Node.js behind Cloudflare; DB: Neon Postgres; media: Cloudflare R2.

Before acting, read: CLAUDE.md, docs/project-tracker.md, and the docs relevant to
this task (requirements.md, architecture.md, data-model.md, design-system.md,
quality-assurance.md, operations.md). Follow CLAUDE.md §6 rules without exception.
Do not invent facts about the code: open the files. If something is ambiguous,
state your assumption explicitly, or ask if it changes the outcome.
```

### 1.2 `[STD-OUTPUT]`: output contract

```text
When you finish, report in this format:
1. Summary: what changed and why (2–4 sentences).
2. Files changed: path, one line each.
3. Verification: each command you ran and its result (pass/fail, key output).
   Manual checks done (locales, viewports, keyboard, reduced motion).
4. Not done / not verified: be explicit. Nothing hidden.
5. Risks & follow-ups: anything the reviewer must know; new tracker items.
6. Tracker: the rows you updated in docs/project-tracker.md.
```

### 1.3 `[STD-QA]`: quality gate footer

```text
Definition of Done for this task (docs/quality-assurance.md §4–5):
- npm run typecheck, npm run lint pass; npm run build passes if config/routes/schema changed.
- Tests added or updated for the behaviour; they would fail if the feature broke.
- If schema changed: npm run generate:types + npm run migrate:create, migration committed.
- UI: verified at /fr and /en, 390px and 1280px, keyboard only, prefers-reduced-motion.
- All strings exist in both src/messages/fr.json and en.json (or in localized CMS fields).
- No hardcoded copy, no secrets, no `any` without justification, no console noise.
- Accessibility per docs/design-system.md §8; performance budgets per NFR-PERF.
```

### 1.4 `[STD-PLAN-GATE]`: plan checkpoint

```text
Before writing any code, produce a plan and STOP for my approval:
- Restated goal and acceptance criteria (with requirement IDs).
- Files to create/modify, and why each.
- Data flow (where data comes from; server vs client components).
- Edge cases & failure modes (empty CMS data, missing locale, slow network, no JS).
- Test plan (unit/int/e2e + manual).
- Risks, and any decision that needs my input.
Keep it to one screen.
```

---

## 2. Session prompts

### 2.1 Start of session (cold start)

```text
[STD-CONTEXT]

Start-of-session briefing. Do not change any files yet.
1. Read CLAUDE.md and docs/project-tracker.md.
2. Run: git status, git log --oneline -10, npm run typecheck.
3. Tell me: current phase, what was last completed, what is in progress,
   blockers/open questions, and the 3 highest-value next tasks with their IDs.
4. Flag anything in the repo that contradicts the docs.
```

### 2.2 Resume a task

```text
[STD-CONTEXT]

We are resuming {{TASK_ID}} ({{REQ_IDS}}). Read the tracker row, the related docs,
and the files already touched (git diff main...HEAD). Summarise where it stands,
what remains against the acceptance criteria, then continue. [STD-QA] [STD-OUTPUT]
```

### 2.3 End of session / handover

```text
We're ending this session. Without starting new work:
1. Make sure the working tree is in a coherent state (no half-applied edits);
   list anything uncommitted.
2. Update docs/project-tracker.md: statuses, notes, new risks/questions, change log.
3. Write a handover note (≤ 15 lines): done, in progress (exact next step),
   blocked (on what/whom), gotchas discovered. Put it under the change log entry.
```

### 2.4 Context recovery (agent seems lost or contradicts itself)

```text
Stop. Re-ground yourself: re-read CLAUDE.md, the tracker row for {{TASK_ID}}, and
the current contents of {{FILES}} (open them; don't rely on memory). Then list:
(a) the goal, (b) what the code does right now, (c) the gap, (d) your next single
step. Don't edit until I confirm.
```

---

## 3. Phase prompts

Each phase has: **Kickoff** → **Task prompts** → **Phase QA** → **Gate review**.

### Phase −1: Discovery & requirements validation (before building)

**−1.1 Requirements analysis**

```text
[STD-CONTEXT]
Role: senior systems analyst.

Analyse docs/PLAN.md and docs/requirements.md as a reviewer before build starts.
Produce:
1. Gaps: behaviours implied but not specified (empty states, errors, offline,
   no-JS, missing translations, editor permissions, data retention).
2. Ambiguities: requirements that two engineers would implement differently.
   Propose a precise wording for each.
3. Conflicts: between PLAN.md, requirements.md, and the hosting constraints
   (Hostinger: no workers/WebSockets, 120 s cap; Payload: no MySQL).
4. Testability: any requirement without measurable acceptance criteria.
5. Risks not in docs/project-tracker.md §9.
6. Questions for the owner, ranked by how much they block.
Do not edit files. Output a table per section.
```

**−1.2 Apply the analysis**

```text
Apply the accepted items from the analysis to docs/requirements.md (keep IDs
stable; add new IDs at the end of each table), add risks/questions to
docs/project-tracker.md, and log changes in its change log. Show me the diff summary.
```

**−1.3 Estimation & sequencing**

```text
Role: tech lead. Using docs/project-tracker.md, estimate each task in ideal days
(S ≤ 0.5, M ≤ 2, L ≤ 5; split anything bigger), mark dependencies, identify the
critical path to launch and what can run in parallel. Output a table and a short
critical-path narrative. Do not invent tasks not traceable to requirements;
propose them separately.
```

---

### Phase 0: Foundations

**0.0 Kickoff**

```text
[STD-CONTEXT]
Phase 0: Foundations. Gate: staging URL loads /fr and /en, and /admin works.

Audit the current scaffold against docs/architecture.md and the Phase 0 tasks in
docs/project-tracker.md. For each T-0.xx: verify the claimed status by reading
code / running commands. Report: confirmed ✅, wrong status, and the ordered list
of remaining tasks with the blocker chain (e.g. migrations before deploy).
No edits.
```

**0.1 Tooling alignment (T-0.12)**

```text
[STD-CONTEXT]
Task T-0.12: the project uses npm (package-lock.json). Playwright webServer uses
`pnpm dev` and .vscode/settings.json sets npm.packageManager to pnpm.
Fix both to npm. Also set Playwright `use.baseURL` to http://localhost:3000 and
update tests to use relative URLs. Run npm run typecheck && npm run lint.
[STD-OUTPUT]
```

**0.2 Initial migration (T-0.13)**

```text
[STD-CONTEXT]
Task T-0.13 (blocks first deploy). Create the initial Payload migration:
1. Confirm docker Postgres is up. Create a fresh empty DB (e.g. handymandoit_migrate)
   so the migration contains the full schema, not a diff.
2. Run npm run migrate:create -- --name initial against it.
3. Inspect the generated SQL: users, media, site global, locales tables present.
4. Verify: drop & recreate the DB, run npm run migrate, start the app, create the
   first user at /admin, confirm it becomes admin.
5. Document the procedure in docs/data-model.md §6 if anything differed.
Report the exact commands and outputs. [STD-OUTPUT]
```

**0.3 Error pages & security headers (T-0.19, T-0.20)**

```text
[STD-CONTEXT] [STD-PLAN-GATE]
Tasks T-0.19 and T-0.20 (FR-PG-16, NFR-SEC-01).
- Localized not-found.tsx and error.tsx under src/app/(site)/[locale]/ using
  next-intl messages (add keys to both fr.json and en.json). Brand styling,
  link home, correct 404 status for unknown routes/slugs.
- Security headers via next.config.ts headers(): HSTS, X-Content-Type-Options,
  Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy (camera,
  mic, geolocation off), frame-ancestors 'none' on the site (NOT breaking
  /admin live preview), and a CSP that allows self, R2 media origin
  (MEDIA_PUBLIC_URL), Google Fonts are self-hosted by next/font (so none), and
  GA4 (prepare but keep consent in mind). Explain each directive in one comment line.
Verify with curl -I on /fr, /en/does-not-exist, /admin. [STD-QA] [STD-OUTPUT]
```

**0.4 CI tests & parity (T-0.21, T-0.22)**

```text
[STD-CONTEXT]
Tasks T-0.21 and T-0.22 (QA-AUTO-02..04).
1. Replace Payload template tests with project tests:
   - tests/unit/messages.spec.ts: fr.json and en.json have identical key trees
     and no empty strings.
   - tests/int/access.int.spec.ts: anonymous cannot create users or update `site`;
     `site` is publicly readable.
   - tests/e2e/smoke.e2e.spec.ts: `/` with Accept-Language fr → /fr, en → /en;
     /fr and /en return 200 with correct <html lang>; language switch keeps the page;
     unknown route → 404; /admin/login renders.
2. Update vitest include patterns for tests/unit and tests/int.
3. Add to .github/workflows/ci.yml: unit + int tests (Postgres service exists),
   then Playwright (install chromium, build, start, run smoke). Keep job order:
   typecheck → lint → unit/int → build → e2e. Cache Playwright browsers.
Run everything locally and show the output. [STD-QA] [STD-OUTPUT]
```

**0.5 Infrastructure setup guide (T-0.15..T-0.18)**

```text
Role: DevOps engineer. I'm about to set up Neon, R2 and Hostinger by hand using
docs/DEPLOY.md. Walk me through it one step at a time, waiting for my
confirmation after each. At each step tell me exactly which value to copy and
which env var it maps to (docs/operations.md §2). Never ask me to paste secrets
into this chat; tell me where to put them instead. Finish with the §4.1 smoke test
from docs/operations.md against the staging URL.
```

**0.6 First deploy troubleshooting**: see §6.6.

**0.G Phase 0 gate review**

```text
[STD-CONTEXT]
Run the Phase 0 gate (docs/quality-assurance.md Gate C):
- Verify each Must task in Phase 0 has evidence (commands, URLs).
- Run the staging smoke test (docs/operations.md §4.1) against {{STAGING_URL}};
  list each check pass/fail.
- Defects: list any S1/S2.
Verdict: PASS / FAIL with reasons. Update the tracker phase status only if PASS.
```

---

### Phase 1: Content model, content & assets

**1.0 Kickoff**

```text
[STD-CONTEXT]
Phase 1. Read docs/data-model.md fully. Propose the implementation order of
collections/globals (dependencies first: media → services → projects → …), shared
helpers to create first (access functions, slug field factory, revalidate hook
factory), and the migration strategy (one migration per PR). Plan only.
```

**1.1 Shared CMS building blocks**

```text
[STD-CONTEXT] [STD-PLAN-GATE]
Create shared Payload helpers before any new collection:
- src/fields/slug.ts: slug field factory (localized option, unique, auto from
  title on create via beforeValidate hook, kebab-case, accent-stripping for French:
  "Déménagement" → "demenagement").
- src/access/: isAdmin, isAdminOrEditor, isAuthenticated, publishedOrAuthenticated
  (move existing helpers from collections/Users.ts and keep exports working).
- src/hooks/revalidate.ts: factory taking a function (doc, locale) => paths[]
  and/or tags[], calling revalidatePath/revalidateTag for BOTH locales, safe
  when run outside Next (seed scripts): guard and log, never throw.
Unit-test the slug function and the path builder. [STD-QA] [STD-OUTPUT]
```

**1.2 Collection implementation (repeat per collection)**

```text
[STD-CONTEXT] [STD-PLAN-GATE]
Implement the `{{COLLECTION}}` collection exactly as specified in
docs/data-model.md §{{SECTION}} (task {{TASK_ID}}).
Rules: localized human text; explicit access; admin group/useAsTitle/defaultColumns;
drafts if public content; SEO plugin fields if page-like; revalidation hook mapping
to the routes in src/i18n/routing.ts; field-level descriptions for editors in plain
language. Register in payload.config.ts.
Then: npm run generate:types, npm run migrate:create -- --name add-{{COLLECTION}},
int test for access rules + one create/read in both locales.
Update data-model.md status (⬜ → ✅) and any deviations. [STD-QA] [STD-OUTPUT]
```

**1.3 Globals (navigation, home, seo)**

```text
[STD-CONTEXT] [STD-PLAN-GATE]
Implement globals navigation, home and seo per docs/data-model.md §4.
`home` must model every section in PLAN.md §5 (one tab per section) and the hero
cue list (timeSeconds, localized text, icon) with validation: cues sorted
ascending, times within video length. `navigation` links reference either a
routing pathname key (select built from routing.pathnames) or an external URL.
Add revalidateTag hooks. Types + migration + tests. [STD-QA] [STD-OUTPUT]
```

**1.4 Seed script (T-1.07)**

```text
[STD-CONTEXT] [STD-PLAN-GATE]
Write scripts/seed.ts (run with `npx tsx scripts/seed.ts`; add `npm run seed`).
Source: old-site content listed in PLAN.md (§5, §6, §13) + src/lib/site.ts.
Seed services (11 slugs from PLAN.md §6, FR + EN titles/summaries), testimonials
(4), team (3), partners (8; logos as placeholders if missing), FAQs (≥ 8 with
showOnHome), site, navigation, home.
Requirements: idempotent (upsert by slug/key), both locales written explicitly
(create in fr, update in en), media uploaded once and reused, clear console
summary (created/updated/skipped), refuses to run when DATABASE_URL looks like
production unless --force. Run it twice and show that the 2nd run creates nothing.
[STD-QA] [STD-OUTPUT]
```

**1.5 WordPress migration (T-1.08)**

```text
[STD-CONTEXT] [STD-PLAN-GATE]
Write scripts/migrate-wordpress.ts to import the 20 posts from the old WordPress
REST API (base URL {{WP_URL}}/wp-json/wp/v2). For each post: title, slug (keep
identical for SEO), excerpt, content (HTML → Lexical via Payload's HTML converter;
list any unsupported blocks), featured image → media with alt, categories, publish
date, legacyUrl. Download images referenced in content, upload to media, rewrite
URLs. Idempotent by slug. Dry-run flag that prints what would happen.
Output a report: posts imported, images, warnings (broken images, shortcodes).
Language: posts are in {{WP_LANG}}; store in that locale, leave the other empty
and list them as needing translation.
```

**1.6 Screen capture (T-1.09)**

```text
[STD-CONTEXT] [STD-PLAN-GATE]
Write scripts/capture-screens.ts with Playwright: visit the public screens of
https://app.handymandoit.com (welcome/role picker, home, services, category, shop,
food, help) at 390×844, deviceScaleFactor 3, for locales fr/en and themes
light/dark (find how the app switches language/theme; inspect, don't guess).
Wait for network idle + fonts; hide cookie banners; save to ./captures/{key}-{locale}-{theme}.png,
then optionally upload to the appScreens collection (flag --upload), idempotent on
(key, locale, theme). Report any screen that couldn't be captured and why.
```

**1.7 Hero video pipeline (T-1.10)**

```text
Role: media engineer. Give me exact ffmpeg commands to turn {{SOURCE_VIDEO}} into:
MP4 H.264 (yuv420p, faststart, no audio) and WebM VP9 at 1920, 1280 and 720
widths, ~20 s seamless loop, target bitrates suitable for 4G; a poster frame as
AVIF < 120 KB and a WebP fallback. Then explain how to verify sizes, and write the
cue list (timeSeconds + FR/EN text) for the 5 notifications in PLAN.md §5.2 aligned
to the actual footage moments I describe: {{FOOTAGE_NOTES}}.
```

**1.8 Copywriting (T-1.11)**

```text
Role: bilingual (FR/EN) conversion copywriter for the Cameroonian market.
Write copy for {{SECTION_OR_PAGE}} using PLAN.md (app facts list at the top is the
only source of product claims; never invent features, prices or numbers).
Deliver EN and FR side by side; FR is natural Cameroonian French (not a literal
translation), "vous" form. Constraints: H1 ≤ 8 words, subhead ≤ 25 words, CTA ≤ 3
words, FR length ≤ EN + 25 %. Include SEO title (≤ 60 chars) and meta description
(≤ 155 chars) per language with local keywords. Flag any claim that needs owner
verification.
```

**1.QA Phase 1 QA**

```text
[STD-CONTEXT]
Phase 1 QA: (1) every collection/global in data-model.md exists and matches the
spec, list deviations; (2) access-control tests cover anonymous, editor, admin;
(3) fresh DB: npm run migrate then npm run seed then npm run seed again: clean;
(4) in /admin, every content item has FR and EN; list missing translations;
(5) every media item has alt in both locales. Output a pass/fail table.
```

---

### Phase 2: Hero prototype (owner approves the look)

**2.0 Kickoff**

```text
[STD-CONTEXT]
Phase 2: header + synced-story hero (PLAN.md §5.1–5.2, FR-GLB-01, FR-GLB-04,
FR-HOME-01, FR-HOME-02, NFR-PERF-01). Read design-system.md fully.
Propose the component tree with server/client split, what loads when (critical vs
deferred), how cue sync works (video timeupdate + requestVideoFrameCallback,
fallback timer), how light-data mode is decided (navigator.connection.saveData,
effectiveType, prefers-reduced-motion, viewport) without causing layout shift or
hydration mismatch, and how the LCP stays on the H1. Plan only.
```

**2.1 UI primitives (T-2.02)**

```text
[STD-CONTEXT] [STD-PLAN-GATE]
Build Button, StoreBadges, GetTheApp and PaymentBadges per design-system.md §6.
Button: polymorphic (internal Link from @/i18n/navigation vs external <a> with
rel="noopener"), variants/sizes, focus ring, disabled/loading. StoreBadges: hide
App Store when site.appStoreUrl empty; official badge artwork in both languages;
fire store_click {store, placement} through lib/analytics.ts (create a typed no-op
track() now; GA wiring is Phase 5). GetTheApp: server-detects platform via
headers where possible; desktop shows QR popover (accessible dialog/popover,
Esc closes). Unit tests for link selection logic. [STD-QA] [STD-OUTPUT]
```

**2.2 Header (T-2.01)**

```text
[STD-CONTEXT] [STD-PLAN-GATE]
Build the Header (FR-GLB-01) reading the `navigation` global. Transparent over the
hero, frosted dark after 24px scroll (IntersectionObserver sentinel, not scroll
listener). Services mega-menu: disclosure pattern, hover-intent on desktop,
keyboard (Enter/Space/Esc/arrow keys), closes on route change. Mobile: full-screen
dialog with focus trap, body scroll lock, large type, store buttons at bottom.
Includes LanguageSwitcher and GetTheApp. No CLS on scroll state change.
[STD-QA] [STD-OUTPUT]
```

**2.3 Hero (T-2.03..T-2.06)**

```text
[STD-CONTEXT] [STD-PLAN-GATE]
Build the synced-story hero from the `home` global: background video (MP4 + WebM,
muted, playsInline, loop, preload="none", poster), teal→night gradient + grain,
H1 with gold highlight, subhead, CTAs (Book a service → web app; Get the app),
"Watch the film" lightbox (brand-intro.mp4 then the film; captions track; focus
management), trust row (avatars, rating hidden if site.rating empty, MoMo/Orange).
Right: device/Phone with the real home screen from appScreens (locale+theme) and
notifications driven by cues (±250 ms). Light-data mode per FR-HOME-02: video not
requested at all; notifications cycle on a timer. Reduced motion: no autoplay,
static first notification. H1 must be LCP: server-rendered, no opacity animation on
first paint. Measure: Lighthouse mobile on /fr and /en; report LCP element, LCP,
CLS, JS size for the route. [STD-QA] [STD-OUTPUT]
```

**2.QA Hero review for owner**

```text
[STD-CONTEXT]
Prepare the Phase 2 approval pack: screenshots of the hero in /fr and /en at
390×844 and 1440×900 (light-data mode and full mode), a 20-second screen
recording description, Lighthouse scores, and a list of decisions the owner should
confirm (copy, footage, notification texts, colours). Write it as a short,
non-technical message I can send to the owner.
```

---

### Phase 3: Home page

**3.0 Kickoff**

```text
[STD-CONTEXT]
Phase 3: home sections PLAN.md §5.3–5.17 (T-3.01..T-3.16). Propose: build order,
which sections are server-only vs need client islands, which are lazy-loaded
(GSAP scroll story, coverflow, mini-demo) and how (next/dynamic + in-view
trigger), the JS budget allocation per island to stay < 170 KB gzip first load,
and shared primitives needed (Section, Eyebrow, Heading, Counter, Tabs, Accordion,
Marquee, Carousel). Plan only.
```

**3.1 Section build**: use recipe §4.2 for each section.

**3.2 Scroll story (T-3.05)**

```text
[STD-CONTEXT] [STD-PLAN-GATE]
Build the pinned scroll story (FR-HOME-07): 6 chapters (Browse → Clear price →
Pay safely → Track live → Close with code → Earn rewards), phone pinned, screen
crossfades per chapter, side progress rail, finale zooms out to laptop + phone.
GSAP + ScrollTrigger loaded only when the section approaches the viewport;
cleanup on unmount (ScrollTrigger.kill, no leaks across navigation). ≥ 768px and
motion allowed: pinned. < 768px or reduced motion: horizontal swipe (scroll-snap,
no GSAP). Content is server-rendered HTML first (readable with JS disabled).
Verify: no CLS, INP < 150 ms while scrolling on 4× CPU throttle, chapters
reachable by keyboard and screen reader. [STD-QA] [STD-OUTPUT]
```

**3.3 Mini-demo (T-3.07)**

```text
[STD-CONTEXT] [STD-PLAN-GATE]
Build the interactive mini-demo (FR-HOME-09): phone frame with HTML screens
(category grid → pros list → booking sheet) using static demo data shaped like the
real app, localized. Fully operable by keyboard and screen reader (announce screen
changes via aria-live, back button, focus moves to new screen heading). Fires
demo_interact {step}. Ends with "Do it for real" CTA. Lazy-load. Under 25 KB gzip.
[STD-QA] [STD-OUTPUT]
```

**3.QA Home QA**

```text
[STD-CONTEXT]
Home page QA (Gate C for Phase 3). Run and report:
1. Lighthouse mobile /fr and /en (scores, LCP, CLS, TBT) vs NFR-PERF budgets.
2. Route JS size (next build output) vs 170 KB.
3. axe scan: violations by severity.
4. Keyboard walkthrough of every section: issues found.
5. Reduced-motion walkthrough: anything still animating.
6. Content: any hardcoded strings, missing FR/EN, placeholder text.
7. 360px width: overflow or overlapping elements.
Output a defect list with severity (S1–S4) and suggested fix per item.
```

---

### Phase 4: Inner pages & forms

**4.0 Kickoff**

```text
[STD-CONTEXT]
Phase 4: all pages in PLAN.md §6 + forms + /download. Propose shared page
templates (PageHero, ContentSection, CTA band, Breadcrumbs), the folder per
routing.pathnames key, generateStaticParams for slug routes (both locales,
localized slugs), and the form architecture (shared zod schemas in lib/validation,
one route handler per form type or one dynamic handler, spam controls, email
templates). Plan only.
```

**4.1 Page build**: use recipe §4.1.

**4.2 Form intake (T-4.09)**

```text
[STD-CONTEXT] [STD-PLAN-GATE]
Build form intake (FR-FORM-01..05, NFR-SEC-03):
- lib/validation/forms.ts: zod schemas per type, localized error messages via
  next-intl keys; shared by client (react-hook-form + zodResolver) and server.
- POST /api/forms/[type]: parse JSON or multipart, validate, honeypot field,
  min time-to-submit (signed timestamp), per-IP rate limit (in-memory LRU,
  5/10 min), create `submissions` via Local API with overrideAccess, CV upload to
  the private files collection (PDF/DOC ≤ 5 MB, magic-byte check), return typed
  {ok} | {error, fieldErrors}. Never echo internals.
- afterChange hook on submissions: email to site.email with a readable summary +
  admin link; reply-to = submitter. Failures logged, never lose the submission.
- Client: accessible fields, aria-live error summary, success state, fires
  quote_submit/pro_apply/job_apply.
Tests: unit for schemas; int for handler (valid, invalid, honeypot, rate-limit,
oversize file). [STD-QA] [STD-OUTPUT]
```

**4.3 `/download` route (T-4.10)**

```text
[STD-CONTEXT]
Build src/app/download/route.ts (FR-PG-14, FR-GLB-04, FR-ANA-03): read UA;
Android → 302 Play URL with referrer built from incoming utm_* params; iOS →
site.appStoreUrl if set else web app URL with ?ref=ios-no-store; desktop / unknown
→ 302 to the localized QR page (locale from cookie NEXT_LOCALE or Accept-Language).
Cache-Control: private, no-store. Bots (crawler UAs) get the QR page, not a store
redirect. Unit-test the decision function with a UA table. [STD-QA] [STD-OUTPUT]
```

**4.QA Phase 4 QA**

```text
[STD-CONTEXT]
Phase 4 QA: crawl every route in routing.pathnames for both locales (and all
slugs from Payload); report status codes, missing <title>/description, broken
internal links, images without alt, pages missing breadcrumbs/CTA. Submit each
form type in both locales on staging; confirm DB record + email. Verify
/download with Android, iPhone and desktop UAs. Output a pass/fail table + defects.
```

---

### Phase 5: SEO & analytics

**5.0 Kickoff**

```text
[STD-CONTEXT]
Phase 5 (FR-SEO-*, FR-ANA-*). Plan: lib/seo.ts API (buildMetadata({locale,
pathnameKey, params, doc})), hreflang alternates from routing.pathnames +
localized slugs, JSON-LD builders per type, sitemap strategy (one sitemap with
alternates vs per-locale), OG image approach, legacy redirect placement, consent +
GA4 loading strategy that doesn't hurt LCP/INP. Plan only.
```

**5.1 Metadata, sitemap, robots, JSON-LD**

```text
[STD-CONTEXT] [STD-PLAN-GATE]
Implement T-5.01..T-5.03. Every template's generateMetadata uses lib/seo.ts:
localized title/description (CMS meta first, fallback to defaults), canonical =
self, alternates.languages {fr, en, x-default → fr} with the correct translated
path (including localized slugs: look up the other locale's slug, don't reuse).
sitemap.ts lists all public URLs for both locales with alternates and lastModified
from Payload updatedAt. robots.ts disallows /admin and /api. JSON-LD components
per FR-SEO-03 with data from CMS. Tests: QA-AUTO-10 metadata test across templates.
[STD-QA] [STD-OUTPUT]
```

**5.2 Legacy redirects (T-5.05)**

```text
[STD-CONTEXT]
Implement the full 301 map from PLAN.md §8 in next.config.ts redirects()
(permanent: true). Old URLs have no locale: target the FR (default) path unless the
old URL was English-only content, then decide and document. /blog/* keeps slugs.
/shop/* → app shop URL. Make sure the proxy matcher doesn't swallow *.html before
redirects run (verify order). Write tests/e2e/redirects.e2e.spec.ts that loops a
table and asserts 301 + Location (QA-AUTO-05). [STD-QA] [STD-OUTPUT]
```

**5.3 Consent + GA4 + events (T-5.06, T-5.07)**

```text
[STD-CONTEXT] [STD-PLAN-GATE]
Implement a bilingual consent banner (accessible, non-blocking, Accept / Reject /
Customise, choice stored, reopenable from footer) and GA4 with Consent Mode v2
(default denied for analytics_storage, ad_storage, ad_user_data,
ad_personalization; update on choice). Load gtag with next/script
strategy="afterInteractive" only when NEXT_PUBLIC_GA_ID is set. Wire
lib/analytics.ts track() to gtag with typed event names/params from FR-ANA-02;
queue events before consent decision is made, drop them on reject. Add every
event at its placement. Verify in GA4 DebugView; list each event and where it fires.
[STD-QA] [STD-OUTPUT]
```

**5.QA SEO audit**: use §5.6.

---

### Phase 6: QA, hardening & launch

**6.0 Launch readiness review**

```text
[STD-CONTEXT]
Role: release manager. Walk docs/quality-assurance.md §7 (go-live checklist) item
by item. For each: verify it (run the command / check the URL / read config) or
mark it as needing a human, with exactly what they must do. Output: checklist with
✅ / ❌ / 👤 and a go/no-go recommendation with the blocking items.
```

**6.1 Security review**: use §5.4.
**6.2 Performance pass**: use §6.10.
**6.3 Accessibility audit**: use §5.5.

**6.4 Cut-over runbook**

```text
Role: DevOps lead. Produce a minute-by-minute cut-over runbook for moving
handymandoit.com from the old site to the new Hostinger app via Cloudflare:
pre-checks (T-24h: lower TTLs, Neon branch backup, final content freeze),
cut-over steps (DNS records @/www → Hostinger, proxied; R2 custom domain; disable
r2.dev; SSL Full strict), verification (smoke test, redirects test against
production, Search Console), rollback trigger conditions and exact rollback steps,
and who does what. Do NOT touch the app.handymandoit.com record. Use
docs/DEPLOY.md and docs/operations.md as the source.
```

**6.5 Post-launch watch**

```text
[STD-CONTEXT]
It's T+{{HOURS}}h after launch. Check: uptime, server logs for 5xx, Search Console
coverage & 404s (I'll paste exports), GA4 realtime events, form submissions
arriving, CWV. Produce: issues found with severity, redirects to add for any 404s
from old URLs, and the next check time.
```

---

### Phase 7: Post-launch evolution & maintenance

**7.1 Monthly maintenance**

```text
[STD-CONTEXT]
Monthly maintenance (docs/operations.md §9). On a branch chore/maintenance-{{YYYY-MM}}:
npm outdated; npm audit --omit=dev. Propose patch/minor updates grouped by risk
(Payload packages must move together and match exactly; Next + eslint-config-next
together). Apply low-risk ones, run the full gate including build and e2e, and
report. List major updates separately with a migration note; don't apply them.
```

**7.2 Framework upgrade (Next / Payload)**

```text
[STD-CONTEXT] [STD-PLAN-GATE]
Upgrade {{PACKAGE}} from {{FROM}} to {{TO}}. First: read the official changelog /
migration guide for every version in between and list breaking changes that touch
our code (grep for each affected API). Plan the upgrade, then execute on a branch:
bump versions (all @payloadcms/* pinned to the same version), regenerate importmap
and types, check whether a migration is needed (run migrate:create and inspect;
delete if empty), full gate + e2e + manual smoke in both locales + /admin.
Test any migration on a Neon branch before production.
```

**7.3 New feature intake**

```text
Role: systems analyst. A new request: "{{REQUEST}}". Before any code:
1. Restate it as a requirement with acceptance criteria and a new ID in
   docs/requirements.md style.
2. Impact analysis: pages, CMS schema, i18n, SEO, analytics, performance, hosting
   constraints, accessibility.
3. Options (max 3) with trade-offs and a recommendation.
4. Tracker tasks with estimates.
Wait for approval before adding to the docs.
```

**7.4 Adding Pidgin (or another locale)**

```text
[STD-CONTEXT] [STD-PLAN-GATE]
Plan adding locale `{{LOCALE}}` end to end: routing.ts locales + pathnames,
messages file, Payload localization (+ fallback behaviour), hreflang/sitemap,
language switcher, proxy detection (Accept-Language may not include it; decide),
OG locale, content backfill strategy, migration impact on localized tables, QA.
List every file that changes.
```

---

## 4. Build recipes

### 4.1 New page

```text
[STD-CONTEXT] [STD-PLAN-GATE]
Build the {{PAGE}} page ({{REQ_IDS}}, task {{TASK_ID}}).
- Route: key "{{PATHNAME_KEY}}" in src/i18n/routing.ts (add with FR + EN slugs if
  missing); folder under src/app/(site)/[locale]/.
- Server Component page: setRequestLocale(locale); data via Payload Local API in
  that locale (drafts off); notFound() when the doc doesn't exist; for [slug],
  generateStaticParams for both locales using localized slugs.
- generateMetadata via lib/seo.ts; JSON-LD where FR-SEO-03 applies; breadcrumbs.
- Revalidation: make sure the source collection's hook revalidates this path.
- Compose from existing sections/ui components; new ones follow recipe §4.3.
- Empty states for optional CMS data; no hardcoded copy.
Verify at /fr/{{FR_PATH}} and /en/{{EN_PATH}}, 390/1280px, keyboard, language
switch keeps the page. [STD-QA] [STD-OUTPUT]
```

### 4.2 New page section

```text
[STD-CONTEXT] [STD-PLAN-GATE]
Build section {{SECTION}} (PLAN.md §{{PLAN_REF}}, {{REQ_IDS}}) as
src/components/sections/{{Name}}.tsx.
- Server Component receiving typed CMS data as props (from payload-types.ts);
  client island only for the interactive part, in its own file.
- Layout/tokens per design-system.md; dark/light alternation as in the plan.
- Motion: specify the reduced-motion behaviour; transform/opacity only;
  IntersectionObserver for reveals.
- Accessibility: landmark/heading level, keyboard, ARIA per design-system.md §8.
- Analytics events if listed in FR-ANA-02.
- Lazy-load if it pulls a heavy library.
Report the client JS this section adds. [STD-QA] [STD-OUTPUT]
```

### 4.3 New UI component

```text
[STD-CONTEXT]
Create {{COMPONENT}} in src/components/ui/. Contract first: props (typed,
minimal, className passthrough), variants, states (hover/focus/active/disabled/
loading), keyboard behaviour, ARIA, reduced-motion behaviour, analytics.
Server Component unless it must be interactive. Add a unit test for any logic.
Add it to the inventory table in docs/design-system.md §6. [STD-QA] [STD-OUTPUT]
```

### 4.4 Schema change (collection/global/field)

```text
[STD-CONTEXT] [STD-PLAN-GATE]
Change: {{SCHEMA_CHANGE}}. Analyse impact first: existing data (does it need a
backfill/transform?), localized tables, access, hooks, pages/components that read
it, seeds. Then: edit schema → npm run generate:types → fix type errors →
npm run migrate:create -- --name {{name}} → read the generated SQL and confirm it's
non-destructive (or write the data-preserving up/down by hand) → update seeds →
update docs/data-model.md → tests. Note in the PR if a Neon branch backup is
required before deploy. [STD-QA] [STD-OUTPUT]
```

### 4.5 New form

```text
[STD-CONTEXT]
Add form type "{{TYPE}}" using the existing form architecture (lib/validation,
/api/forms/[type], submissions collection). Fields: {{FIELDS}}. Add zod schema,
localized labels/errors in both message files, the client component, email summary
formatting, analytics event, and tests (valid, invalid, spam). [STD-QA] [STD-OUTPUT]
```

### 4.6 New translatable string set

```text
Add UI strings for {{FEATURE}} to src/messages/en.json and fr.json under the
namespace "{{NAMESPACE}}". Same keys in both; FR written natively (not literal),
"vous" form, length within +25 % of EN. Use ICU plurals/variables where numbers or
names appear. Run the message parity test.
```

### 4.7 New environment variable

```text
Introduce env var {{NAME}} for {{PURPOSE}}. Add to .env.example (with comment),
docs/operations.md §2 table (required? scope? build-time?), read it in exactly one
place with a typed accessor and a clear error when missing in production, add to
CI env if the build needs it. Remind me which Hostinger env settings to update.
```

---

## 5. QA/QC prompts

### 5.1 Code review (self or PR)

```text
[STD-CONTEXT]
Role: principal engineer doing a rigorous code review of {{DIFF_OR_BRANCH}}
(git diff main...HEAD). Check, in order of severity:
1. Correctness vs acceptance criteria ({{REQ_IDS}}); edge cases; error handling.
2. Security: access control on data, input validation, secrets, XSS in rich text
   rendering, open redirects (/download), PII in logs.
3. Architecture: CLAUDE.md §6 rules (RSC default, Local API, no per-request image
   work, i18n navigation, no hardcoded copy, migrations).
4. Accessibility and i18n (both locales).
5. Performance: client JS added, images, waterfalls, unnecessary dynamic rendering.
6. Tests: would they catch a regression? Missing cases?
7. Readability: naming, duplication, comments matching surrounding density.
For each finding: file:line, severity (blocker/major/minor/nit), why, concrete fix.
Don't list style nits Prettier/ESLint would catch. End with approve / request changes.
```

### 5.2 Write tests for existing code

```text
[STD-CONTEXT]
Write tests for {{FILES}}. First list the behaviours (including edge and failure
cases) and choose the right level (unit / int / e2e) for each, per
docs/quality-assurance.md §2. Tests must be deterministic, independent, named as
behaviour ("redirects Android UA to Play with referrer"), and must fail if the
behaviour breaks (prove it: temporarily break the code, show the failure, restore).
```

### 5.3 Test plan for a feature

```text
Role: QA lead. Create a test plan for {{FEATURE}} ({{REQ_IDS}}): scope, risks,
test cases table (ID, preconditions, steps, expected, level: auto/manual,
locale, device), test data, exit criteria. Include negative, boundary, i18n,
accessibility, performance and no-JS cases. Mark which become automated tests.
```

### 5.4 Security review

```text
[STD-CONTEXT]
Role: application security engineer. Review the whole app against OWASP Top 10
and NFR-SEC-*: Payload access functions on every collection/global/field (try to
find a path for anonymous or editor to read/write what they shouldn't, including
REST and GraphQL); form endpoints (validation, rate limit, upload checks, SSRF,
path traversal); redirects (open redirect in /download or redirects plugin);
rich-text rendering (XSS); headers (CSP, HSTS); secrets in client bundles (grep
.next/static for env values); dependency audit; admin bootstrap (first-user hook
race). Output findings with severity, exploit scenario, fix. Don't make changes.
```

### 5.5 Accessibility audit

```text
[STD-CONTEXT]
Role: WCAG 2.2 AA auditor. Audit {{URLS}} in both locales: run axe via Playwright
and report violations; then do the manual checks automation misses: keyboard
order and traps, focus visibility and focus return after dialogs, headings
outline, landmarks, link/button names (FR and EN), contrast of gold/white-alpha
pairs, reduced motion, 200 % zoom / 320 px reflow, captions, form errors
announced, touch target size. For each issue: WCAG criterion, severity, location,
fix.
```

### 5.6 SEO audit

```text
[STD-CONTEXT]
Role: technical SEO specialist. On {{BASE_URL}}: fetch sitemap.xml and robots.txt;
for every URL check status, canonical, hreflang trio and reciprocity (fr↔en point
to each other; x-default → fr), title/description length and uniqueness per
locale, single H1, JSON-LD validity (parse and check required props per type), OG
tags, internal broken links, legacy redirects (301, single hop). Output: issues
table (URL, issue, severity, fix) + summary score.
```

### 5.7 Phase gate review (generic)

```text
[STD-CONTEXT]
Run Gate C for Phase {{N}} (docs/quality-assurance.md §4). For each task in the
phase: status, evidence (command output / URL / screenshot reference), linked
requirement IDs. List open defects by severity. Verdict PASS/FAIL. If PASS,
update the tracker phase status and change log; if FAIL, list exactly what must
happen to pass.
```

### 5.8 Regression check after a risky change

```text
[STD-CONTEXT]
I just changed {{AREA}}. Identify everything that depends on it (grep imports,
routes, hooks, CMS fields), run the full gate (typecheck, lint, unit/int, build,
e2e smoke), and manually check the 3 most at-risk pages in both locales. Report
regressions or confirm none, with evidence.
```

### 5.9 Content QA (pre-launch)

```text
[STD-CONTEXT]
Content QA across the CMS and rendered site: missing FR or EN fields, placeholder
or lorem text, inconsistent facts (stats, phone, hours, cities must match the
site global), claims not in PLAN.md's app facts list, broken images, missing alt,
legal pages present, prices formatted as "25 000 FCFA" (FR) / "25,000 FCFA" (EN).
Output by page/collection.
```

---

## 6. Utility & troubleshooting prompts

> Common header for all debugging prompts:
> ```text
> Role: senior engineer debugging methodically. Reproduce first, form hypotheses,
> test them one at a time with evidence, fix the root cause (not the symptom),
> add a test or guard so it can't silently return, and explain the cause in 2–3
> sentences. Don't change unrelated code. If you need information, ask for it.
> ```

### 6.1 Generic bug

```text
[DEBUG HEADER] [STD-CONTEXT]
Bug: {{DESCRIPTION}}
Where: {{URL}} · Locale: {{fr/en}} · Device/browser: {{…}}
Steps: {{…}} · Expected: {{…}} · Actual: {{…}}
Evidence: {{ERROR / LOG / SCREENSHOT}}
Recent changes: {{git log or "unknown"}}
```

### 6.2 Build fails (`npm run build`)

```text
[DEBUG HEADER]
`npm run build` fails. Full output: {{ERROR}}
Classify the failure (type error, ESLint, module resolution, prerender error during
generateStaticParams / page render, Payload config, env var missing at build,
OOM). For prerender errors: identify which route/locale/slug and why (DB
unreachable at build? missing CMS data? a client-only API used on server?). Fix
and re-run the build; show the route table summary at the end.
```

### 6.3 Type errors after schema change

```text
[DEBUG HEADER]
After changing {{COLLECTION}}, typecheck fails: {{ERROR}}. Regenerate types
(npm run generate:types), then fix call sites properly: no casts to `any`,
handle the new optional/required fields and populated vs ID relationships
(depth). Confirm a migration exists for the change.
```

### 6.4 Hydration mismatch

```text
[DEBUG HEADER]
Hydration error on {{URL}}: {{ERROR}}. Likely causes here: Date/number formatting
differing server vs client (timeZone is Africa/Douala in i18n/request.ts), reading
window/navigator/matchMedia/localStorage during render (light-data detection,
reduced motion, device detection), random IDs, browser extensions, invalid HTML
nesting. Find the exact component, fix with the right pattern (useEffect after
mount, useSyncExternalStore, server-provided value, CSS media queries instead of
JS), and verify no CLS was introduced.
```

### 6.5 i18n / routing problems

```text
[DEBUG HEADER]
Problem: {{e.g. "/en/a-propos returns 404", "language switch goes home",
"MISSING_MESSAGE: hero.title (fr)", "redirect loop on /"}}.
Check: routing.pathnames entry and both slugs; that links use @/i18n/navigation
with pathname keys + params; setRequestLocale in every layout/page;
generateStaticParams includes both locales and localized slugs; proxy.ts matcher;
NEXT_LOCALE cookie; message key exists in both files. Fix and add a test
(parity test or e2e) that would have caught it.
```

### 6.6 Hostinger deploy fails / app won't start

```text
[DEBUG HEADER]
Hostinger deploy problem: {{build log or runtime log}}.
Walk the chain: Node version (24.x) → npm ci (lockfile, legacy-peer-deps) → build
(memory: 3 GB cap; env vars present at build time: NEXT_PUBLIC_SITE_URL,
MEDIA_PUBLIC_URL, DATABASE_URL if pages query at build) → start:prod (migrate:
DB reachable from Hostinger? sslmode=require? pooled URL? migrations folder
committed?) → next start (port from Hostinger env, PAYLOAD_SECRET set).
Tell me exactly what to check in hPanel and what to change; if code changes are
needed, make them. If OOM persists, propose the GitHub Actions build option, but
ask before changing the deploy flow (docs/DEPLOY.md §4).
```

### 6.7 Database / migration issues

```text
[DEBUG HEADER]
DB problem: {{ERROR}} in {{env}}.
Typical causes: schema drift (dev push vs prod migrations), migration not
committed, failed migration left partial state, Neon cold start/timeouts, pool
exhaustion (use pooled URL), localized table changes. Diagnose with
`npx payload migrate:status`. Never run destructive SQL or `migrate:fresh` /
`migrate:reset` against staging/prod without my explicit approval; propose a
Neon branch to test the fix first. Provide the exact recovery steps.
```

### 6.8 Media / R2 issues

```text
[DEBUG HEADER]
Media problem: {{e.g. upload fails, images 404, next/image "hostname not
configured", CORS error, wrong URLs after domain change}}.
Check: S3_* env vars and token scope; endpoint format; forcePathStyle; bucket
public access / custom domain; MEDIA_PUBLIC_URL matches the public host and was
present at BUILD time (remotePatterns); generateFileURL prefix; CORS policy
origins; existing docs with old URLs after a domain change (propose a migration
script, don't run it without approval).
```

### 6.9 Email not arriving

```text
[DEBUG HEADER]
Form emails not arriving ({{env}}). Check: SMTP_HOST set (otherwise console only),
port/secure pairing (465 ↔ secure true, 587 ↔ STARTTLS), credentials, EMAIL_FROM
allowed by provider (SPF/DKIM/DMARC on handymandoit.com), hook errors in logs, spam
folder, provider sending limits. Add an admin-only test-email endpoint or script if
missing (remove before launch or protect it). Submissions must still be saved
even when email fails: verify.
```

### 6.10 Performance regression

```text
[DEBUG HEADER] [STD-CONTEXT]
{{URL}} misses budget: {{metric and value}} (target per NFR-PERF).
Profile: Lighthouse mobile trace, LCP element and its breakdown (TTFB, load delay,
load time, render delay), next build route sizes, bundle composition (what
client components pulled which libraries), fonts, images (size used vs needed),
third-party scripts, long tasks for INP, layout shifts with their sources. Fix the
top 3 contributors, re-measure, and report before/after numbers.
```

### 6.11 Page content is stale after publishing in CMS

```text
[DEBUG HEADER]
Edited {{doc}} in /admin, site still shows the old content at {{URL}}.
Trace: is the doc published (not draft)? Does the collection have the afterChange
hook and does it compute THIS path for BOTH locales (translated pathname +
localized slug)? Does revalidatePath run inside the Next runtime (logs)? Is the
page reading via a cached function with a tag that's not revalidated? Is
Cloudflare serving cached HTML (check cf-cache-status / age headers)? Fix the
mapping and add a test for the path builder.
```

### 6.12 Admin panel broken

```text
[DEBUG HEADER]
/admin problem: {{blank page / import map error / component not found / login
loop / 403}}. Check: importMap regenerated (npm run generate:importmap) after
adding custom components; src/app/(payload) files untouched (regenerate from the
Payload template if edited); PAYLOAD_SECRET consistent; serverURL =
NEXT_PUBLIC_SITE_URL matches the origin (cookies); proxy matcher excludes admin;
CSP/frame-ancestors not blocking admin or live preview; user roles in JWT.
```

### 6.13 Animation / scroll jank

```text
[DEBUG HEADER]
Jank in {{section}} on {{device}}. Check: animating layout properties instead of
transform/opacity; scroll listeners instead of ScrollTrigger/IntersectionObserver;
ScrollTrigger not refreshed after images/fonts load or not killed on unmount
(duplicate triggers after client navigation); Lenis + ScrollTrigger integration;
large images decoded on scroll; will-change overuse. Profile on 4× CPU throttle,
fix, and confirm reduced-motion path is unaffected.
```

### 6.14 Flaky or failing tests

```text
[DEBUG HEADER]
Test {{TEST}} fails {{always / intermittently / only in CI}}: {{OUTPUT}}.
Determine: real regression vs test bug. For flakiness: shared DB state between
tests, timing (waitForTimeout instead of web-first assertions), order dependence,
dev server vs build differences, locale/Accept-Language defaults in CI, missing
env vars in CI. Fix the root cause; never add retries or skip as the fix
(retries already exist on CI for genuine infra flakiness).
```

### 6.15 Dependency conflict / install failure

```text
[DEBUG HEADER]
`npm ci` / `npm install` fails: {{ERROR}}. Note .npmrc legacy-peer-deps=true and
that all @payloadcms/* must be the exact same version as payload. Identify the
conflicting package and the minimal safe resolution (align versions > overrides >
removing the dependency). Don't delete package-lock.json unless I approve; if
regenerated, show the diff of top-level versions.
```

### 6.16 Production incident

```text
Role: incident commander. Situation: {{SYMPTOMS}} since {{TIME}}.
Follow docs/operations.md §8: (1) assess severity S1–S4 and impact, (2) give me
the fastest safe mitigation (rollback per §5, Cloudflare cache/under-attack mode)
with exact steps, (3) the information to collect for root cause, (4) a short
message to send to the owner now. After resolution, draft the postmortem
(timeline, impact, root cause, contributing factors, actions with owners).
```

### 6.17 Refactor safely

```text
[STD-CONTEXT] [STD-PLAN-GATE]
Refactor {{AREA}} to {{GOAL}} with no behaviour change. First make sure tests
cover current behaviour (add characterization tests if not). Refactor in small
steps, running tests after each. Report what changed structurally and the
evidence that behaviour is identical (tests, build route table unchanged, manual
check).
```

### 6.18 Explain code / onboarding

```text
[STD-CONTEXT]
Explain {{FILE_OR_FEATURE}} to a new developer: purpose, how data flows through it
(entry → data source → render), why it's built this way (link to ADRs), how to
change it safely, related tests, and pitfalls. Reference file:line. No edits.
```

### 6.19 Stuck / going in circles

```text
We've tried {{N}} fixes for {{PROBLEM}} without success. Stop changing code.
List every hypothesis tried and the evidence for/against each. Identify what we
have NOT verified (assumptions). Propose the single cheapest experiment that would
split the remaining hypotheses, and what each outcome would mean. Consider
reverting to the last known-good state (git) and bisecting.
```

### 6.20 Translation review

```text
Role: native Cameroonian-French editor and English copy editor. Review
{{src/messages/*.json | CMS export | page URL}}: accuracy vs EN meaning, natural
phrasing (not calques), consistent terminology (pro / prestataire, devis,
Mobile Money, portefeuille HandyMan), "vous" form, typography (French spaces
before : ; ! ?, guillemets « », apostrophe ’, FCFA formatting), length vs layout.
Output: key/field, current, proposed, reason.
```

---

## 7. Documentation & communication

### 7.1 Update docs after a change

```text
[STD-CONTEXT]
Given the changes in {{DIFF}}, update every affected doc: project-tracker (status,
change log), architecture (decision log if a structural choice was made),
data-model (schema), design-system (components inventory), operations (env vars,
deploy), requirements (only if scope changed, with owner approval). Keep each
doc's existing style. Show which sections changed.
```

### 7.2 Architecture Decision Record

```text
Write ADR-{{NNN}} for "{{DECISION}}" in docs/architecture.md §10: context
(constraints: Hostinger, budget, team), options considered (≥ 2) with pros/cons,
decision, consequences (positive/negative), status. Keep it to one table row plus
a short subsection if needed.
```

### 7.3 Commit message

```text
Write a Conventional Commit message for the staged changes (git diff --staged):
type(scope): imperative summary ≤ 72 chars; body explains why and notable
details; footer with requirement/task IDs (Refs: FR-HOME-01, T-2.03).
```

### 7.4 Pull request description

```text
Write the PR description for this branch (git diff main...HEAD):
## What & why (requirement/task IDs)
## How (key decisions, trade-offs)
## Screenshots (list which are needed: /fr, /en, 390px, 1280px)
## Verification (commands run + results; manual checks)
## Schema / env / deploy notes (migration? new env var? Neon backup needed?)
## Risks & rollback
## Checklist (Gate A from docs/quality-assurance.md §4)
```

### 7.5 Status report for the owner

```text
Write a weekly status update for the business owner (non-technical, ≤ 200 words)
from docs/project-tracker.md and git log since {{DATE}}: what's done (in terms of
what they can see), what's next, what we need from them (open questions with
deadlines), risks in plain language. Include the staging link.
```

### 7.6 Release notes

```text
Write release notes for {{TAG}} from the change log and merged PRs: user-visible
changes (bilingual FR/EN, short), editor-facing changes (CMS), technical changes
(for the dev log), known issues.
```

---

## Appendix A: Prompt quality checklist

Before sending a prompt you wrote yourself, check:

- [ ] One objective, with requirement/task IDs
- [ ] Tells the agent what to **read** first
- [ ] States constraints (hosting limits, i18n, a11y, performance)
- [ ] Has a plan checkpoint if the change is non-trivial
- [ ] Defines acceptance criteria and **verification commands**
- [ ] Specifies the output format
- [ ] Contains real data (errors, URLs, IDs), not paraphrases
- [ ] Says what **not** to do (destructive ops, prod data, scope creep)

## Appendix B: Phase → prompt map

| Phase | Kickoff | Main prompts | QA / gate |
|---|---|---|---|
| −1 Discovery | −1.1 | −1.2, −1.3 | — |
| 0 Foundations | 0.0 | 0.1–0.5 | 0.G, 5.7 |
| 1 Content | 1.0 | 1.1–1.8, 4.4 | 1.QA, 5.7 |
| 2 Hero | 2.0 | 2.1–2.3, 4.3 | 2.QA, 5.5, 5.7 |
| 3 Home | 3.0 | 4.2, 3.2, 3.3 | 3.QA, 5.7 |
| 4 Inner pages | 4.0 | 4.1, 4.2, 4.3, 4.5 | 4.QA, 5.7 |
| 5 SEO & analytics | 5.0 | 5.1–5.3 | 5.6, 5.7 |
| 6 Launch | 6.0 | 6.4, 6.5 | 5.4, 5.5, 6.10, QA §7 |
| 7 Maintain | — | 7.1–7.4 | 5.8 |
