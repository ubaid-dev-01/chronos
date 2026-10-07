# Chronos Software Requirements Specification

**Product:** Chronos  
**Version:** 0.1.0  
**Status:** Implemented system (as of 2026-08-20)  
**Scope:** Web application, Express API, Tauri desktop agent, MongoDB data layer  

This document describes the **implemented** product, not historical intent. Features that exist only as unused code or missing credentials are listed under Remaining / blocked.

---

## 1. Product overview

Chronos is a workspace time-tracking platform for teams. Members track time from a desktop agent (with activity scoring and optional blurred screenshots) or a manual web timer. Managers see timesheets, activity, screenshots, tasks, and insights. Platform superadmins operate organizations across the service.

## 2. Goals

- Accurate, org-scoped time tracking from desktop and web.
- Screenshot evidence captured on-device with blur before upload.
- Role- and permission-gated access to team data.
- Billing via Stripe for paid plans; free plan works without Stripe.
- Invite-based team growth with seat limits.
- A production-buildable web dashboard and desktop agent.

## 3. User roles

| Role | Scope | Capabilities |
|------|--------|----------------|
| Platform superadmin | Cross-org | Login at `/admin`, list/patch orgs and users |
| Organization admin | One org | Full workspace, billing, members, API keys, timetable lock |
| Manager | One org | Team data, invites (not admin promotion), reports, insights |
| Member | One org | Own time, assigned tasks, features enabled by permissions |

Each user belongs to **exactly one** organization (email is globally unique).

## 4. Functional requirements

### 4.1 Authentication

| ID | Requirement | Status |
|----|-------------|--------|
| AUTH-1 | Email/password registration provisions org + admin | Implemented (web + API) |
| AUTH-2 | Login issues JWT access (15m) + rotating refresh (7d) | Implemented |
| AUTH-3 | Logout revokes refresh token | Implemented (web + desktop) |
| AUTH-4 | Forgot password sends 6-digit OTP; OTP is verified before password form | Implemented |
| AUTH-5 | Reset password invalidates sessions | Implemented |
| AUTH-6 | Inactive users cannot refresh; dashboard redirects to deactivated page | Implemented |
| AUTH-7 | Suspended orgs redirect to workspace-suspended | Implemented |
| AUTH-8 | Invite accept (new user) and join (existing user, same email) | Implemented |

Web login uses Next.js `/api/auth/*` (httpOnly cookies). Desktop uses Express `POST /v1/auth/login`.

### 4.2 Time tracking

| ID | Requirement | Status |
|----|-------------|--------|
| TIME-1 | Desktop agent start/pause/resume/stop with project (optional task) | Implemented |
| TIME-2 | Agent syncs batches to `POST /v1/timelogs/sync` | Implemented |
| TIME-3 | Web manual timer start/stop/restore | Implemented |
| TIME-4 | Offline tracking honors `canTrackOffline` and project `disableOfflineTracking` | Implemented (server); agent now flags offline chunks |
| TIME-5 | One running timer per user | Implemented |

### 4.3 Screenshots

Captured on the agent, blurred on-device, uploaded with sync. Gallery and timeline on web. Delete removes DB record and blob (S3 or local disk). `screenshotsEnabled` and `canDeleteScreenshots` are enforced.

### 4.4 Projects, tasks, comments, reports

CRUD for projects (manager+ create/update; admin archive). Task lists (manager+), items (members). Comments on day/timelog/screenshot/user with target validation. Timesheet preview + CSV/Excel export. Saved report configs. Weekly timetable lock (admin / `canLockTimetable`).

### 4.5 Insights

Focus score, project health, team pulse (WebSocket + buffered feed), achievements/streaks. Burnout analysis for managers (`GET /v1/ai/burnout`). All TimeLog queries are org-scoped.

### 4.6 Billing

Static plans (free/starter/pro/enterprise). Stripe checkout for paid tiers when `STRIPE_SECRET_KEY` is set; otherwise 503 with a clear error. Webhook updates org plan.

### 4.7 Public API

Org API keys (`ck_live_…`) with scopes `timelogs:read`, `projects:read`, `users:read`. Public users endpoint does **not** expose hourly rates.

### 4.8 Desktop-specific

Tray, global shortcuts (Ctrl+Shift+S/P/X), floating timer, local SQLite queue, token refresh on 401, server logout, offline flag persistence.

## 5. Non-functional requirements

- JWT HS256, secret ≥ 32 characters.
- Helmet, CORS with credentials, rate limits (auth 10/15min, API 100/min, sync 30/min).
- Zod validation on write paths; permission middleware on feature GETs.
- Screenshots stored as WebP; local HMAC URLs or S3 SSE-S3 + 1h presign.
- WebSocket requires JWT in `auth.token`; rooms are the authenticated org only.

