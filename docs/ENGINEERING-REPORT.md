# Chronos Engineering Report

**Date:** 20 August 2026  
**Scope:** Web + Desktop + API + MongoDB  
**Verdict:** Core product paths are implemented end-to-end. Remaining items are external credentials, payroll HTTP surface, and CI E2E against a live database.

---

## A. Executive summary

Chronos was a substantially built time-tracking product with real APIs and UIs, not a click dummy. Several production blockers existed: reports preview mapped the wrong fields, API clients could double-prefix `/v1`, WebSockets joined any org without a token, members could list all org timelogs/screenshots, AI engines queried TimeLogs without `orgId`, desktop 401 refresh returned the expired token, settings “service toggles” faked success, and screenshot deletes left blobs on disk/S3.

Those root causes were fixed. Permission flags are now enforced on API and dashboard routes. Forgot-password OTP is verified server-side before the password form. API keys, saved reports, and timetable locks are wired. Production builds for API, Web, and desktop (Vite) succeed. Automated tests: **29 passed** (API 23, DB 6).

Cargo is not available in this environment, so a native Tauri binary was not produced. Live MongoDB/Stripe/S3 E2E was not run (no production credentials in the workspace).

---

## B. Original SRS vs actual product

No prior SRS file existed (only `SECURITY-CHECKLIST.md` and a stock Next.js README). The matrix below is the implied product vs current code.

| Requirement | Original (implied) | Actual state | Fix | Test |
|-------------|--------------------|--------------|-----|------|
| Auth register/login/logout | Required | WORKING | Desktop now revokes refresh | API smoke |
| Forgot password OTP | Required | WORKING | Server verify step added | Route + OTP verify API |
| Time tracking web + agent | Required | WORKING | Offline flag persisted | Code + existing sync |
| Reports timesheet | Required | WORKING | Mapped `employee`/`hoursWorked`/`activityScore` | Link + build |
| Screenshots | Required | WORKING | Blob delete on remove | Code |
| RBAC / permissions | Required | WORKING | Middleware + page gates | permissions.test.ts |
| Billing | Stripe | PARTIALLY_WORKING | planTier Zod; 503 without keys | billing.service.test.ts |
| Payroll Deel/Wise | Security checklist / marketing | MISSING HTTP | Not faked | Remaining |
| WebSocket presence | Team pulse | WORKING | JWT auth + org filter | Code |
| Superadmin | Required | WORKING | Proxy cookie gate | Build routes |

---

## C. Complete feature inventory (atomic)

| Feature | Platform | Status | Evidence |
|---------|----------|--------|----------|
| Homepage / marketing | Web | WORKING | Next build static routes |
| Sign up / sign in / logout | Web | WORKING | `/api/auth/*` |
| Forgot / reset password | Web | WORKING | OTP verify route |
| Invite accept / join | Web | WORKING | `/api/invites/*` |
| Dashboard overview | Web | WORKING | Hybrid DB + API |
| Summary calendar | Web | WORKING | `/v1/summary/*` |
| Activity usage | Web | WORKING | Permission + error banner |
| Team | Web | WORKING | Server Mongo aggregates |
| Projects CRUD | Web + API | WORKING | Manager create |
| Tasks | Web + Desktop read | WORKING | Member cannot create lists |
| Screenshots gallery | Web | WORKING | Scoped reads |
| Comments | Web | WORKING | Target validation |
| Reports preview/export | Web | WORKING | Field mapping |
| Saved reports | Web API | WORKING | `/v1/reports/saved` |
| Timetable lock | API | WORKING | `/v1/reports/locks` |
| Focus / pulse / health / achievements | Web | WORKING | orgId on AI queries |
| My time + web timer | Web | WORKING | TimerProvider |
| Settings org + timezone | Web | WORKING | Org timezone field |
| API keys UI | Web | WORKING | Settings page |
| Members / invites | Web | WORKING | Seat limit |
| Billing checkout | Web | PARTIALLY_WORKING | Needs Stripe keys |
| Superadmin | Web | WORKING | `/admin` |
| Agent login / track / sync | Desktop | WORKING | Token refresh on 401 |
| Agent screenshots | Desktop | WORKING | On-device blur |
| Agent logout | Desktop | WORKING | Stops tracking + revoke |
| Public REST API | API | WORKING | Rates stripped from users |
| Payroll HTTP | — | MISSING | Stubs only |
| Redis cache | API | NOT USED | Health ping only |
| Mobile app | apps/mobile | OUT OF SCOPE this pass | Separate package |

---

## D. Broken links

| Source | Destination | Problem | Fix | Test |
|--------|-------------|---------|-----|------|
| Sidebar hrefs | Dashboard pages | None found | Inventory test asserts every `href:` exists | `link-audit.test.ts` **pass** |
| Marketing nav | `/features` `/pricing` `/download` `/about` `/blog` `/careers` | None | Existing pages | Next build |
| Footer social | twitter/github/linkedin roots | Placeholder brand URLs | Left as marketing placeholders | Remaining (content) |
| Blog category pills | n/a | Decorative spans, not links | Intentional | — |

`LINK_AUDIT_REPORT` is in `docs/LINK_AUDIT_REPORT.md`.

---

## E. Broken APIs (found → fixed)

