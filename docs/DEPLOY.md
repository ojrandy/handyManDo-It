# Deploying to Hostinger (Node.js Web App)

Architecture (see [PLAN.md §2](PLAN.md#2-hosting-constraints-and-how-we-handle-them)):

```
Visitor → Cloudflare (DNS, cache, TLS) → Hostinger Node.js app (Next.js + Payload)
                                            ├─ Neon Postgres (CMS data, AWS us-east-1, ADR-013)
                                            └─ Cloudflare R2 (media, video)
```

## 1. One-time setup

### GitHub (branch protection, T-0.14)
Do this after the first PR with the full CI (typecheck, lint, migrate, int, build, e2e) has run green, so the `check` job can be selected.
1. Decide the repository visibility: **Settings → General → Danger Zone → Change visibility**. Private is recommended for a client codebase. Branch protection on a private repo needs GitHub Pro/Team; on the Free plan, either keep it public or skip protection and rely on the PR habit.
2. **Settings → Branches → Add branch ruleset** (or *Add classic branch protection rule*), target `main`:
   - Require a pull request before merging (approvals: 0 while there is one developer, 1 when there are two)
   - Require status checks to pass → add **`check`**; require branches to be up to date
   - Block force pushes; restrict deletions
   - Do **not** allow bypass, except the owner for emergencies
3. Check: a direct `git push origin main` is rejected.

### Neon (database, T-0.15)
The project already exists in **AWS us-east-1** (owner decision 2026-10-23; pages are pre-rendered, so the cross-Atlantic latency mostly affects the CMS admin). The default branch (`main`, or `production` in older projects; database `neondb`) becomes **production**; staging gets its own branch so tests and client review never touch production data.
1. Neon console → project → **Branches → Create branch**: name `staging`, parent = the default branch, **Current data**. The default branch is still empty, so staging starts empty too.
2. Branch `staging` → **Connect** → database `neondb`, role `neondb_owner`, **Connection pooling on**. Copy the string: its host contains `-pooler` and it ends in `sslmode=require`.
3. Put that string **only** into the Hostinger env vars of the staging app (`DATABASE_URL`). Never in a local `.env`: local dev schema-pushes to whatever it points at.
4. Optional, recommended: **Settings → Compute** for `staging`: scale-to-zero after 5 min (free tier default) is fine; the first admin request after idle takes ~1 s.
5. Production at launch: same steps on the default branch, then rotate the `neondb_owner` password (**Roles → Reset password**), because the current one has been in local files.

If `payload migrate` ever fails on start with a pooler error (e.g. prepared statements), deploy once with the **direct** (non-`-pooler`) string, then switch back.

### Cloudflare R2 (media)
1. Dashboard → **Storage & databases → R2 object storage**. The first time, Cloudflare asks for a payment method. The free tier (10 GB storage, no egress fees) covers this site.
2. **Create bucket**: name `handymandoit-media`, location **Automatic** with hint **Western Europe**, default storage class **Standard**.
3. Bucket → **Settings → Public access**:
   - Now: enable the **R2.dev subdomain** (rate-limited; fine for staging). Copy the `https://pub-….r2.dev` URL.
   - At launch (domain on Cloudflare): **Custom domain** → `media.handymandoit.com`, then turn off R2.dev.
4. Bucket → **Settings → CORS policy**:
   ```json
   [{ "AllowedOrigins": ["http://localhost:3000", "https://handymandoit.com", "https://www.handymandoit.com"],
      "AllowedMethods": ["GET", "HEAD"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 86400 }]
   ```
5. R2 overview → **Manage API tokens → Create Account API token**: permission **Object Read & Write**, applied to **`handymandoit-media` only**. Copy the **Access Key ID** and **Secret Access Key** (the secret is shown once), plus the **S3 endpoint** `https://<account-id>.r2.cloudflarestorage.com`.
6. Create a second bucket **`handymandoit-private`** for CV uploads. Do **not** enable public access or a custom domain on it. Add it to the API token from step 5.
7. Set `S3_BUCKET`, `S3_PRIVATE_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` and `MEDIA_PUBLIC_URL` (the r2.dev URL, or `https://media.handymandoit.com` later).

### Hostinger
1. hPanel → **Websites → Add website → Node.js Web App**. Choose the EU data centre.
2. Connect the GitHub repository and choose the `main` branch.
3. Settings:
   - Node version: **24.x**
   - Install: `npm ci`
   - Build: `npm run migrate && npm run build`. The home page reads Payload while it is pre-rendered (T-1.15), so the schema must be current **before** the build; on a fresh database the build would otherwise fail on missing tables. Migrations are additive by rule (data-model.md §6), so the running app keeps working if the build then fails.
   - Start: `npm run start:prod` (runs pending DB migrations, a no-op after the build step, then starts)
4. Environment variables (hPanel → app → **Environment variables**). They must exist **before the first build**: `NEXT_PUBLIC_SITE_URL` and `MEDIA_PUBLIC_URL` are baked in at build time, and so are the HSTS/CSP headers.

   | Variable | Staging value |
   |---|---|
   | `NEXT_PUBLIC_SITE_URL` | The Hostinger temporary URL, `https://…`, no trailing slash |
   | `DATABASE_URL` | Neon `staging` pooled string (above) |
   | `PAYLOAD_SECRET` | New value: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Never reuse the local one |
   | `S3_BUCKET`, `S3_PRIVATE_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `MEDIA_PUBLIC_URL` | **Leave unset** until R2 is set up (ADR-014): uploads go to local disk and may be lost on redeploy |
   | `SMTP_HOST` … `EMAIL_FROM` | Leave `SMTP_HOST` unset for now (emails go to the log); `EMAIL_FROM` = `handymanservicesdoit@gmail.com` |
   | `NEXT_TELEMETRY_DISABLED` | `1` |

### First deploy and Phase 0 gate (T-0.17)
1. Trigger the deploy (hPanel **Deploy**, or merge to `main`). In the build log, expect `✓ Compiled successfully` and the route table with `● /fr`, `● /en`. If the build runs out of memory, see §4.
2. In the runtime log, expect Payload's migration output (`20261023_172405_initial` ran, then `Done.`) before Next.js reports it is ready. Start-up time with migrations is well under the 120 s request cap.
3. **Immediately** open `https://<staging>/admin` and create the real admin account (the first account becomes admin). Use a password manager; record the account in operations.md §10 (access register).
4. From your machine, run the public smoke suite against staging:
   ```bash
   E2E_BASE_URL=https://<staging-url> npm run test:smoke
   # add E2E_CHANNEL=chrome if Playwright's Chromium is not installed
   ```
   It checks the `/` redirect, `/fr` and `/en` (200, `lang`, H1), the localized 404, the language switcher and the security headers.
5. In `/admin`: log in, open **Site settings**, save once (checks DB writes), log out.
6. Gate passed → mark T-0.17 ✅ and Phase 0 ✅ in the tracker with the date and the staging URL.

### Domain (Cloudflare DNS + CDN)
Moving DNS doesn't change where anything points, as long as every record is copied. **`app.handymandoit.com` is the live app and must keep working.**

1. Dashboard → **Account home → Add a domain** → `handymandoit.com` → **Free** plan.
2. Cloudflare imports the existing DNS records. **Before continuing**, compare them with the current DNS zone at your registrar or Hostinger hPanel, record by record:
   - `@` and `www`: the current (old) site; keep them as they are until launch
   - `app`: the web app. Use **DNS only (grey cloud)** if the app's host issues its own SSL certificate
   - `MX`, `TXT` (SPF/DKIM/verification), `CNAME`s for any mail or verification: copy exactly
3. Cloudflare shows two nameservers. At the domain registrar, replace the current nameservers with these two. Propagation usually takes under an hour, at most 24 h.
4. Once the domain is **Active**:
   - **SSL/TLS → Overview**: **Full (strict)**
   - **SSL/TLS → Edge Certificates**: Always Use HTTPS **on**; Minimum TLS **1.2**
   - **Speed → Settings**: HTTP/3 **on**, Early Hints **on**
   - **Caching → Configuration**: Browser Cache TTL **Respect existing headers**
   - **Caching → Cache Rules → Create rule** "HTML pages": when *Hostname* equals `handymandoit.com` **and** URI path does not start with `/admin`, `/api` or `/download` → **Eligible for cache**; Edge TTL **Ignore cache-control header, use this TTL: 5 minutes**; Browser TTL **Bypass cache**. Next.js sends `s-maxage=31536000` for pre-rendered pages, so without this rule CMS edits could stay hidden at the edge for a year (risk R-07).
5. **At launch:** point `@` and `www` at the Hostinger Node.js app (the A/CNAME values hPanel gives you), **proxied (orange cloud)**. Then add the R2 custom domain `media.handymandoit.com`.

## 2. Database migrations

Locally, Payload syncs the schema to the dev database automatically. Production uses migrations:

```bash
npm run migrate:create   # after changing collections/globals; commit src/migrations/*
npm run migrate          # runs automatically on the server via `npm run start:prod`
```

## 3. Each deploy

Push to `main`. CI type-checks, lints and builds, then Hostinger pulls, builds and restarts the app.

## 4. If the build runs out of memory on Hostinger

The Business plan has 3 GB RAM, and `npm run build` caps the Node heap at 3 GB. If Hostinger's build still fails, build in GitHub Actions instead and deploy the result. Ask before changing this; it changes the deploy flow.
