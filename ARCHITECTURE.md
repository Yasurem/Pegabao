# PegaBao — Architecture

## 1. Overview

PegaBao is a centralized **freelance service registry and feedback management
system** that connects Filipino informal skilled labor (plumbers, carpenters,
locksmiths, electricians) with households needing repairs. It is the final
project for CS21N (a 2nd-year database course), so the **relational database
design is the primary graded artifact** — the hand-written SQL in `db/` matters
more than UI polish.

The product has two sides:

- **Customers** browse and search tradesmen, view profiles, book services, and
  review completed jobs.
- **Tradesmen (workers)** list the services they offer (with price and mastery
  level) and manage incoming job requests from a dashboard.

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16** (App Router) + React 19 | Server Components render pages; Route Handlers serve the API |
| Language | **TypeScript** | |
| Database | **PostgreSQL** | Local for dev, **Supabase** (hosted Postgres) for deployment |
| DB access | **`pg` driver + raw SQL** | **No ORM** — deliberate, see §6 |
| Styling | **Tailwind CSS v4** | CSS-first config via `@theme` in `globals.css` |
| Fonts/icons | Inter (`next/font`) + Material Symbols | |
| Tooling | npm, `tsx` (runs the SQL/seed scripts) | |
| Hosting (planned) | App → Vercel · DB → Supabase | |

## 3. High-level architecture

```
                Browser (mobile-first UI)
                        │  HTTP
                        ▼
        ┌─────────────────────────────────────┐
        │            Next.js server            │
        │                                      │
        │  Server Components (pages)  ──┐       │  reads
        │  Route Handlers (/api/*)    ──┤       │  writes
        └──────────────────────────────┼───────┘
                                        │
                                        ▼
                    src/lib/db.ts  (pg connection Pool)
                                        │  parameterized SQL
                                        ▼
                    PostgreSQL  (local dev  /  Supabase prod)
                    tables · constraints · tradesman_reputation VIEW
```

There is **one direction of dependency**: UI → data-access layer → database.
Nothing in the database depends on the app, so the schema is complete and
correct on its own.

## 4. Directory structure

```
Pegabao/
├── db/                          # THE GRADED ARTIFACT — hand-written SQL
│   ├── schema.sql               #   tables, constraints, reputation VIEW, RLS
│   └── seed.sql                 #   re-runnable sample data
├── scripts/
│   └── run-sql.ts               # applies a .sql file to DATABASE_URL
├── src/
│   ├── lib/
│   │   ├── db.ts                # pg Pool singleton + query() helper
│   │   └── queries.ts           # typed read helpers used by pages
│   ├── components/              # shared UI (client + server)
│   │   ├── Icon.tsx             #   Material Symbol wrapper
│   │   ├── BottomNav.tsx        #   customer bottom navigation (client)
│   │   ├── BookingForm.tsx      #   booking flow (client)
│   │   └── ReviewForm.tsx       #   star-rating review (client)
│   └── app/                     # App Router — folders are URL segments
│       ├── layout.tsx           #   root layout: fonts + Material Symbols
│       ├── globals.css          #   design system ported to Tailwind v4 @theme
│       ├── page.tsx             #   "/"  role-selection entry
│       ├── customer/page.tsx    #   "/customer"  home (DB)
│       ├── search/page.tsx      #   "/search"  results (DB)
│       ├── tradesman/[id]/      #   "/tradesman/:id"  public profile (DB)
│       ├── booking/[tradesmanId]/  # "/booking/:id"  confirm booking (DB write)
│       ├── review/[bookingId]/  #   "/review/:id"  post-job review (DB write)
│       ├── worker/page.tsx      #   "/worker"  tradesman dashboard (DB)
│       └── api/
│           ├── tradesmen/route.ts   # GET   list/filter tradesmen
│           ├── bookings/route.ts    # POST  create a booking
│           └── reviews/route.ts     # POST  create a review
├── docs/                        # proposal PDF + UI mockups (design inputs)
├── .env / .env.example          # DATABASE_URL (local + Supabase templates)
├── CLAUDE.md / AGENTS.md        # project context & conventions
└── README.md                    # setup instructions
```

## 5. Data model

Five strong entities + one junction table. Defined in `db/schema.sql`.

```
customers ──< bookings >── tradesmen
                 │    │
                 │    └──────< tradesman_services >── services
                 │              (price, mastery)        │
                 └── bookings.(tradesman_id, service_id) ┘  ← composite FK
                 │
              reviews  (1:1 with bookings)

tradesman_reputation  = VIEW over tradesmen ⋈ bookings ⋈ reviews
```

| Table | Purpose |
|---|---|
| `tradesmen` | Skilled-worker profiles |
| `customers` | Households booking services |
| `services` | Shared catalog of service types (e.g. "Pipe Repair") |
| `tradesman_services` | **Junction** — which tradesman offers which service, at what `price` and `mastery` (composite PK) |
| `bookings` | Transactions; status lifecycle `PENDING → ACCEPTED → COMPLETED / CANCELLED` |
| `reviews` | One review per booking (`booking_id` UNIQUE) |
| `tradesman_reputation` | **VIEW** — live avg rating, review count, completed jobs |

### Integrity rules enforced by the database

