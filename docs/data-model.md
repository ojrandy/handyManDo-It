# Data Model (Payload CMS)

Version 1.0 · 2026-10-23 · Source of truth for the schema is the code in `src/collections` and `src/globals`; this doc describes intent, conventions and the target model. Generated types: `src/payload-types.ts` (never edit).

Status legend: ✅ implemented · 🟡 partial · ⬜ planned

---

## 1. Conventions

| Rule | Detail |
|---|---|
| Localization | Config: locales `fr` (default) + `en`, `fallback: true`. Any human-readable text is `localized: true`. Numbers, URLs, booleans, relationships are not localized unless they genuinely differ per language. |
| Slugs | `slug` field: unique, lowercase kebab-case, auto-generated from title on create, editable. **Localized** for collections whose URLs are translated (services, projects, jobs, posts if FR/EN articles differ). Service slugs fixed per PLAN.md §6. |
| Access | Every collection/global declares `access` explicitly. Helpers live in `src/access/`: `anyone`, `isAdmin`, `isEditor`, `isAdminOrSelf`, `publishedOrEditor` (drafts collections). |
| Drafts | `versions: { drafts: true }` on public content collections; public reads filter `_status: 'published'`. |
| Revalidation | Every public collection/global spreads `revalidateCollection('<slug>')` / `revalidateGlobal('<slug>')` from `src/hooks/revalidate.ts`. Pages read through `src/lib/payload.ts`, whose cached reads are tagged with the slug (+ `media`), so purging the tag refreshes every page in both locales (architecture.md §4). |
| SEO | `@payloadcms/plugin-seo` adds `meta` group (title, description, image) on page-like collections. |
| Ordering | Manual ordering via `order` number field (or Payload `orderable` when used). |
| Admin | `admin.useAsTitle`, `defaultColumns`, `group` (Content, Marketing, Company, Inbox, Settings) set on every collection. |
| Changes | After any change: `npm run generate:types` → `npm run migrate:create` → commit both. |

## 2. Entity overview

```
users ─┐
       └─(author)─▶ posts ──▶ categories
media ◀── used by almost everything (upload relationship)
services ◀──(service)── projects ──(featured)──▶ home
   │  ▲                     ▲
   │  └──(service)── testimonials
   └──▶ faqs (by service or category)
team · partners · jobs · appScreens · submissions
globals: site · navigation · home · seo
```

## 3. Collections

### 3.1 `users` ✅
| Field | Type | Notes |
|---|---|---|
| email, password | auth | Payload auth |
| name | text | |
| roles | select[] `admin`/`editor` | required, default `['editor']`, `saveToJWT`; only admins can change |

Access: create/delete admin; read/update admin or self. Hook: first user ever created becomes admin.

