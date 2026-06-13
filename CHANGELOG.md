# Changelog

Major changes to PegaBao, newest first. Format: `type: what changed — folder(s)`.
Types: **add** (new), **change** (modified behavior), **remove** (deleted),
**fix** (bug fix), **docs** (documentation).

---

## Documentation

- docs: added this changelog — root
- docs: added architecture document (stack, data model, flows, decisions) — root

## UI screens from mockups

- add: ported the mockups' design system (Material Design 3 palette, spacing
  tokens, font sizes) from Tailwind v3 config to Tailwind v4 `@theme` — `src/app`
- add: loaded Inter (next/font) and Material Symbols icons in the root layout — `src/app`
- add: shared `Icon` and customer `BottomNav` components — `src/components`
- add: typed SQL read helpers (top-rated, search, profile, reviews, worker stats) — `src/lib`
- add: role-selection entry screen — `src/app`
- add: customer home with DB-driven category grid and top-rated list — `src/app/customer`
- add: search results screen with service filter and price/rating sort — `src/app/search`
- add: tradesman public profile (skills, pricing, real reviews) — `src/app/tradesman/[id]`
- add: booking confirmation flow with create-booking API — `src/app/booking`, `src/app/api/bookings`
- add: post-job star-rating review flow with create-review API — `src/app/review`, `src/app/api/reviews`
- add: worker dashboard with live earnings, requests, and upcoming jobs — `src/app/worker`
- change: replaced the starter home page with the role-selection entry — `src/app`

## Database hardening

- add: enabled Row Level Security on all six tables (locks the Supabase public REST API) — `db`

## Stack migration: Prisma → raw SQL

- remove: Prisma ORM, generated client, schema, and config — `prisma/`, `src/lib`
- add: hand-written schema with constraints, enums, and the reputation view — `db`
- add: re-runnable SQL seed covering the full booking lifecycle — `db`
- add: SQL runner script wired to `db:setup` / `db:seed` npm scripts — `scripts`, root
- add: `pg` connection-pool singleton with auto-SSL for Supabase — `src/lib`
- change: rewrote the home page and tradesmen API on raw parameterized SQL — `src/app`
- add: local and Supabase `DATABASE_URL` templates — root

## Project scaffold

- add: Next.js (App Router) + TypeScript + Tailwind project — root, `src/app`
- add: project context and setup docs (CLAUDE.md, README) — root
- add: moved the project proposal PDF into the docs folder — `docs`