| Rule | Mechanism |
|---|---|
| One review per booking (no fake reviews) | `reviews.booking_id` is `UNIQUE` |
| Ratings are always 1–5 | `CHECK (rating BETWEEN 1 AND 5)` |
| A tradesman lists a service once | composite PK `(tradesman_id, service_id)` |
| Can only book a service the tradesman actually offers | composite FK `bookings (tradesman_id, service_id) → tradesman_services` |
| Prices/totals never negative | `CHECK (... >= 0)` |
| Reputation can't drift from real data | it's a `VIEW`, computed live, never stored |
| Public REST API is locked down | Row Level Security enabled on all tables |

## 6. Application layers

1. **Data access** — `src/lib/db.ts` exposes a single `pg` connection `Pool`
   (cached on `globalThis` so Next's dev hot-reload doesn't leak connections)
   and a `query()` helper. It auto-enables SSL when `DATABASE_URL` contains
   `sslmode=require` (i.e. on Supabase). **Every query is parameterized** —
   user input is never concatenated into SQL.
2. **Reads** — `src/lib/queries.ts` holds typed helpers (`getTopRatedTradesmen`,
   `searchTradesmen`, `getTradesman`, `getTradesmanReviews`, `getWorkerStats`…).
   Server Components call these directly and render finished HTML.
3. **Writes** — Route Handlers under `src/app/api/*` (`POST /api/bookings`,
   `POST /api/reviews`) validate input, then rely on DB constraints as the final
   guard.
4. **UI** — `src/components/*` plus the design system in `globals.css`.

DB-backed pages set `export const dynamic = "force-dynamic"` so the production
build never needs a live database.

## 7. Request flows

**Read — viewing a tradesman profile (`/tradesman/:id`):**

```
request → Server Component awaits params.id
        → getTradesman(id) + getTradesmanReviews(id)   (src/lib/queries.ts)
        → db.ts pool runs parameterized SQL (JOINs + reputation view)
        → React renders skills, pricing, and real reviews to HTML
```

**Write — leaving a review (`POST /api/reviews`):** demonstrates
defense-in-depth across the app and database layers.

```
ReviewForm (client) → POST /api/reviews { bookingId, rating, comment }
        → validate rating is an integer 1–5            (app layer)
        → reject unless booking.status = 'COMPLETED'    (app-layer gate)
        → INSERT into reviews
              ├─ UNIQUE(booking_id) violation → 409 "already reviewed"
              └─ CHECK(rating 1–5)   violation → 400     (database layer)
```

The booking write path (`POST /api/bookings`) works the same way: the composite
FK means the database itself rejects booking a service the tradesman doesn't
offer.

## 8. Key design decisions

- **Raw SQL, no ORM.** This is a database course; the constraints, junction
  table, and view are the deliverable and must be visible, hand-written
  artifacts. (Prisma was used in the very first scaffold, then removed — see
  `CHANGELOG.md`.)
- **Parameterized queries only** (`$1`, `$2`…) — never string interpolation.
- **Reputation as a VIEW**, not a stored column, so derived data can't go stale.
- **Defense in depth** — app-layer rules (review only `COMPLETED` bookings) sit
  on top of database constraints, not instead of them.
- **Row Level Security on** — Supabase auto-exposes tables via a public REST API
  keyed by the anon key; RLS with no policies blocks it. The app is unaffected
  because its direct connection is the table owner and bypasses RLS.
- **Design system port** — the mockups shipped a Tailwind **v3** JS config;
  it was translated once into Tailwind **v4** `@theme` tokens in `globals.css`.
- **Self-contained UI** — the mockups referenced remote stock photos with
  rot-prone URLs; the app uses initial-letter avatars and gradient panels so it
  depends on no external image hosts.

## 9. Route map

| Route | Type | Source mockup |
|---|---|---|
| `/` | static | `Onboarding/opener/role_selection` |
| `/customer` | DB read | `Main/customer/home` |
| `/search` | DB read | `Main/customer/search` |
| `/tradesman/[id]` | DB read | `Main/customer/profile` |
| `/booking/[tradesmanId]` | DB write | `Main/customer/4booking/booking` |
| `/review/[bookingId]` | DB write | `Main/customer/4booking/ratings` |
| `/worker` | DB read | `Main/worker/dashboard` |
| `/api/tradesmen` | GET | — |
| `/api/bookings` | POST | — |
| `/api/reviews` | POST | — |

## 10. Environments & deployment

- **Local:** `DATABASE_URL` → `localhost:5432/pegabao`. Apply the schema with
  `npm run db:setup`, load sample data with `npm run db:seed`, run `npm run dev`.
- **Supabase:** paste `db/schema.sql` then `db/seed.sql` into the SQL Editor
  (they are written to be paste-able and re-runnable). Set `DATABASE_URL` to the
  Transaction Pooler URI with `?sslmode=require`. `db.ts` enables SSL
  automatically — no code change between local and cloud.
- **App hosting (planned):** Vercel, with `DATABASE_URL` set as an environment
  variable pointing at Supabase.

## 11. Planned / not yet built

- **Authentication** (customer vs tradesman roles). Today there is no auth — the
  worker dashboard and new bookings are attributed to the first seeded account.
- **Booking management UI** (accept/decline actions are visual only so far).
- **Onboarding flow screens** (8 static form steps from the mockups — deferred;
  note `Onboarding/worker/step_1.html` is empty in the source mockups).
- **"Ask PegaBao" AI assistant** — retrieve rows via SQL, then ground a Claude
  API answer (retrieve-then-generate, no vector DB).
```