| Endpoint | Problem | Fix | Test |
|----------|---------|-----|------|
| `GET /reports/timesheet` | UI ignored `employee`/`hoursWorked` | Mapper accepts API fields | Reports page + build |
| Clients `/v1` + env `/v1` | Double prefix | `getApiOrigin()` | Code |
| `GET /timelogs`, `/screenshots` | Members saw whole org | `resolveScopedUserId` | permissions.test.ts |
| `GET /ai/burnout/:userId` | No org membership | User lookup + orgId | Code |
| WS `JOIN_ORG` | No auth, all-org presence leak | JWT handshake + org rooms | Code |
| Screenshot DELETE | Blob orphaned | `deleteScreenshot` service | Code |
| `POST /billing/checkout` | Any planTier | Zod enum paid plans | validate |
| `GET /public/users` | Exposed hourlyRate | Select without rates | Code |

---

## F. Database issues

| Model | Problem | Fix | Migration |
|-------|---------|-----|-----------|
| Organization | Timezone written but not in schema | Added `timezone` | Additive; Mongo flexible |
| SavedReport / TimetableLock | Unused | Wired to `/v1/reports/*` | None |
| Streak.userId unique globally | Conflicts if multi-org | Documented; product is one-org-per-email | None |
| Comment.targetId | No FK | Validate on create | None |
| No SQL cascades | Orphan risk | App-level screenshot blob delete | None |

---

## G. Relationship issues

| A | Rel | B | Problem | Fix | Test |
|---|-----|---|-----------|-----|------|
| User | orgId | Organization | Join invite left stale streak.orgId | Documented remaining | — |
| TimeLog | screenshots | Screenshot | Delete log left files | Delete blobs then docs | Code |
| Member | reads | TimeLog/Screenshot | Cross-user leak | Scope to self | permissions.test.ts |
| AI | TimeLog | User | Missing orgId | Added to engines | Code |

---

## H. Web issues found and fixed

- Reports preview showed Unknown / 0h.
- API URL `/v1` duplication.
- Fake settings toggles replaced with live integration status + API keys.
- OTP step skipped server verification.
- Account-deactivated client auto-redirect removed.
- Members could open restricted pages by URL; layout now redirects.
- Tasks “New list” shown to members (403 on submit); hidden unless manager.
- Notifications panel was empty; now shows pulse feed.
- Activity fetch failures were silent; error banner added.
- Superadmin routes skipped cookie check in proxy; now require cookie.
- Proxy now forwards `x-pathname` for permission gates. Next 16 build reports `ƒ Proxy (Middleware)`.

---

## I. Desktop issues found and fixed

- `refresh_tokens_if_needed` returned stale access token on 401 → always refresh.
- Logout cleared SQLite only → stop tracking + `POST /auth/logout`.
- `is_offline` always false → `network_offline` from JS online/offline + sync failures.
- `get_sync_status` stub timestamps → stored in SQLite.
- `trigger_sync` unused → called on reconnect.
- Browser preview logout now revokes refresh token.

Not fixed here: Linux/macOS idle (`get_idle_seconds` still 0 on non-Windows); Cargo/Tauri native binary not built in this environment.

---

## J. Security findings

### Critical (fixed)
- Unauthenticated WebSocket `JOIN_ORG` and unfiltered presence dump.
- Cross-org TimeLog reads in burnout/insights/focus engines.

### High (fixed)
- Members listing all org timelogs/screenshots.
- Permission flags not enforced on GET routes.
- Public API exposed hourly rates.

### Medium (fixed / remaining)
- Fixed: local screenshot blobs not deleted; checkout `planTier` unvalidated; superadmin proxy skip.
- Remaining: default `INTERNAL_EMAIL_SECRET` in development; in-memory rate limits; Redis unused so rate-limit store is per-process.

### Low
- Marketing testimonials are static (intentional).
- Footer social links are generic domains.
- Next.js `themeColor` in metadata (deprecation warning only).

---

## K. Test results

| Suite | Result |
|-------|--------|
| API Vitest (auth, permissions, billing, AI, link inventory) | **23 passed** |
| DB Vitest (JWT, API keys) | **6 passed** |
| Link inventory (sidebar vs `page.tsx`) | **pass** |
| API production build (`tsup`) | **pass** |
| Web production build (`next build`) | **pass** (Proxy wired) |
| Desktop `tsc && vite build` | **pass** |
| Desktop `cargo` / `tauri build` | **not run** (cargo missing) |
| Playwright live E2E | **not run** (needs Mongo + seeded users) |

---

## L. Remaining issues

| Item | Why blocked |
|------|-------------|
| Stripe happy-path checkout | Needs `STRIPE_SECRET_KEY` / webhook secret |
| S3 production screenshots | Needs real AWS keys (local disk works) |
| Invite/reset email in prod | Needs Resend or SMTP |
| Payroll Deel/Wise | Client classes exist; no HTTP, no vendor credentials — not faked |
| Redis cache | Connected for health only |
| Idle AwayIdle on Linux/macOS | OS idle API not implemented |
| Native desktop installer | Cargo/signing not in this environment |
| Playwright E2E | No test Mongo in CI |
| SSO/SAML | Marketing “coming soon”; not implemented |
| Multi-workspace | Email unique by design |

---

## Builds verified

- `@chronos/api` tsup CJS
- `@chronos/web` Next.js 16.2.10 (58 routes)
- `@chronos/desktop` Vite production bundle
