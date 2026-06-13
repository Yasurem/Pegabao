# PegaBao — AI Agent Handoff

You are an AI coding agent picking up this project with **no memory of prior
sessions**. This file is your briefing. Read it fully before changing anything.

---

## 1. What PegaBao is

A two-sided web app connecting Filipino informal skilled labor (plumbers,
carpenters, locksmiths, electricians) with households. It is a **2nd-year
database-course final project** — the relational database design in `db/` is the
graded artifact, so **SQL correctness and constraints matter more than UI
polish**. Bilingual (Taglish), mobile-first.

## 2. Read these first, in order

1. `AGENTS.md` — **important:** says this Next.js version differs from training
   data; read the relevant guide in `node_modules/next/dist/docs/` before
   writing framework code.
2. `CLAUDE.md` — project conventions (also applies to you).
3. `ARCHITECTURE.md` — full system design, data model, request flows, route map.
   **Do not duplicate it; consult it.**
4. `db/schema.sql` — the schema, constraints, and the `tradesman_reputation`
   view. This is the heart of the project.
5. `CHANGELOG.md` — what has changed and when.

## 3. Local environment & how to run

- **OS / shell:** Windows 11, PowerShell. Paths are `D:\1_Programming\FINALS\Pegabao`.
- **Database:** PostgreSQL **17** is installed locally (service
  `postgresql-x64-17`, auto-starts). `psql` lives at
  `C:\Program Files\PostgreSQL\17\bin` (on PATH for newly opened terminals).
  Database `pegabao`, credentials `postgres` / `postgres`.
- **Connection:** `.env` holds `DATABASE_URL` →
  `postgresql://postgres:postgres@localhost:5432/pegabao`. For Supabase, use the
  Transaction Pooler URI with `?sslmode=require` (the app auto-enables SSL then).

Commands (npm):

```
npm run db:setup   # apply db/schema.sql  (DROPS + rebuilds — re-runnable)
npm run db:seed    # apply db/seed.sql    (TRUNCATEs + reloads sample data)
npm run dev        # start the dev server at http://localhost:3000
npm run build      # production build — must stay GREEN before you finish
```

If the DB is empty or schema changed: `npm run db:setup` then `npm run db:seed`.

## 4. Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · PostgreSQL via the **`pg`
driver with raw SQL (no ORM)** · Tailwind CSS **v4** · `tsx` for scripts · npm.

## 5. Guardrails — do NOT violate these

- ❌ **Do not reintroduce Prisma or any ORM.** Prisma was deliberately removed;
  this is a database course and the hand-written SQL is the deliverable.
- ✅ **All SQL is parameterized** (`$1`, `$2`…). Never interpolate user input
  into query strings. Import `query` / `pool` from `src/lib/db.ts` — never make
  a new `Pool` in a page or route.
- ✅ **Tailwind is v4**, configured via `@theme` in `src/app/globals.css` (CSS,
  not a JS config). The mockups' inline v3 `tailwind.config` will NOT work if
  copied — use the existing design tokens (`bg-surface`, `text-on-surface`,
  `font-headline-md`, `px-margin-mobile`, `h-touch-target-min`, etc.).
- ✅ **Next 16 specifics:** `params` and `searchParams` are **Promises** — you
  must `await` them in server components. Read `node_modules/next/dist/docs/`
  before using framework features.
- ✅ **DB-backed pages** set `export const dynamic = "force-dynamic"` so the
  build doesn't need a live database.
- ✅ **Schema changes** go in `db/schema.sql` (which drops + rebuilds), then
  `npm run db:setup` + `npm run db:seed`. Keep `db/*.sql` paste-able into the
  Supabase SQL Editor (no psql-only meta-commands like `\c`).
- ✅ **No remote images.** Use initial-letter avatars / gradient panels
  (existing pattern). The mockups' stock-photo URLs rot.
- ✅ Money is `NUMERIC(10,2)`; SQL identifiers are snake_case.
- ⚠️ **Commit only when the user asks.** On branch `main`; branch first for
  large changes. End commit messages with the project's co-author trailer.

