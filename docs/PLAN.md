# HandyMan Do IT — Website Rebuild: Master Plan

Status: **Plan v1.1, awaiting final sign-off** · Last updated: 2026-10-23

### What the app actually offers (from the Play Store listing; this shapes all copy)
- **Book verified pros:** every pro is checked by the team before customers can see them: identity, documents and skills.
- **Clear price before booking:** describe the job, add photos, get a clear price first.
- **Live job tracking:** follow your pro on a live map. Each stage is shown (set off → arrived → started → finished) with photos of the work.
- **Completion code:** a private code protects the customer. The job only closes when they hand it over.
- **Protected payment:** pay up front with Mobile Money or the HandyMan wallet. The money is held and only released when the job is done. Refunds go back to the wallet.
- **Food & Shop:** local kitchens; new, refurbished and second-hand goods (phones, home, tools, building, solar, groceries).
- **Your building on HandyMan:** residences, estates and property managers run their building in the app (notices, charges, issue reports).
- **Rewards:** points per booking and per referral, convertible to wallet credit.
- **For pros, sellers & kitchens:** the **same app**. Choose "I offer services" at sign-up, set skills, rates and service area, receive nearby requests, get paid.
- **Reach and support:** 120+ towns and cities served. App languages: English, French, Pidgin. Support every day 07:00–21:00 WAT.

This replaces the whole of handymandoit.com (static HTML site + WordPress blog + WooCommerce shop) with one modern, bilingual Next.js application that sells the HandyMan Do IT app and the company behind it.

---

## 1. Decisions (locked)

| Topic | Decision |
|---|---|
| Scope | Full replacement of handymandoit.com: every existing page is rebuilt or redirected |
| Stack | Next.js (latest stable, App Router, React Server Components, TypeScript) on Node.js |
| CMS | Payload CMS 3, embedded in the same Next.js app (`/admin`) |
| Languages | English + French, human-written, both fully editable in the CMS |
| Hosting | Hostinger Node.js Web App hosting, with Cloudflare in front |
| Hero | Concept C, the "synced story": real footage plus app notifications timed to the film |
| App showcase | Pinned scroll story, laptop + phone, interactive mini-demo, 3D screens gallery |
| Audiences | Households (primary); Businesses and Buildings/estates (secondary); Pros, sellers and kitchens ("Earn with HandyMan") |
| Pros | Same app. "Become a pro" sends people to the store or the web app's "I offer services" sign-up |
| Payments shown | MTN Mobile Money + Orange Money + HandyMan Wallet badges throughout |
| Analytics | GA4 (Consent Mode v2) + Search Console + custom conversion events |
| Google Play | https://play.google.com/store/apps/details?id=com.handymandoit.app |
| App Store | **Not set yet.** The iOS badge stays hidden through a CMS switch. Until it's set, iPhone visitors go to the web app with an "Add to Home Screen" hint |
| Web app | https://app.handymandoit.com (WhatsApp fallback on every page) |
| Website languages | EN + FR at launch. Pidgin is a possible later addition, since the app already supports it |

---

## 2. Hosting constraints and how we handle them

Hostinger Node.js plans provide **MySQL only**, and **Payload does not support MySQL** (it supports Postgres, MongoDB and SQLite). Hostinger also has no WebSockets, no always-on workers, a 120-second request cap, and a shared process limit (about 120 on Business).

| Need | Solution |
|---|---|
| CMS database | **Neon Postgres**, managed, AWS us-east-1 (owner decision 2026-10-23). The free tier covers this site. |
| Media files (images, video) | **Cloudflare R2** through `@payloadcms/storage-s3`. Uploads don't depend on Hostinger's disk and survive redeploys. |
| Image resizing | Payload creates AVIF/WebP sizes when a file is uploaded. The site serves those sizes directly, so the Hostinger CPU does no image work per request. |
| Speed | Every page is pre-rendered. When an editor saves in Payload, a hook refreshes only the affected pages. No cron jobs, no background workers. |
| Video delivery | MP4 (H.264) + WebM, 3 sizes, served from R2 behind Cloudflare's cache |
| Global cache / TLS | Cloudflare proxy: caches HTML at the edge, adds HTTP/3 and Brotli |
| Plan size | Hostinger **Business** plan is enough (3 GB RAM, 2 CPU cores). Choose the EU data centre (closest to Cameroon). |
| Deploys | GitHub → Hostinger Git deploy. CI runs type-check, lint and a Lighthouse check before merge. |

