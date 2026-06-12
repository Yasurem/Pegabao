# PegaBao

A centralized freelance service registry and feedback management system for informal skilled labor (CS21N final project).

**Stack:** Next.js (App Router, TypeScript) · PostgreSQL with hand-written SQL (`pg` driver, no ORM) · Tailwind CSS

## Setup — local development

### 1. Database

Install [PostgreSQL](https://www.postgresql.org/download/windows/) if you haven't, then create the database:

```powershell
psql -U postgres -c "CREATE DATABASE pegabao;"
```

Update `DATABASE_URL` in `.env` if your username/password differ from `postgres:postgres`.

### 2. Create tables and seed

```powershell
npm run db:setup   # applies db/schema.sql (tables, constraints, view)
npm run db:seed    # applies db/seed.sql (sample tradesmen, bookings, reviews)
```

Both are re-runnable — `db:setup` drops and rebuilds, `db:seed` truncates and reloads.

### 3. Run

```powershell
npm run dev
```

Open http://localhost:3000 — you should see the seeded tradesmen ranked by rating.

## Setup — Supabase (for deployment)

1. Create a project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, paste and run `db/schema.sql`, then `db/seed.sql`.
3. In **Connect → Transaction pooler**, copy the URI, append `?sslmode=require`, and set it as `DATABASE_URL` (in `.env` locally, or in your hosting platform's environment variables when deploying, e.g. Vercel).

That's it — the app talks to Supabase exactly like local Postgres.

## Useful commands

| Command | What it does |
|---|---|
| `npm run db:setup` | Drop + recreate all tables, constraints, and the reputation view |
| `npm run db:seed` | Wipe and reload sample data |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `psql -U postgres -d pegabao` | Open a SQL prompt against the local DB |

## Data model (`db/schema.sql`)

Five strong entities + one junction table:

- **tradesmen** — skilled worker profiles (plumbers, carpenters, locksmiths…)
- **customers** — households booking services
- **services** — shared catalog of service types
- **tradesman_services** — junction: who offers what, at what price and mastery level (composite PK)
- **bookings** — transactions with a status lifecycle (`PENDING → ACCEPTED → COMPLETED / CANCELLED`)
- **reviews** — one per booking, rating 1–5

### Integrity rules enforced by the database

| Rule | Mechanism |
|---|---|
| One review per booking (no fake reviews) | `reviews.booking_id` is `UNIQUE` + FK |
| Ratings are always 1–5 | `CHECK (rating BETWEEN 1 AND 5)` |
| A tradesman lists a service only once | Composite PK `(tradesman_id, service_id)` |
| Bookings only for services the tradesman actually offers | Composite FK `(tradesman_id, service_id) → tradesman_services` |
| Prices are never negative | `CHECK (price >= 0)` |
| Reputation can't drift from real data | `tradesman_reputation` is a `VIEW`, computed live |

## API

- `GET /api/tradesmen` — all tradesmen with services and average rating
- `GET /api/tradesmen?service=plumbing` — filtered by service name/category (parameterized SQL, injection-safe)