### 3.2 `media` ✅
| Field | Type | Notes |
|---|---|---|
| alt | text, **required, localized** | |
| caption | text, localized | |
| (upload) | image/*, video/mp4, video/webm, application/pdf | focal point on |

Sizes (WebP): `thumb` 480, `card` 960, `wide` 1600, `hero` 2400. Storage: R2 prefix `media/` when `S3_BUCKET` set. Access: public read; create/update/delete `isEditor` (2026-10-23). ⬜ Separate private collection for CVs (§3.12).

### 3.3 `services` ✅
title (L, required), slug (L; unique per locale, index `(slug, _locale)`, so FR and EN may share a slug), key (select of the 11 built-in `ServiceKey`s from `src/lib/service-keys.ts`, unique, optional for new services), icon (select of Lucide names in the same file), heroImage (media), summary (textarea L, required), body (richText L), inclusions (array{text}, localized as a whole), process (array{title, text}, localized as a whole), fromPrice (number FCFA, optional → fallback label), featuredOnHome (bool, default true), size (`large`/`small` for bento), order, meta (SEO plugin tab: localized title/description/image). Drafts on (20 versions). Access: `publishedOrEditor` read, editor write. Revalidates tag `services`. Join fields (virtual, ADR-017): `projects` (on `projects.service`) and `testimonials` (on `testimonials.service`); `faqs` (on `faqs.service`). Public reads of the join respect the joined collection's access, so draft projects stay hidden.

### 3.4 `projects` ✅
title (L, required), slug (L, unique per locale), service (rel services, required, indexed), city (required), client, date (month), featured (bool), cover (media, required), gallery (media[]), beforeAfter group {before, after} (both ⇒ slider), story (richText L), meta (SEO tab). Drafts on; `publishedOrEditor` read; revalidates `projects`. Default sort newest first.

### 3.5 `testimonials` ✅
name, city (required), quote (textarea L, required), service (rel, optional, indexed), rating (1–5, empty hides stars), featured (default true), order, photo, projectPhoto. Public read, editor write; revalidates `testimonials`. Seed: N Emmanuel (Yaoundé), Richard S. (Buea), Solpia Cameroon (Douala), M Lounge Exclusive (Bonaberi).

### 3.6 `team` ✅
name (required), role (L, required), photo (media), bio (textarea L), order. Group Company; public read, editor write; revalidates tag `team`. Seed: J. Batholomew, Mbeng Nkeng S., ANU Ernest.

### 3.7 `partners` ✅
name (required), logo (media, required; its alt should be the partner name), url (http/https only), order. Group Marketing; public read, editor write; revalidates tag `partners`. Seeded with the 8 names and logos from the live site (Q-10).

### 3.8 `faqs` ✅
question (L, required), answer (richText L, required; also used for FAQPage JSON-LD), category (select, required, indexed: payments, coverage, quotes, cancellations, guarantee, safety, pros, business), service (rel, optional, indexed), showOnHome (bool, default false), order. Public read, editor write; revalidates `faqs`. Listed on services via the `faqs` join.

### 3.9 `posts` + `categories` ✅
posts: title (L, required), slug (**not** localized: one URL per article, since most migrated posts exist in one language and legacy redirects target one URL), excerpt (textarea L), cover (media), content (richText L, required), categories (rel[]), publishedAt (indexed; stamped on first publish unless set, so imports keep the WordPress date), author (rel users, defaults to the editor; user records are private, so pages credit the company in Article JSON-LD), legacyUrl (unique), meta (SEO tab). Drafts on; `publishedOrEditor` read; revalidates `posts`. Default sort newest first. The 20 imported WordPress articles exist in English only (written in the `en` locale). Payload falls back to the default locale (`fr`), not to `en`, so French blog reads must pass `fallbackLocale: en` until an article is translated (T-4.07).
categories: title (L, required), slug (shared by both locales). Public read, editor write; revalidates `categories` and `posts`.

### 3.10 `jobs` ✅
title (L, required), slug (L, unique per locale: `/careers/[slug]` is translated), location (required), type (select: full-time, part-time, contract), open (bool, default true, indexed; closed roles stay visible without the apply form), closesAt (date), description (richText L, required). Public read, editor write; revalidates `jobs`.

### 3.11 `app-screens` ✅ (`appScreens`)
key (select: welcome, home, services, category, shop, food, help, tracking, wallet, chat, completion), lang (`fr`/`en`, **not** Payload-localized — one doc per language × theme; renamed from `locale`, Q-15), theme (`light`/`dark`, default light), image (media, required; 390×844 @3×), caption (L). Unique compound index (key, lang, theme). Public read, editor write; revalidates `app-screens`.

### 3.12 `submissions` ✅ + `files` ✅
submissions: status (select: new, in-progress, done, spam; the only editable field), type (select: contact, quote-home, quote-business, partnership, pro, job), name, email, phone, city, message, job (rel jobs), attachment (upload → `files`), locale (fr/en), details (json, extra form fields; named `details`, not `payload`, to avoid confusion with Payload), utm (json), createdAt. Visitor-supplied fields are read-only for everyone (field access `update: false`, FR-FORM-02).
Access: create **only via server route handler** (Local API with `overrideAccess`), no public REST create; read/update (status) editors; delete admin. Hooks: `afterChange` on create emails the `site` inbox, then deletes submissions older than 24 months (NFR-PRIV-01; no cron on Hostinger); `afterDelete` deletes the attachment, so purges and manual bulk deletes also remove CVs. Email or purge failures are logged and never undo the submission.
files (private uploads, group Inbox): PDF/DOC/DOCX only (Payload also checks the real file content), ≤ 5 MB, stored under a random UUID name. Read editors, delete admin, no create/update via API. Local disk `private-files/` (gitignored) in dev; in staging/prod a **separate R2 bucket** `S3_PRIVATE_BUCKET` with no public access (the media bucket is public, so a prefix there would not be private). Files are streamed through Payload's access check.

## 4. Globals

### 4.1 `site` ✅ (access: public read, admin update)
Tabs — **Contact:** phone, whatsappUrl, email, hours (L), offices[] {label L, address, city, mapUrl}. **Apps:** webAppUrl, playStoreUrl, appStoreUrl (empty ⇒ iOS badge hidden), rating, reviewCount (empty ⇒ rating row hidden). **Stats:** towns, years, clients, projects. **Social:** facebook, instagram, x, youtube.
Defaults come from `src/lib/site.ts`. Revalidates `site`. The home sections read it (stats, web app and store links, T-1.15); header and footer still use `src/lib/site.ts` until T-1.17.

### 4.2 `navigation` ✅ (access: public read, editor update)
header[] (≤ 8) {link, children[] (≤ 16, non-empty ⇒ mega-menu) {link, description L, icon (service icon names)}}; footerColumns[] (≤ 4) {title L, links[] {link}}. Revalidates `navigation`.
**Link** (`src/fields/link.ts`, reused everywhere): label (L) + type `page` (a static key of `routing.pathnames`, so the site resolves the translated URL per locale) | `doc` (relationship to services, projects, posts or jobs) | `external` (https://, mailto:, tel:). The target matching the type is required. The page list is a database enum: adding a static route to `routing.pathnames` needs a migration (the CI drift check catches it).

### 4.3 `home` ✅ (access: public read, editor update; drafts on, 20 versions)
One tab + group per section (PLAN.md §5.2–5.16): **hero** {eyebrow, titleStart, titleHighlight, subtitle, values, video {mp4, webm (720p), mp4Large, webmLarge (1080p, screens ≥ 1280 px), mp4Small, webmSmall (480p), poster (AVIF ≤ 120 KB)}, film {video, poster, captions}, cues[] {time (s, required), icon, title, body}}; **pillars** {eyebrow, title, values[] {icon, title, body}, trustTitle, trust[] {icon, title, body}}; **numbers** {eyebrow, title, body}; **howItWorks** {eyebrow, title, steps[]}; **audiences** {eyebrow, title, items[] {audience homes/businesses/buildings, title, points[]}}; **earn** {eyebrow, title, body, tabs[] {label, title, points[]}, steps[]}; **services / testimonials / faq / blog** {eyebrow, title}; **download** {eyebrow, title, bodyAndroid, bodyAll}. Text is localized; arrays are localized as a whole (fields inside are not localized again). All section copy is optional: an empty field (or list with no rows) shows the messages/*.json copy instead (T-1.15, `src/lib/home.ts`). Audience cards are matched on `audience`; Earn tabs take their icons in row order. UI chrome (buttons, aria) stays in messages; counters in `site`. Revalidates `home`; draft saves don't purge.

### 4.4 `seo` ✅ (access: public read, **admin** update)
defaultTitle (L, required, default "HandyMan Do IT"), defaultDescription (L, required, ≤ 160, no default so each language is written, not inherited), ogImage (media, 1200×630), organization {legalName, foundingDate, sameAs[] {url https}}. Revalidates `seo`.

## 5. Redirects

`@payloadcms/plugin-redirects` ✅ adds the `redirects` collection (group Settings) for **editor-managed** redirects: from (unique; normalised to a bare path, so `https://handymandoit.com/blog/x/?a=1` is stored as `/blog/x`; `/` refused), to (a service, project, post or job, or a custom URL), type (301 default, 302). Public read (a request-level lookup may fetch it over REST), editor write; revalidates `redirects`. Applying them to requests is Phase 5. Keep the fixed legacy map (PLAN.md §8) in `next.config.ts` `redirects()` so it's versioned and testable.

## 6. Migrations

- Dev: Payload pushes schema automatically (`push` in dev). Don't rely on push anywhere else.
- Baseline: `20261023_172405_initial` (T-0.13). Every later migration diffs against the previous one's `.json` snapshot.
- Each schema branch: one migration, named after the change (`add-services`, `faq-category`), committed with `payload-types.ts`.
- Verify on an **empty** database (`migrate:fresh` + `migrate:status` against a scratch DB), not the dev DB, which schema push has already changed.
- Merge schema branches in order. If another schema branch lands first: delete your migration, rebase, run `migrate:create` again. Never hand-merge two migrations.
- Never edit a migration that is on `main`; fix forward with a new one.
- Content goes in seeds (`scripts/seed.ts`), not in `up()`. Migrations change structure only.
- Gate: `npm run migrate:check` runs both checks locally (drift: config vs last snapshot; fresh: applies all migrations to a scratch `<db>_migration_check` database, local hosts only, dropped after). CI runs `migrate:check -- --drift` after `migrate`.
- Destructive changes (rename/drop) need a two-step migration or a data copy in `up()`; document in the PR.
- Production applies migrations on start (`npm run start:prod`). Take a Neon branch/snapshot before any destructive migration.

## 7. Seed and import data

| Script | Source | Fills |
|---|---|---|
| `scripts/seed.ts` ✅ (`npm run seed`) | Old site content in `messages/*.json` + `lib/{site,services,hero,showcase}.ts` + `public/images` | services (11), testimonials (4), team (3), partners (8), faqs (9), site, navigation, home |
| `scripts/migrate-wordpress.ts` ✅ (`npm run migrate:wordpress`) | WordPress REST API (`WORDPRESS_API`, default the old blog) | posts (20, `en` locale), categories (2; “Uncategorized” dropped; FR names in the script), media (cover + inline images, originals capped at 2400 px); records `legacyUrl` |
| `scripts/capture-screens.ts` ✅ (`npm run capture:screens`) | Playwright on app.handymandoit.com, signed out | app-screens: welcome, home, services, category, shop, food, help × fr/en × light/dark (1170×2532 WebP), captions FR/EN |
| `scripts/encode-hero.ts` ✅ (`npm run encode:hero`, needs ffmpeg) | A licensed source clip | 480/720/1080p MP4 + WebM, AVIF poster ≤ 120 KB; `--upload` sets `home.hero.video`, `--cues` retimes the cues |

Seeds must be **idempotent** (upsert by slug/key) and safe to re-run. Downloads and captures are cached in `.cache/` (gitignored).

`scripts/migrate-wordpress.ts` match keys: posts `legacyUrl`, categories `slug`, media the file name (shared `scripts/seed/media.ts`). HTML becomes Lexical: images become upload nodes, figures/galleries are unwrapped (captions kept in italics), `h1` becomes `h2`, links to the old site are kept (the Phase 5 301 map covers them). WordPress alt text is empty, so alt = caption, else a descriptive media title, else the post title (editors should improve them). A post whose image fails to import is not saved, so the next run retries it. `capture-screens` matches `app-screens` on key × lang × theme; existing screens are skipped unless `--update`.

`scripts/seed.ts` match keys: services `key`; testimonials and team `name`; partners the logo's media; faqs the French question; media the file name (or a renamed `name-N` copy of the same size). Each record is created in `fr`, then updated in `en`; non-localized arrays with localized fields (`site.offices`, `navigation`) reuse the `fr` row ids so both languages share rows. Existing records and already-filled globals are **skipped** so editors' changes survive; `--update` overwrites the seeded fields. A non-local `DATABASE_URL` is refused unless `--force`. Writes pass `disableRevalidate`.

## 8. Phase 1 build plan (approved 2026-10-27)

**Branch 0: shared helpers, no schema change.**

| File | Purpose |
|---|---|
| `src/access/index.ts` | `isAdmin`, `isEditor`, `isAdminOrSelf` (moved from `Users.ts`, re-exported there), `anyone`, `publishedOrEditor` (editors see all; public sees `_status: 'published'`) |
| `src/fields/slug.ts` | `slugField({ from, localized })`: fills from the title in the edited locale when empty, kebab-case, unique, indexed, sidebar, editable |
| `src/fields/order.ts` | Shared `order` number field (sidebar, default 0, indexed) |
| `src/hooks/revalidate.ts` | `revalidateCollection({ paths, tags })` → `afterChange` + `afterDelete`. Paths for both locales via next-intl `getPathname`; also revalidates the previous slug's path; acts only on published or previously published docs; no-op when `context.disableRevalidate` (seeds) or outside Next |
| `src/lib/payload.ts` | Cached `getPayload()` + typed query helpers (T-1.13) |

**Order** (dependencies first; one migration each): team + partners → services → projects + testimonials → faqs → categories + posts → jobs + `files` + submissions → appScreens → navigation + seo → home → redirects. Branch table in project-tracker.md §3.

**Approved changes to §3 (owner, 2026-10-27, Q-13..Q-15; §3 is updated as each branch lands):**
- services keeps no `faqs` / `relatedProjects` relationship columns; the relationship lives on the child (`projects.service`, `faqs.service`, `testimonials.service`) and services shows them through Payload `join` fields (ADR-017).
- services adds `key` (the existing `ServiceKey` values in `src/lib/services.ts`) so components can switch to Payload without changes (T-1.15).
- `appScreens.locale` → `lang`.
- submissions retention: purge older than 24 months on each new submission, plus a manual admin purge.
- `files` (private CVs): own R2 prefix, Payload access control kept (`disablePayloadAccessControl: false`), read authenticated only.