---

## 3. Brand system

Taken from the live app's CSS and logo, so the site and the app match.

| Token | Value | Use |
|---|---|---|
| `night-900` | `#0f2530` | Hero, download band, footer |
| `night-800` | `#132f3a` | Dark section backgrounds |
| `teal-700` | `#163a47` | Text on light backgrounds |
| `teal-600` | `#174f60` | Primary brand colour (app `--primary`) |
| `teal-400` | `#4791a5` | Focus rings, links on dark |
| `gold-500` | `#e7ab34` | Primary CTAs, highlights |
| `gold-300` | `#efbd56` | Hover, glows |
| `mist-50` | `#f7f9fa` | Light section background (app `--background`) |
| `mist-100` | `#edf4f8` | Cards, alternate sections |
| `slate-500` | `#5b7480` | Muted text |
| Radius | 16px cards, 28px large panels, pill buttons | Same as the app (`--radius: 1rem`) |

- **Typography:** Display = **Clash Display** (or **Sora** as the Google Fonts fallback), used for confident headlines. Body = **Poppins**, as in the app. Self-hosted with `next/font` and subset to Latin + French accents.
- **Signature details:** the bolt/hex-nut motif from the logo as small ornaments; a "Punctual · Polite · Professional" ribbon; gold underline strokes on key words; soft grain over dark sections.
- **Dark and light:** the page alternates dark and light sections by design. The app screenshots in the gallery switch between the app's light and dark themes.

---

## 4. Sitemap (both languages)

Routes are `/{locale}/…`, where locale is `fr` (default, x-default) or `en`. Slugs are translated, e.g. `/fr/services/demenagement` and `/en/services/moving`.

```
/                         Home (main landing page)
/services                 All services
/services/[slug]          Service detail (one per category, see §6)
/businesses               For organisations (signage, office remodels, events, quotes)
/buildings                For residences, estates and property managers
/shop  /food              What the app offers (marketing pages that link into the app)
/become-a-pro             Pros, sellers and kitchens (same app, "I offer services")
/our-work                 Portfolio grid with filter
/our-work/[slug]          Case study
/reviews                  All testimonials + ratings
/about                    Company info, mission, team, partners/affiliations, CSR
/careers                  Open roles (CMS)
/careers/[slug]           Role detail + apply form
/blog                     Articles (20 migrated WordPress posts)
/blog/[slug]              Article
/faq                      Full FAQ
/contact                  Forms, WhatsApp, map, both offices
/download                 Smart redirect: iOS → App Store, Android → Play, desktop → QR page
/legal/privacy  /legal/terms  /legal/disclaimer
/admin                    Payload CMS (not indexed)
```

---

## 5. Home page, section by section

