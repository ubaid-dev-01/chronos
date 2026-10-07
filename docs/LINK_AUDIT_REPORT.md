# LINK_AUDIT_REPORT

Generated from filesystem inventory of `apps/web/src/app/**/page.tsx` and `apps/web/src/components/layout/sidebar.tsx`.  
Test: `apps/api/src/routes/link-audit.test.ts` — **passed** (2026-08-20).

## Method

1. Walk every `page.tsx` and derive the URL (strip route groups).
2. Extract `href: "/..."` entries from the dashboard sidebar.
3. Assert every sidebar destination exists as a page.
4. Confirm marketing destinations in `nav-links.ts` exist as static pages (manual + Next build).

Live HTTP crawl (404/500/console) was not executed against a running stack (no Mongo in this session). Next.js production build generated all listed routes without missing-page errors.

## Sidebar destinations

| Source | Destination | Status | Error | Fix |
|--------|-------------|--------|-------|-----|
| Sidebar | `/dashboard` | OK | | |
| Sidebar | `/summary` | OK | | |
| Sidebar | `/activity` | OK | Permission-gated | |
| Sidebar | `/team` | OK | | |
| Sidebar | `/projects` | OK | | |
| Sidebar | `/tasks` | OK | Permission-gated | |
| Sidebar | `/screenshots` | OK | Permission-gated | |
| Sidebar | `/comments` | OK | Permission-gated | |
| Sidebar | `/reports` | OK | Permission-gated | |
| Sidebar | `/focus` | OK | Permission-gated | |
| Sidebar | `/pulse` | OK | Permission-gated | |
| Sidebar | `/health` | OK | Permission-gated | |
| Sidebar | `/achievements` | OK | Permission-gated | |
| Sidebar | `/my` | OK | | |
| Sidebar | `/settings` | OK | Admin only | |
| Sidebar | `/settings/members` | OK | Admin/manager | |
| Sidebar | `/settings/billing` | OK | Admin only | |

## Marketing / auth

| Source | Destination | Status | Notes |
|--------|-------------|--------|-------|
| Nav | `/features` `/pricing` `/download` | OK | |
| Company | `/about` `/blog` `/careers` | OK | |
| Legal | `/privacy` `/terms` | OK | |
| Auth | `/sign-in` `/sign-up` `/forgot-password` | OK | |
| Auth | `/invite/[token]` | OK | Dynamic |
| Auth | `/account-deactivated` `/workspace-suspended` | OK | |
| Admin | `/admin` `/admin/login` `/admin/users` `/admin/organizations` | OK | Cookie gated |

## Remaining non-404 items

| Source | Destination | Problem | Fix | Test |
|--------|-------------|---------|-----|------|
| Footer social | `https://twitter.com` etc. | Generic brand placeholders | Replace with real Chronos profiles when they exist | Content |
| Blog category pills | none | Not links | Decorative | — |
