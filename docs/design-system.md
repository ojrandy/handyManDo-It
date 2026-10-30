# Design System

Version 1.0 · 2026-10-23 · Tokens live in `src/app/(site)/globals.css` (`@theme`). This doc explains how to use them. If the two disagree, the CSS wins and this doc gets fixed.

The site must read as **the same product as the app** (app.handymandoit.com): same colours, same body font, same radius language.

---

## 1. Brand principles

1. **Trust before flair.** Every section answers "why can I trust this?" (verified pros, money held, live tracking, completion code).
2. **Show the real app.** Real screens, real lifecycle, real places (Douala, Buea, Yaoundé).
3. **Local and warm.** Cameroonian people and places, FCFA prices, Mobile Money badges.
4. **Fast on a cheap phone.** If an effect costs performance on a mid-range Android, it's optional.

Voice: confident, warm, plain. Short sentences. No jargon. Tagline "Right at Home"; values **Punctual · Polite · Professional** (FR: **Ponctuel · Poli · Professionnel**).

## 2. Colour tokens

| Token (Tailwind) | Hex | Use |
|---|---|---|
| `night-950` | `#0a1c25` | Deepest shadows, overlays |
| `night-900` | `#0f2530` | Hero, download band, footer, `theme-color` |
| `night-800` | `#132f3a` | Dark section backgrounds |
| `teal-700` | `#163a47` | Headings/text on light backgrounds |
| `teal-600` | `#174f60` | Primary brand colour (app `--primary`) |
| `teal-500` | `#1c5d70` | Gradients, hover on teal |
| `teal-400` | `#4791a5` | Focus rings, links on dark |
| `gold-500` | `#e7ab34` | Primary CTAs, highlights |
| `gold-400` | `#ebb445` | Intermediate hover |
| `gold-300` | `#efbd56` | Hover, glows, eyebrow text on dark |
| `mist-50` | `#f7f9fa` | Page background (app `--background`) |
| `mist-100` | `#edf4f8` | Cards, alternate sections |
| `mist-200` | `#dfe8eb` | Borders, dividers on light |
| `slate-500` | `#5b7480` | Muted text on light |
| `ink` | `#183d49` | Default body text |
| `danger` | `#b3261e` | Form errors only (6.5:1 on white) |

**Contrast rules (WCAG 2.2 AA):**
- Body text: `ink` on `mist-50`, `white` or `white/75` on `night-900`. Muted text ≥ 4.5:1.
- `gold-500` text is for **large text (≥ 24 px, or ≥ 18.66 px bold) and buttons on dark** only. Gold buttons use `night-900` text.
- Never put `gold-*` text on `mist-*` backgrounds.
- `white/50` is decoration only (e.g. the values line), never essential info. Verify any new pairing with a contrast checker and note it in the PR.

## 3. Typography

| Role | Font | Token | Weights |
|---|---|---|---|
| Display (h1–h4) | **Sora** (`next/font/google`, self-hosted) | `font-display` | 500–800 |
| Body / UI | **Poppins** (same as app) | `font-sans` | 400–700 |

Subsets: `latin`, `latin-ext` (French accents). `display: swap`. Headings get `letter-spacing: -0.02em` and `text-wrap: balance` globally.

Scale (mobile → desktop): H1 `text-5xl → text-7xl`, leading 1.05 · H2 `text-3xl → text-5xl` · H3 `text-xl → text-2xl` · body `text-base`/`text-lg`, leading relaxed · eyebrow `text-sm uppercase tracking-[0.2em] text-gold-300`.

French strings run ~15–25 % longer than English: design every heading and button to survive the French version at 360 px.

## 4. Space, layout, shape

- Container: `container-site` utility — max 80 rem, 1 rem gutters (2 rem ≥ 768 px).
- Section rhythm: `py-20 md:py-28`; alternate dark (night) and light (mist) sections by design.
- Radius: `rounded-card` 1 rem (cards, inputs), `rounded-panel` 1.75 rem (large panels), `rounded-full` (buttons, pills, badges).
- Shadows: `shadow-float` (devices, floating cards), `shadow-glow` (gold CTAs only).
- Breakpoints: Tailwind defaults; design mobile-first at **360 / 390 px**, then 768, 1024, 1280.
- Texture: `grain` utility on dark sections.

## 5. Motion

| Token / rule | Value |
|---|---|
| Easing | `ease-out-expo` = `cubic-bezier(0.16, 1, 0.3, 1)` |
| Durations | micro 150 ms · UI 250 ms · section reveals 600–800 ms |
| Libraries | CSS first; `motion` for component transitions; scroll story uses CSS `sticky` + IntersectionObserver, no GSAP (ADR-021); `lenis` optional smooth scroll (off under reduced motion) |
| Reduced motion | Global CSS already neutralises animations. Components must also **branch logic**: no pinning, no autoplay video, no marquee, counters show final numbers, carousels don't auto-advance |
| Performance | Animate `transform`/`opacity` only. No layout-thrashing scroll handlers; use IntersectionObserver |

## 6. Components (inventory)

Status: ✅ built · ⬜ planned. Location `src/components/ui` unless noted.