### 5.1 Header
- Transparent over the hero; turns into a frosted dark bar on scroll.
- Links: Services (mega-menu with icons), Businesses, Become a pro, Our work, About, Blog.
- Right side: EN | FR switch, then the gold **Get the app** pill (smart: store for the visitor's device, QR popover on desktop).
- Mobile: full-screen menu with large type and store buttons at the bottom.

### 5.2 Hero: the synced story (Concept C)
- **Background:** about 20 seconds of looping real footage (craftsman arrives → works → client smiles), under a teal-to-night gradient overlay and grain.
- **Left:**
  - Eyebrow: "Douala · Buea · Yaoundé"
  - H1 (EN): *"Help for your home, **right at home**."*
  - H1 (FR): *"Un pro chez vous, **en toute confiance**."*
  - Subhead: one sentence (book vetted pros, pay with Mobile Money, follow the job live).
  - CTAs: **Book a service** (gold, links to the web app) and **Get the app** (store badges), plus a "Watch the film ▶" link that opens the full brand film in a lightbox.
  - Trust row: 4 client avatars, ★ rating, "79+ happy clients", MoMo + Orange Money badges.
- **Right:** a 3D phone showing the real Home screen. Notifications slide in **on video timestamps** (from a cue file). They follow the app's real job lifecycle:
  1. 0:02 "Clear price received: Upholstery · 25,000 FCFA"
  2. 0:06 "Paid with MTN MoMo · held safely 🔒"
  3. 0:10 "Your verified pro is on the way · live map"
  4. 0:14 "Job finished: photos added ✓"
  5. 0:18 "Code shared · payment released · +50 points"
- **Video source:** licensed stock footage (Pexels/Mixkit, free commercial licence) of Cameroonian/West African craftspeople until your own footage is ready. Replacing it is a CMS upload plus a cue-file edit, with no code change. The app's existing `brand-intro.mp4` (720p logo sting) plays at the start of the "Watch the film" lightbox.
- **Light-data mode:** on mobile data, with data-saver on, or with reduced motion, the video is replaced by a poster image and the notifications cycle on a timer instead. The H1 is the LCP element and never waits for video.
- Scroll cue at the bottom.

### 5.3 Trusted by
Infinite marquee of the 8 partner logos (greyscale, colour on hover) plus a "Featured on Spectron Magazine" note. It pauses on hover and stops for reduced motion.

### 5.4 Services
- Title: "Everything your home or business needs."
- Bento grid: 2 large tiles (Interior & Exterior Design, Remodeling) and 9 smaller tiles (Upholstery & Furniture, Repairs & Installations, Signage, Events, Lighting, Building, Moving, Packing, Transport). Each tile has a real photo, an icon and a "From X FCFA" label.
- Two extra tiles: **Shop** and **Food** ("also in the app").
- Each tile links to its service page. A secondary CTA reads "Need something custom? Request a quote".

### 5.5 Why HandyMan (value pillars)
- The three logo values as large cards: **Punctual**, **Polite**, **Professional**, each with a short proof line.
- A "Peace of mind, built in" row of 4 trust features taken from the app:
  - **Verified pros** (ID, documents, skills)
  - **Money held until done**
  - **Live tracking + photo proof**
  - **Completion code**

### 5.6 Numbers
Animated counters on a dark band: **120+** towns & cities · **6+** years · **79+** happy clients · **38+** signature projects. All are editable in the CMS. A stylised Cameroon map lights up the served towns, starting with Douala, Buea and Yaoundé, then fanning out to the rest.

### 5.7 App showcase: pinned scroll story (centrepiece)
- The phone stays pinned while 6 chapters scroll past on the left: **Browse** ("What's on your to-do list?") → **Get a clear price** → **Pay safely** (held until done) → **Track live** → **Close with your code** → **Earn rewards**.
- The screen crossfades or slides to match each chapter, with a progress rail on the side.
- The last chapter zooms out to show **laptop + phone** together: "Book from any device. Web, iOS, Android."
- On mobile, it becomes a horizontal swipe with the same 6 chapters (no pinning).

### 5.8 How it works
Three steps with numbered ornaments and a connecting line that draws as you scroll:
1. **Choose** a service or describe your task
2. **Book & pay** securely with Mobile Money
3. **Relax & track:** follow your pro, chat, rate and earn points

### 5.9 Interactive mini-demo
A tappable phone: "Try it, no download needed." Visitors can tap a category, see the pros list and open a booking sheet. The screens are rebuilt in HTML from real app data shapes (static demo data), so they are crisp, translated and accessible. It ends with the CTA "Do it for real: open the app".

### 5.10 Screens gallery
- 3D coverflow carousel of 8 real screens, with a light/dark toggle that swaps all screenshots.
- Captions are in the current language, and the screenshots are captured in that language too.
- Supports drag, swipe and keyboard.

### 5.11 Testimonials
- Large quote slider with the 4 real reviews (N Emmanuel, Yaoundé · Richard S., Buea · Solpia Cameroon, Douala · M Lounge Exclusive, Bonaberi), each with a project photo, city and service tag.
- Shows the aggregate rating from the stores (pulled from the CMS) and a "See all reviews" link.

### 5.12 For homes / businesses / buildings
Replaces the reference template's pricing section. Three contrasting cards:
- **Homes:** book instantly, clear price first, pay with MoMo, rewards.
- **Businesses:** "My organisation" accounts, signage/events/office projects, a dedicated contact. CTA: "Request a business quote".
- **Buildings & estates:** residents join with a code; managers post notices, raise charges, follow payments and handle issue reports. CTA: "Run your building on HandyMan".

### 5.13 Earn with HandyMan
Tabbed split section (Pros · Sellers · Kitchens), each tab with its own photo:
- **Pros:** apply once, offer all your skills, set your rates and area, get paid for every completed job.
- **Sellers:** list new, refurbished or second-hand items.
- **Kitchens:** manage your menu, orders and payouts.

A mini step strip mirrors the app's real sign-up screen ("I offer services" → profile → verification → requests). CTA: "Start earning", which goes to `/become-a-pro`.

### 5.14 FAQ
Accordion of the 8 most important questions from the CMS (payments, cities covered, quotes, cancellations, guarantee, safety and vetting, pros, business accounts). Uses FAQPage structured data. Links to the full `/faq`.

### 5.15 Download band
- Dark section with a gold glow.
- Two phones (light and dark screens), App Store + Google Play badges, a QR code on desktop and an "Open web app" link.
- Text: "Get HandyMan Do IT. Free on iOS & Android."

### 5.16 Latest from the blog
Three newest posts from the CMS.

### 5.17 Footer
- Logo, the "Right at Home" tagline and the three values.
- Columns: Services · Company · Support · Legal.
- Contact: +237 652 767 674 (call/WhatsApp, every day 07:00–21:00 WAT), handymanservicesdoit@gmail.com, Technical direction: Mile 16 Shopping Mall, Buea · Office: Mobile Njo Njo, Bonapriso, Douala.
- Socials, store badges, language switch, © line.
- Floating **WhatsApp button** on every page, bottom-right, with a delay and away from the CTAs.

---

## 6. Inner pages (summary)

| Page | Key content |
|---|---|
| Services index | Filterable grid, "how pricing works", quote CTA |
| Service detail ×11 | Hero photo, what's included, "From" price, process, related work, FAQs for that service, sticky "Book in app / Get a quote" bar, Service structured data |
| Businesses | Case studies (Solpia, M Lounge), client logos, organisation features, B2B quote form |
| Become a pro | Benefits, requirements, 4-step onboarding, payout explainer, pro testimonials, application form (+ "Download the pro app") |
| Our work | Masonry portfolio, filter by service and city, before/after slider on case studies |
| About | Story (6+ years), mission, the 3 values, team (J. Batholomew, Mbeng Nkeng S., ANU Ernest), partners and affiliations, CSR policy |
| Careers | Roles from the CMS, apply form with CV upload (stored in R2) |
| Blog | Categories, search, related posts, Article structured data |
| Contact | Forms (general / quote / partnership), WhatsApp, embedded map with 2 pins, opening hours |
| Download | Detects the device and redirects; otherwise shows a page with a QR code and both store badges |

Service slugs: interior-exterior-design, upholstery-furniture, repairs-installations, remodeling, signage, events, lighting, building, moving, packing, transport.

---

## 7. CMS content model (Payload, localized EN/FR)

**Collections**
- `services`: title, slug, icon, hero image, summary, body, inclusions, fromPrice (FCFA), FAQs, related projects, SEO
- `projects`: title, service, city, client, gallery, before/after, story, featured
- `testimonials`: name, city, service, quote, photo, rating, featured
- `team`: name, role, photo, bio, order
- `partners`: name, logo, url, order
- `faqs`: question, answer, category, showOnHome
- `posts` + `categories`: blog content, author, cover, SEO
- `jobs`: title, location, type, description, open/closed
- `appScreens`: screen key, locale, theme (light/dark), image, caption. Used by the hero, the scroll story and the gallery.
- `submissions`: quote / contact / pro / job applications (read-only for editors, with email notification)
- `media`: R2-backed, alt text required and translated
- `users`: admins and editors, with roles

**Globals**
- `site`: contacts, addresses, socials, WhatsApp number, store URLs, web app URL, ratings, stats (years, projects, clients, cities)
- `navigation`: header and footer menus
- `home`: copy for every home section, hero video + poster, notification cues (text + timestamp)
- `seo`: default meta, OG image

**Editor experience:** live preview of pages, draft/publish, and a side-by-side view of both languages with a "Missing French" warning.

---

## 8. Bilingual and search engines

- **Routing and language detection:** next-intl routing. The first visit is detected from the browser's `Accept-Language` and remembered in a cookie. The language switcher keeps the visitor on the equivalent page.
- **Search tags:** `hreflang` on every page (`fr`, `en`, `x-default` → `fr`), canonical URLs, and a sitemap per language.
- **Structured data:**
  - `LocalBusiness`/`HomeAndConstructionBusiness` ×2 (Buea and Douala)
  - `MobileApplication` with store links
  - `Service`, `FAQPage`, `Article`, `Review`/`AggregateRating`, `BreadcrumbList`
- **Meta tags:** titles and descriptions written per language with local keywords (e.g. "artisan Douala", "handyman Buea", "déménagement Yaoundé").
- **Share images:** a dynamic OG image per page via `next/og`, in brand colours.
- **Redirects from the old site** (301, preserving search ranking):

| Old URL | New URL |
|---|---|
| `/index.html` | `/` |
| `/company-info.html` | `/about` |
| `/affiliations.html` | `/about#partners` |
| `/csr-policy.html` | `/about#csr` |
| `/our-works.html` | `/our-work` |
| `/reviews.html` | `/reviews` |
| `/careers.html` | `/careers` |
| `/contact-us.html`, `/blog/contact-us/` | `/contact` |
| `/disclaimer.html` | `/legal/disclaimer` |
| `/services-details.html` | `/services` |
| `/interior-exterior-design.html` | `/services/interior-exterior-design` |
| `/upholstery-funiture.html` | `/services/upholstery-furniture` |
| `/repairs-installations.html` | `/services/repairs-installations` |
| `/home-office-remodelling.html` | `/services/remodeling` |
| `/signage-signboards.html` | `/services/signage` |
| `/events-design-setup.html` | `/services/events` |
| `/blog/*` (20 WP posts) | `/blog/[slug]` (same slugs) |
| `/shop/*` (3 WooCommerce products) | App Shop (app.handymandoit.com) |

---

## 9. Performance and accessibility budgets

| Metric (mid-range Android, 4G) | Target |
|---|---|
| LCP | < 1.8 s |
| INP | < 150 ms |
| CLS | < 0.05 |
| JavaScript on first load (home) | < 170 KB gzip |
| Hero poster | < 120 KB (AVIF) |
| Lighthouse (Perf / A11y / BP / SEO) | ≥ 95 / 100 / 100 / 100 |

- **Loading:** heavy pieces (GSAP scroll story, coverflow, mini-demo) only load when they come into view. Video only loads on Wi-Fi/desktop, without data-saver.
- **Accessibility:** WCAG 2.2 AA, full keyboard navigation, visible focus, captions on the brand film, `prefers-reduced-motion` respected everywhere, contrast checked for gold on teal (gold is used for large text and buttons only).

---

## 10. Analytics and conversion events

- **Tools:** GA4 with Consent Mode v2 (bilingual cookie banner), Search Console, Google Business Profile links.
- **Events:**
  - `store_click` {store, placement}
  - `webapp_click`
  - `qr_view`
  - `whatsapp_click`
  - `call_click`
  - `quote_submit` {type}
  - `pro_apply`
  - `job_apply`
  - `lang_switch`
  - `video_play`
  - `demo_interact` {step}
  - `faq_open`
- **Campaign tracking:** UTM parameters are passed into store links (Play `referrer`, App Store campaign token) so installs can be attributed.

---

## 11. Project structure

```
handymandoit/
├─ src/
│  ├─ app/
│  │  ├─ (site)/[locale]/…        public pages
│  │  ├─ (payload)/admin/…        CMS
│  │  ├─ api/…                    forms, revalidate, og
│  │  └─ download/route.ts        smart store redirect
│  ├─ collections/  globals/      Payload schema
│  ├─ components/
│  │  ├─ sections/                Hero, Services, ScrollStory, Gallery, …
│  │  ├─ device/                  Phone, Laptop frames
│  │  ├─ demo/                    interactive mini-demo screens
│  │  └─ ui/                      Button, Badge, Accordion, Marquee, …
│  ├─ i18n/                       routing, messages (UI strings en/fr)
│  ├─ lib/                        analytics, seo, device detection
│  └─ styles/                     tokens, globals
├─ scripts/
│  ├─ migrate-wordpress.ts        imports the 20 blog posts + media
│  ├─ seed.ts                     services, team, partners, testimonials from the old site
│  └─ capture-screens.ts          Playwright: app screens at 390×844 @3x, EN/FR, light/dark
├─ public/                        favicons, store badges, fonts
└─ docs/PLAN.md
```

**Libraries:** next, payload, @payloadcms/db-postgres, @payloadcms/storage-s3, next-intl, tailwindcss, motion, gsap (ScrollTrigger), lenis, embla-carousel, sharp, zod, react-hook-form, resend (or Hostinger SMTP via nodemailer).

---

## 12. Phases and deliverables

| Phase | Deliverables | Sign-off gate |
|---|---|---|
| **0. Foundations** | Repo, Next.js + Payload + Neon + R2 wired, i18n routing, design tokens, CI, Hostinger staging deploy behind Cloudflare | Staging URL loads `/fr` and `/en`, and `/admin` works |
| **1. Content & assets** | WordPress + old-site migration scripts run, CMS seeded EN/FR, screens captured, video encoded + cue file, French copywriting | All content visible in the CMS |
| **2. Hero prototype** | Header + synced-story hero + light-data fallback, desktop + mobile | **You approve the look** before we go further |
| **3. Home page** | Sections 5.3–5.17, scroll story, gallery, mini-demo | Home is feature-complete in both languages |
| **4. Inner pages** | All pages in §6, forms → CMS + email, download redirect | Every page in §4 is live on staging |
| **5. SEO & analytics** | Structured data, sitemaps, hreflang, OG images, redirects, GA4 + consent | Rich-results test passes; events show in GA4 DebugView |
| **6. QA & launch** | Device testing (low-end Android, iPhone, desktop), Lighthouse budgets, a11y audit, content review, DNS switch, redirect verification, Search Console resubmission | Go-live |

---

## 13. Assets: what we have and what can come later

**Already secured**
- Google Play link and listing copy
- Logo and OG image
- `brand-intro.mp4` + poster (app splash)
- 5 Play Store screenshots
- The app's colour tokens and font
- All of the old site's text, photos, testimonials, team and partners
- 20 blog posts (through the WordPress REST API)

**App screens:** `scripts/capture-screens.ts` (Playwright) captures every screen reachable without logging in from app.handymandoit.com: welcome/role picker, home, services, category, shop, food, help. They are captured at 390×844 @3x in EN, FR, light and dark. The 5 Play screenshots fill gaps. Logged-in screens (tracking map, wallet, chat, completion code) are rebuilt in HTML from the real screens until real captures are available.

**None of the items below block the build.** Placeholders are used until each one arrives, and every one is swapped through the CMS.

| # | Item | Placeholder until then |
|---|---|---|
| 1 | App Store URL | iOS badge hidden; iPhones go to the web app |
| 2 | Your real job footage | Licensed stock footage |
| 3 | A demo account or logged-in screenshots | HTML-rebuilt screens |
| 4 | Play Store rating and download count | Rating row hidden until we have real numbers |
| 5 | "From" prices per service in FCFA | Label reads "Clear price before you book" |
| 6 | Logo as vector (SVG/AI/PDF) | We trace an SVG from the PNG |
| 7 | Who reviews the French copy | I write it; a native speaker reviews before launch |
| 8 | Email address for form submissions | handymanservicesdoit@gmail.com |

**Access needed only at deploy time (Phase 0, staging):** Hostinger hPanel, domain DNS (move to Cloudflare), Google Search Console/GA4, and accounts for Neon and Cloudflare R2 (free tiers).