## 6. Current state

**Built and verified (`npm run build` green, smoke-tested against the DB):**

| Area | Files |
|---|---|
| Design system (v3→v4 port) + fonts | `src/app/globals.css`, `src/app/layout.tsx` |
| Shared UI | `src/components/` (Icon, BottomNav, BookingForm, ReviewForm) |
| Typed read helpers | `src/lib/queries.ts` (+ `src/lib/db.ts` pool) |
| Entry / role selection | `src/app/page.tsx` |
| Customer home (DB) | `src/app/customer/` |
| Search (DB) | `src/app/search/` |
| Tradesman profile (DB) | `src/app/tradesman/[id]/` |
| Booking flow + API (DB write) | `src/app/booking/[tradesmanId]/`, `src/app/api/bookings/` |
| Review flow + API (DB write) | `src/app/review/[bookingId]/`, `src/app/api/reviews/` |
| Worker dashboard (DB) | `src/app/worker/` |

**Source mockups** live in `docs/Mockups/` (HTML). Each built screen maps to one
— see the route map in `ARCHITECTURE.md` §9.

**NOT built yet (your runway):**

- Authentication / roles — there is **no auth**; the worker dashboard and new
  bookings are attributed to the **first seeded account**.
- Onboarding flow screens (8 static form steps in `docs/Mockups/Onboarding/`).
  ⚠️ `Onboarding/worker/step_1.html` is **empty (0 bytes)** in the source.
- Accept/Decline on the worker dashboard are **visual only** — no status update.
- The "Ask PegaBao" AI assistant.

> ⚠️ **Git note:** the UI screens above and the new docs
> (`ARCHITECTURE.md`, `CHANGELOG.md`, this file) are **uncommitted**. Run
> `git status` and consider committing a checkpoint before large changes.

## 7. Next tasks (prioritized)

1. **Wire Accept/Decline on the worker dashboard.** Add `PATCH /api/bookings/[id]`
   that moves status `PENDING → ACCEPTED` / `CANCELLED` (respect the lifecycle in
   `CLAUDE.md`). Wire the buttons in `src/app/worker/page.tsx` (will need a small
   client component). Smallest, highest-value increment.
2. **Onboarding screens.** Convert `docs/Mockups/Onboarding/*` to routes (e.g.
   `/onboarding/customer/[step]`, `/onboarding/worker/[step]`). Mostly static
   forms — low DB value, so do after #1. Regenerate the empty worker step 1.
3. **Authentication & roles** (customer vs tradesman). Once present, replace the
   "first seeded account" placeholders in the booking API and worker dashboard
   with the logged-in user.
4. **Booking management UI** for customers (list their bookings, reach the review
   screen from a completed booking — currently `/review/[bookingId]` is only
   reachable by direct URL).
5. **"Ask PegaBao" assistant** — retrieve-then-generate: run SQL to fetch
   relevant tradesmen/services/reviews, then have an LLM answer grounded in those
   rows (no vector DB). **Provider note:** the original spec named the Claude API,
   but since you are Gemini 3.1 Pro, use the **Google Gen AI SDK**
   (`@google/genai`) instead — the retrieve-then-generate pattern is
   provider-agnostic. Keep the API key server-side; never expose it to the client
   or embed it in prompts.

## 8. How to verify your work

1. `npm run build` must complete green (TypeScript must pass).
2. Start `npm run dev` and smoke-test the routes you touched (expect HTTP 200 and
   real seeded data, e.g. `/customer` shows seeded tradesmen).
3. For write paths, confirm the DB constraints still fire — e.g. a review on a
   non-`COMPLETED` booking returns 409, and `rating > 5` returns 400.
4. If you created test rows while smoke-testing, delete them (or re-run
   `npm run db:seed`) so sample data stays pristine.

---

*Maintained as the living entry point for any AI agent continuing PegaBao. Update
the "Current state" and "Next tasks" sections as you make progress.*
