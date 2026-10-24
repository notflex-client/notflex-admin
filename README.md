# Notflex Admin

Admin dashboard for **Notflex**, a subscription-based movie streaming platform.
Built with Nuxt 4 and [Nuxt UI](https://ui.nuxt.com) on top of the Go backend.

**Live demo:** https://notflex-admin.vercel.app (admin account required)

Related repositories:

- [notflex-client-api](https://github.com/notflex-client/notflex-client-api) – Go backend
- [notflex-client](https://github.com/notflex-client/notflex-client) – customer web app

## Features

- **Login** restricted to users with the `admin` role; a global route middleware validates the token, loads the profile and signs out non-admins
- **Dashboard**: total titles, users and active subscriptions, 30-day revenue, revenue chart with period / date-range filters
- **Titles**: create and edit movies and series, poster and video upload, episodes manager, subtitle and audio-track manager
- **Users**: list, edit role / status, delete
- **Genres, Tags, Plans, Banners**: full CRUD with modal forms validated by Zod
- **Payments**: transaction list from Stripe checkouts
- **Settings**: general, members, notifications, security
- 401 handling: expired tokens clear the session and redirect to login

## Tech stack

| | |
|---|---|
| Framework | Nuxt 4, Vue 3, TypeScript |
| UI | Nuxt UI 4, Tailwind CSS 4, Lucide icons |
| Tables | TanStack Table |
| Charts | Unovis |
| Validation | Zod |
| Tooling | pnpm, ESLint, vue-tsc, Renovate |
| CI | GitHub Actions – lint and typecheck on every push |

## Project structure

```
app/
  views/            Home, Titles, Users, Genres, Tags, Plans, Banners, Payments, Settings/*
  components/       EpisodesManager, TracksManager, home/ charts and stats, UserMenu, ...
  composables/      useApi (fetch wrapper with bearer token + 401 handling), useAuth, useDashboard
  middleware/       auth.global.ts
  layouts/          default dashboard shell with collapsible sidebar
.github/workflows/  ci.yml
```

## Getting started

```bash
pnpm install
cp .env.example .env          # NUXT_PUBLIC_API_URL=http://localhost:3000
pnpm dev                      # http://localhost:3000
```

Checks:

```bash
pnpm lint
pnpm typecheck
```

Production build:

```bash
pnpm build
pnpm preview
```

## Author

Vu Nhat Minh – [github.com/MinhNhat232](https://github.com/MinhNhat232)