| Component | Status | Notes |
|---|---|---|
| LanguageSwitcher | ✅ | Pill group, `aria-pressed`, keeps equivalent page: follows the page's hreflang alternate when there is one (translated slugs, ADR-025), else the same route and params |
| Button | ✅ | `buttonClasses({ variant, size })` helper (`ui/button.ts`) applied to `Link`, `<a>`, `<button>` and popover triggers; variants `primary` (gold pill), `secondary` (outline on dark), `ghost` (no horizontal padding, aligns with copy); sizes sm/md/lg, min height 44 px; never a `<div>`. Light-background variants come with the first light section |
| StoreBadges | ✅ | Official Google Play badge per locale (`public/badges`, unaltered); App Store hidden while `appStoreUrl` is empty. `store_click` event in Phase 5 |
| GetTheApp | ✅ | Server wrapper renders the QR SVG; client button: Android → Play, iOS → App Store or web app, desktop → native `popover` with QR. Plain Play link before hydration / without JS |
| Badge / PaymentBadges | ✅ | Text pills with brand-colour dots (no third-party logos until licensed) |
| Accordion | ✅ (native `<details>`, `FaqList`, used by `FaqTeaser` and service pages) | Native `<details>` or ARIA disclosure; fires `faq_open` |
| Tabs | ✅ (`EarnTabs`) | ARIA tabs pattern with arrow-key nav |
| Marquee | ✅ (CSS, `TrustedBy`) | Pause on hover/focus; static under reduced motion |
| Counter | ✅ | Animates on view; final value in DOM for SR/no-JS |
| Dialog / Lightbox | ✅ | Native modal `<dialog>` (focus contained, Esc closes), focus returned to trigger, backdrop click closes; `FilmLightbox` video `preload="none"`. Captions pending transcript |
| Carousel | ✅ scroll-snap + `CarouselControls` (no embla needed so far) | Keyboard + swipe; visible controls |
| WhatsAppFab | ✅ (#128C7E for 3:1 icon contrast) | Bottom-right, delayed, safe-area aware |
| Form fields | ✅ | `forms/SiteForm`: label always visible (required `*` hidden from screen readers, `aria-required` instead; “(optional)” otherwise), error text in `danger` linked with `aria-describedby`, `aria-live` summary with the count, focus on the first invalid field, success panel (`role=status`) takes focus. `forms/ContactForms`: radio pills pick the contact form (`?type=quote&service=` or `#quote` preselect) |
| JsonLd | ✅ | `<script type="application/ld+json">` server component; escapes `<` |
| Breadcrumbs | ✅ | `nav` with `aria-label`, ordered list, last crumb `aria-current="page"` (text, not a link); emits BreadcrumbList. Styled for the dark page hero |
| FilterableGrid | ✅ | Filter groups (one labelled `role="group"` each) of toggle buttons (`aria-pressed`); a group with fewer than two options is hidden; result count in a polite live region; all items visible without JS. No motion. Grid or masonry (`listClassName`) |
| ProjectCard | ✅ | Whole card is the link; cover at its own aspect ratio (masonry), title, service, city |
| BeforeAfter | ✅ | Native range input over two photos (arrows/Home/End, labelled); focus ring on the figure; no animation |
| ServiceCard | ✅ | Whole card is the link; photo (`CmsImage`) or the service icon on a dark tile; title, summary, price label |
| Prose | ✅ | Payload Lexical `RichText` with the site type scale (light backgrounds) |
| device/Phone, device/Laptop | Phone ✅ · Laptop ⬜ | CSS frame with `overlay` slot; `AppScreenImage` fills it with a captured `app-screens` image (page language, theme), `AppHomeScreen` (HTML recreation) is the fallback while none is captured |
| sections/* | Header, Hero, TrustedBy, ServicesBento, Pillars, Numbers, HowItWorks, Testimonials, Audiences, Earn, FaqTeaser, DownloadBand, Footer ✅ · inner pages: PageHero (dark: breadcrumbs, H1, lead, actions, optional photo preloaded), CtaBand (book in app + quote), PricingExplainer, FeatureSplit (checklists beside a captured app screen), AppOfferPage (Shop/Food), CardGrid (heading + cards or numbered steps on a light band) ✅ | Hero, TrustedBy, ServicesBento, Pillars, Numbers, ScrollStory, HowItWorks, MiniDemo, ScreensGallery, Testimonials, Audiences, EarnTabs, FaqTeaser, DownloadBand, LatestPosts, Header, Footer |

**Component rules**
1. Server Component unless it needs interactivity; client logic in the smallest possible child.
2. All text via props from CMS or `useTranslations`/`getTranslations` — no literals.
3. Accept `className` for composition; merge, don't replace.
4. Every interactive component documented with: keyboard behaviour, ARIA, reduced-motion behaviour, analytics event.

## 7. Imagery and iconography

- Photography: real Cameroonian/West African people and places; licensed stock (Pexels/Mixkit) until own footage. Alt text mandatory, localized.
- App screens: from `appScreens` collection, matching locale and theme.
- Icons: one consistent line icon set (e.g. Lucide), 1.5–2 px stroke, `aria-hidden` when decorative.
- Logo: `public/brand/logo.jpg` until an SVG is traced; bolt/hex-nut motif as ornaments.
- Formats: AVIF/WebP for photos, SVG for icons/logos, MP4 H.264 + WebM for video with poster.

## 8. Accessibility checklist (per component/section)

- [ ] Semantic element (`button`, `a`, `nav`, `section` with heading)
- [ ] Keyboard: reachable, operable, logical order, no traps (except dialogs)
- [ ] Visible focus (`:focus-visible` teal-400 ring, global)
- [ ] Name/role/state exposed (labels, `aria-expanded`, `aria-pressed`, `aria-current`)
- [ ] Contrast verified
- [ ] Reduced-motion behaviour defined and tested
- [ ] Touch targets ≥ 44×44 px
- [ ] Works at 200 % zoom and 360 px width
- [ ] `lang` attribute correct for mixed-language snippets
