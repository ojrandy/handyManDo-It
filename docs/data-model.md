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
name (required), logo (media, required; its alt should be the partner name), url (http/https only), order. Group Marketing; public read, editor write; revalidates tag `partners`. Unknown names (Q-10) are seeded as placeholders.

### 3.8 `faqs` ✅
question (L, required), answer (richText L, required; also used for FAQPage JSON-LD), category (select, required, indexed: payments, coverage, quotes, cancellations, guarantee, safety, pros, business), service (rel, optional, indexed), showOnHome (bool, default false), order. Public read, editor write; revalidates `faqs`. Listed on services via the `faqs` join.

### 3.9 `posts` + `categories` ⬜
posts: title (L), slug, excerpt (L), cover (media), content (richText L), categories (rel[]), author (rel users), publishedAt, legacyUrl (text, for redirect audit), meta. Drafts on.
categories: title (L), slug.

### 3.10 `jobs` ⬜
title (L), slug, location, type (select: full-time, part-time, contract), description (richText L), open (bool), closesAt (date).

### 3.11 `appScreens` ⬜
key (select: welcome, home, services, category, shop, food, help, tracking, wallet, chat, completion), locale (`fr`/`en`, **not** Payload-localized — one doc per locale×theme), theme (`light`/`dark`), image (media), caption (L). Unique index on (key, locale, theme).

### 3.12 `submissions` ⬜
type (select: contact, quote-home, quote-business, partnership, pro, job), name, email, phone, city, message, payload (json, extra form fields), job (rel jobs, optional), attachment (rel to private `files` upload collection), locale, utm (json), status (select: new, in-progress, done, spam), createdAt.
Access: create **only via server route handler** (Local API with `overrideAccess`), no public REST create; read/update for authenticated; delete admin. Hook: `afterChange` on create → email notification. Retention: 24 months (NFR-PRIV-01).

## 4. Globals

### 4.1 `site` ✅ (access: public read, admin update)
Tabs — **Contact:** phone, whatsappUrl, email, hours (L), offices[] {label L, address, city, mapUrl}. **Apps:** webAppUrl, playStoreUrl, appStoreUrl (empty ⇒ iOS badge hidden), rating, reviewCount (empty ⇒ rating row hidden). **Stats:** towns, years, clients, projects. **Social:** facebook, instagram, x, youtube.
Defaults come from `src/lib/site.ts`. ⬜ Add revalidation hook (`revalidateTag('site')`).

### 4.2 `navigation` ⬜
header[] {label L, link (internal pathname key or external URL), children[] for mega-menu {label L, description L, icon, link}}; footer columns[] {title L, links[]}.

### 4.3 `home` ⬜
One group per home section (PLAN.md §5.2–5.16) with localized copy. Hero: video (media, mp4), videoWebm (media), poster (media), filmUrl (media), cues[] {timeSeconds number, text L, icon}. Drafts on.

### 4.4 `seo` ⬜
defaultTitle (L), defaultDescription (L), ogImage (media), organisation JSON-LD fields (legalName, foundingDate, sameAs[]).

## 5. Redirects

`@payloadcms/plugin-redirects` is installed (not yet configured). Use it for **editor-managed** redirects; keep the fixed legacy map (PLAN.md §8) in `next.config.ts` `redirects()` so it's versioned and testable.

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
| `scripts/seed.ts` ⬜ | Old site content + `lib/site.ts` | services (11), testimonials (4), team (3), partners (8), faqs, site, navigation, home |
| `scripts/migrate-wordpress.ts` ⬜ | WordPress REST API | posts (20), categories, media; records `legacyUrl` |
| `scripts/capture-screens.ts` ⬜ | Playwright on app.handymandoit.com | appScreens (390×844 @3x, fr/en, light/dark) |

Seeds must be **idempotent** (upsert by slug/key) and safe to re-run.

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