## 6. Architecture

```
Browser ──► Next.js (apps/web)
              ├── /api/auth, /api/invites, /api/admin  → @chronos/db
              └── Bearer /v1/*                         → Express API

Desktop ──► Tauri (Rust + React)
              └── /v1/auth, /projects, /tasks/mine, /timelogs/sync, /activity/*

Express (apps/api) ──► MongoDB (@chronos/db)
                    ├── S3 or local disk
                    ├── Stripe (optional)
                    ├── Resend/SMTP (optional)
                    └── Redis (health ping only)
```

## 7. Web application

**Public:** `/`, `/features`, `/pricing`, `/download`, `/about`, `/blog`, `/careers`, `/privacy`, `/terms`  
**Auth:** `/sign-in`, `/sign-up`, `/forgot-password`, `/invite/[token]`, `/account-deactivated`, `/workspace-suspended`  
**Dashboard:** `/dashboard`, `/summary`, `/activity`, `/team`, `/projects`, `/tasks`, `/screenshots`, `/comments`, `/reports`, `/focus`, `/pulse`, `/health`, `/achievements`, `/my`, `/settings`, `/settings/members`, `/settings/billing`  
**Superadmin:** `/admin`, `/admin/users`, `/admin/organizations`

Request gate: Next.js 16 `src/proxy.ts` (session cookie, superadmin cookie, auth rate limit).

## 8. Desktop application

Tauri 2 agent. Login-only (register/invites are web). Tracking, project/task selection, settings (screenshots, notifications, sensitive keywords), sync indicator, open web dashboard.

## 9–11. Auth, authorization, database

See §3–4. Models: Organization, User, Project, TaskList, Task, TimeLog, Screenshot, Activity, Comment, Invite, PasswordReset, RefreshToken, ApiKey, Streak, SavedReport, TimetableLock, PlatformAdmin.

MongoDB has no SQL cascades; deletes are application-level (timelog delete also deletes screenshot blobs).

## 12. API architecture

Base: `/v1`. Public: health, downloads, auth, invites, Stripe webhook, public API keys. All other routes: Bearer JWT + org from token.

## 13. Entity relationships

User → Organization (orgId). Organization.ownerId → User. Project/TaskList/Task/TimeLog/Screenshot/Comment → orgId. TimeLog → Project, optional Task. Screenshot → TimeLog. Invite → Organization. Streak.userId unique globally (one org per user).

## 14. Feature matrix (summary)

Core tracking, team, projects, tasks, screenshots, reports, insights, billing checkout, invites, superadmin: **implemented**. Payroll Deel/Wise HTTP: **not exposed** (library stubs only). Redis cache helpers: unused. SSO/SAML: not implemented (marketing “coming soon”).

## 15. Navigation map

Marketing nav: Features, Pricing, Download, About, Blog, Careers. Dashboard sidebar as listed in §7, filtered by role and member permission flags. All sidebar hrefs resolve to existing pages (automated link inventory test).

## 16. Error handling

API: `{ success, error }` via `ApiError`. Web: toasts on mutations; query error banners on reports and activity. Desktop: login errors and offline banners.

## 17. Security

See SECURITY-CHECKLIST.md plus implemented JWT, RBAC, WebSocket auth, org-scoped AI queries, member read scoping, API key hashing.

## 18. Performance

Indexes on org/user/time fields. Pulse feed is in-memory (lost on restart). Redis not used as an application cache.

## 19. Testing

Vitest: API (auth smoke, permissions, billing 503, AI units, web route inventory) and DB (JWT, API keys). Production builds: API tsup, Next.js, desktop Vite. Full Playwright E2E against a live MongoDB is not in CI (requires credentials).

## 20. Deployment

Monorepo (pnpm + turbo). Web: Next.js 16. API: Node 20+ Express. Desktop: Tauri 2. Env: `.env.example`.

## 21. Environment configuration

Required: `JWT_ACCESS_SECRET` (≥32), `MONGODB_URI`, `SUPERADMIN_*` for admin panel. Optional: Stripe, AWS S3, Redis, Resend/SMTP, download URLs. `NEXT_PUBLIC_API_URL` may be origin or origin+/v1; clients normalize it.

## 22. Monitoring / logging

Morgan + in-process metrics on API health dashboard (`/` and `/health`). Winston logger. No hosted APM wired.

## 23. Future improvements

- Payroll HTTP (Deel/Wise) when vendor credentials exist.
- Redis-backed pulse feed and rate-limit store.
- Linux/macOS idle detection for AwayIdle.
- Playwright E2E in CI with a test database.
- Stripe Customer Portal and `customer.subscription.updated`.
- Multi-workspace accounts (currently one org per email).
- Native Tauri production signing / auto-update.
