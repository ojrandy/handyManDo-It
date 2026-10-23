# Deploying to Hostinger (Node.js Web App)

Architecture (see [PLAN.md §2](PLAN.md#2-hosting-constraints-and-how-we-handle-them)):

```
Visitor → Cloudflare (DNS, cache, TLS) → Hostinger Node.js app (Next.js + Payload)
                                            ├─ Neon Postgres (CMS data, EU region)
                                            └─ Cloudflare R2 (media, video)
```

## 1. One-time setup

### Neon (database)
1. Project: the existing one in **AWS us-east-1** (owner decision 2026-10-23; pages are pre-rendered, so the cross-Atlantic latency mostly affects the CMS admin).
2. Create the database `handymandoit` and copy the **pooled** connection string (it ends in `?sslmode=require`).

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
6. Set `S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` and `MEDIA_PUBLIC_URL` (the r2.dev URL, or `https://media.handymandoit.com` later).

### Hostinger
1. hPanel → **Websites → Add website → Node.js Web App**. Choose the EU data centre.
2. Connect the GitHub repository and choose the `main` branch.
3. Settings:
   - Node version: **24.x**
   - Install: `npm ci`
   - Build: `npm run build`
   - Start: `npm run start:prod` (runs pending DB migrations, then starts)
4. Environment variables: everything in [.env.example](../.env.example), filled in with the Neon and R2 values, a fresh `PAYLOAD_SECRET`, and the public `NEXT_PUBLIC_SITE_URL`.

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
