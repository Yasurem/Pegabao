@AGENTS.md

# PegaBao — project context

**What:** Final project for CS21N (2nd-year database course) — a freelance service registry connecting Filipino informal skilled labor (plumbers, carpenters, locksmiths, electricians) with customers. Proposal: `docs/Castillo_FinalProjectProposal_CS21N.pdf`.

**Grading focus:** the relational database design. The hand-written SQL in `db/schema.sql` is the graded artifact — constraints, the junction table, and the reputation view matter more than UI polish.

## Stack (decided — don't re-litigate)

- Next.js App Router + TypeScript, npm
- PostgreSQL with **raw SQL** via the `pg` driver — **no ORM** (user explicitly rejected Prisma; this is a database course)
- Tailwind CSS
- Database will be hosted on **Supabase**; app deploys to a hosting platform (likely Vercel)

## Conventions

- DB access: import `query`/`pool` from `src/lib/db.ts` — never create new `Pool`s in pages/routes.
- All queries are parameterized (`$1`, `$2`…) — never interpolate user input into SQL strings.
- DB-backed pages use `export const dynamic = "force-dynamic"` so builds don't need a live database.
- Schema changes: edit `db/schema.sql` (it drops + rebuilds, re-runnable), apply with `npm run db:setup`, then re-seed with `npm run db:seed`.
- `db/*.sql` files must stay paste-able into the Supabase SQL Editor (no psql-only meta-commands like `\c`).
- Money is `NUMERIC(10,2)` (Philippine pesos); SQL identifiers are snake_case.

## Key integrity rules (defense talking points)

- `reviews.booking_id UNIQUE` → one review per booking, no fake reviews.
- `CHECK (rating BETWEEN 1 AND 5)` → enforced by the database, not app code.
- `tradesman_services` composite PK → a tradesman lists a service once.
- Composite FK on `bookings (tradesman_id, service_id)` → can only book a service the tradesman actually offers.
- `tradesman_reputation` is a VIEW → derived data is computed, never stored, so it can't go stale.
- Booking lifecycle: `PENDING → ACCEPTED → COMPLETED / CANCELLED`; reviews should only be written for `COMPLETED` bookings (enforce in app logic).

## Planned extras (not built yet)

- Auth (customer vs tradesman roles)
- Booking creation/management UI
- Review submission flow (gate on completed bookings)
- "Ask PegaBao" AI assistant: retrieve rows via SQL → ground a Claude API answer (retrieve-then-generate, no vector DB)
