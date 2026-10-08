# Architecture — Chronos

## Intent

Chronos is a Turborepo monorepo spanning an Express API, web app, Tauri desktop shell, and React Native mobile client. Shared packages and infra live alongside apps for consistent domain models and tooling.

## System shape

```text
apps/api       → Express HTTP API
apps/web       → Web client
apps/desktop   → Tauri + React
apps/mobile    → React Native
packages/*     → Shared libs
infra/         → Deployment / ops assets
```

## Stack decisions

- Turborepo
- pnpm
- Express
- React / Vite
- Tauri
- React Native
- TypeScript
- Vitest

## Boundaries

- Secrets stay in environment variables / secret managers — never in git.
- Client bundles only receive public configuration (`NEXT_PUBLIC_*` / `VITE_*`).
- Tenant or role checks belong in middleware / server layers, not UI-only gates.
- Heavy or long-running work should not run inside short-lived serverless handlers unless designed for it.

## Quality bar

- Prefer typed contracts at API and domain boundaries.
- Ship a vertical slice (auth → persisted outcome) before a broad feature surface.
- Document trade-offs in PRs when changing data models or auth.

