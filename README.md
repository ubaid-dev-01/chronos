<div align="center">

# Chronos

**Multi-app productivity platform — API, web, desktop, mobile**

![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=flat&logo=turborepo&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white) ![pnpm](https://img.shields.io/badge/pnpm-F69220?style=flat&logo=pnpm&logoColor=white)

[Repository](https://github.com/ubaid-dev-01/chronos) · [Author](https://github.com/ubaid-dev-01) · [Portfolio](https://ubaid-dev-01.vercel.app)

</div>

---

## Overview

Chronos is a Turborepo monorepo spanning an Express API, web app, Tauri desktop shell, and React Native mobile client. Shared packages and infra live alongside apps for consistent domain models and tooling.

## Features

- pnpm + Turborepo workspace
- Express API with rate limiting
- Desktop via Tauri
- React Native mobile targets
- Shared packages + infra
- Security checklist in repo root

## Architecture

```text
apps/api       → Express HTTP API
apps/web       → Web client
apps/desktop   → Tauri + React
apps/mobile    → React Native
packages/*     → Shared libs
infra/         → Deployment / ops assets
```

## Tech stack

- Turborepo
- pnpm
- Express
- React / Vite
- Tauri
- React Native
- TypeScript
- Vitest

## Project structure

```text
chronos/
├── apps/api|web|desktop|mobile
├── packages/ infra/
└── docs/
```

## Getting started

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
```

## Environment

Copy root `.env.example`. API and clients may require additional env files under each app.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run workspace dev tasks |
| `pnpm build` / `lint` / `test` | Quality gates |
| `pnpm seed:superadmin` | Seed API superadmin |

## Documentation

| Doc | Purpose |
| --- | --- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System shape, data flow, boundaries |
| [docs/SETUP.md](docs/SETUP.md) | Local install, env, runbook |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Branching, commits, PR checklist |


## Author

**M Ubaid Javaid** — Software Engineer (MERN / Next.js)

- GitHub: [https://github.com/ubaid-dev-01](https://github.com/ubaid-dev-01)
- Portfolio: [https://ubaid-dev-01.vercel.app](https://ubaid-dev-01.vercel.app)
- Email: mubaidjavaid97@gmail.com

## License

Source is published for portfolio and engineering review. Client product ownership is not implied unless stated in a case study.

