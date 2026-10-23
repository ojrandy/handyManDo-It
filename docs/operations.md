# Operations Runbook

Version 1.0 · 2026-10-23 · Complements [DEPLOY.md](DEPLOY.md) (first-time setup steps). This doc covers running the system: environments, configuration, releases, rollback, monitoring, backups, incidents.

---

## 1. Environments

| Env | URL | Branch | DB | Media | Who deploys |
|---|---|---|---|---|---|
| Local | http://localhost:3000 | any | docker Postgres 17 | local `/media` | developer |
| CI | — | PR / `main` | service Postgres 17 | — | GitHub Actions |
| Staging | Hostinger temp URL (later `staging.handymandoit.com`) | `main` | Neon branch `staging` | R2 via r2.dev | Hostinger Git deploy |
| Production | https://handymandoit.com | `main` (tagged release) | Neon `main` branch | R2 via `media.handymandoit.com` | Hostinger Git deploy, after approval |

> Until there are two Hostinger apps, staging *is* the only deployed environment. Production cut-over follows the go-live checklist in [quality-assurance.md](quality-assurance.md) §7.

## 2. Configuration (environment variables)

| Variable | Required | Scope | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | ✅ | public, build-time | Origin, no trailing slash. Used for `metadataBase`, Payload `serverURL`, sitemap |
| `DATABASE_URL` | ✅ | server | Neon **pooled** string with `sslmode=require` |
| `PAYLOAD_SECRET` | ✅ | server | 32+ random bytes, unique per env. Rotating it invalidates sessions |
| `S3_BUCKET` | ✅ (staging/prod) | server | Empty ⇒ local disk (dev only) |
| `S3_ENDPOINT` | ✅ with bucket | server | `https://<account-id>.r2.cloudflarestorage.com` |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | ✅ with bucket | server | R2 token scoped to the one bucket, Object R/W |
| `MEDIA_PUBLIC_URL` | ✅ with bucket | server + `next.config` | Public media origin; also feeds `images.remotePatterns` (build-time) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | ✅ (prod) | server | Empty host ⇒ emails logged to console |
| `EMAIL_FROM` | ✅ | server | Sender address; must be authorised by SPF/DKIM of the SMTP provider |
| `NEXT_PUBLIC_GA_ID` | ⬜ planned | public | GA4 measurement ID |
| `NEXT_TELEMETRY_DISABLED` | optional | build | `1` in CI |

Rules: `.env` is gitignored; `.env.example` lists every variable with a comment — update it in the same PR that introduces a variable. Never put secrets in `NEXT_PUBLIC_*`. `NEXT_PUBLIC_*` and `MEDIA_PUBLIC_URL` are read at **build** time → change them, then **rebuild**.

## 3. Build and start

| Step | Command (Hostinger settings) |
|---|---|
| Node | 24.x |
| Install | `npm ci` |
| Build | `npm run build` (heap capped at 3072 MB) |
| Start | `npm run start:prod` → `payload migrate` then `next start` |

If the build OOMs on Hostinger, build in GitHub Actions and deploy the artefact (DEPLOY.md §4). **Ask before changing the deploy flow.**

## 4. Release process

1. Feature branches → PR → CI green → review (Gate A + B) → merge to `main`.
2. `main` auto-deploys to **staging**. Smoke test (§4.1).
3. For production: confirm phase gate / approval, create a git tag `vYYYY.MM.DD-n`, record it in the tracker change log, deploy.
4. Post-deploy smoke test on production; watch logs for 30 min.

### 4.1 Smoke test (5 minutes)
- [ ] `/` redirects to `/fr` (French browser) / `/en` (English browser)
- [ ] `/fr` and `/en` home load, no console errors
- [ ] One page per template loads in both locales
- [ ] `/admin` login works; edit a harmless field, publish, see it live within 10 s, revert
- [ ] One image from R2 renders
- [ ] A form submits and the email arrives
- [ ] `/download` behaves per device; 2 legacy redirects return 301

## 5. Rollback

| Situation | Action |
|---|---|
| Bad code, no schema change | Redeploy the previous tag/commit in Hostinger (or `git revert` on `main` and push). |
| Bad migration | Stop the app → restore Neon to the branch/point-in-time taken before the deploy → redeploy previous tag. **Always** create a Neon branch before deploying a migration that drops/renames anything. |
| Bad content | Payload versions: restore the previous version of the doc in `/admin`. |
| Media deleted | R2 has no versioning by default → keep originals of brand-critical media (hero video, logos) in a separate backup folder/bucket. |
| Cloudflare misconfig | Revert the setting; as last resort set DNS records to "DNS only" (grey cloud). Never touch the `app` record. |

## 6. Monitoring and alerting

| What | Tool | Threshold / action |
|---|---|---|
| Uptime `/fr`, `/en`, `/admin/login` | UptimeRobot / Better Stack (free) | Alert by email + WhatsApp after 2 failed checks |
| Server errors | Hostinger logs (+ Sentry if ADR-011 accepted) | Any 5xx spike → investigate |
| Core Web Vitals | Search Console CWV + GA4 web-vitals events | Any URL group "Poor" → ticket |
| SEO coverage | Search Console | New 404s → add redirect; indexing drops → investigate |
| Forms | Weekly check of `submissions` vs inbox | Mismatch → check SMTP |
| DB | Neon dashboard | Storage > 80 % of plan, connection errors |
| R2 | Cloudflare dashboard | Storage > 8 GB (free tier 10 GB) |
| Dependencies | `npm audit`, Dependabot | High/critical → patch within 7 days |

## 7. Backups and data retention

- **Neon:** point-in-time restore (window depends on plan; free = short). Before each production migration, create a named branch `pre-<tag>`. Monthly `pg_dump` to secure storage (owner-held).
- **R2:** originals of key assets kept outside the bucket. Consider a second bucket sync monthly.
- **Code:** GitHub is the source of truth; tags per release.
- **Submissions:** retained ≤ 24 months, then deleted (manual quarterly task until automated) — NFR-PRIV-01.

## 8. Incident response

1. **Detect** (alert, user report). Note time.
2. **Assess severity** (S1–S4, quality-assurance.md §6). S1 → owner informed immediately.
3. **Mitigate first:** rollback (§5) or Cloudflare "Under attack"/cache. Restore service before root-causing.
4. **Communicate:** WhatsApp/status note to owner; site banner if public-facing for > 30 min.
5. **Fix** root cause on a branch → normal review → deploy.
6. **Postmortem** (S1/S2) within 48 h in the tracker: timeline, impact, root cause, actions with owners. Blameless.

## 9. Routine maintenance

| Cadence | Task |
|---|---|
| Weekly | Review submissions, 404s, uptime; check form email delivery |
| Monthly | Dependency updates (patch/minor) on a branch with full gate; Neon dump; review CWV |
| Quarterly | Payload/Next minor upgrades (read changelogs, test migrations on Neon branch); purge old submissions; rotate R2/SMTP credentials; review admin users |
| Yearly | Domain renewal, Hostinger plan, licence review (fonts, stock footage) |

## 10. Access register

Keep owner-controlled (not in this repo): Hostinger hPanel, Cloudflare account, domain registrar, Neon, R2 tokens, SMTP, GA4/Search Console, GitHub admin, Payload admin users. Each with at least two owners and MFA enabled.
