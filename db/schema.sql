-- ============================================================================
-- PegaBao — Centralized Freelance Service Registry & Feedback Management
-- System for Informal Skilled Labor (CS21N Final Project)
--
-- 5 strong entities: tradesmen, customers, services, bookings, reviews
-- 1 junction table:  tradesman_services (M:N with price + mastery payload)
--
-- Re-runnable: drops everything first, then rebuilds.
-- Run locally:   npm run db:setup
-- On Supabase:   paste this file into the SQL Editor and run it
-- ============================================================================

DROP VIEW IF EXISTS tradesman_reputation;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS tradesman_services CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS tradesmen CASCADE;
DROP TYPE IF EXISTS booking_status;
DROP TYPE IF EXISTS mastery_level;

-- ----------------------------------------------------------------------------
-- Enumerated types
-- ----------------------------------------------------------------------------
CREATE TYPE mastery_level AS ENUM ('BEGINNER', 'INTERMEDIATE', 'EXPERT', 'MASTER');
CREATE TYPE booking_status AS ENUM ('PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED');

-- ----------------------------------------------------------------------------
-- Strong entities
-- ----------------------------------------------------------------------------
CREATE TABLE tradesmen (
    id         SERIAL PRIMARY KEY,
    name       TEXT        NOT NULL,
    email      TEXT        NOT NULL UNIQUE,
    phone      TEXT        NOT NULL,
    location   TEXT        NOT NULL,
    bio        TEXT,
    verified   BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE customers (
    id         SERIAL PRIMARY KEY,
    name       TEXT        NOT NULL,
    email      TEXT        NOT NULL UNIQUE,
    phone      TEXT        NOT NULL,
    address    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shared catalog of service types, e.g. "Pipe Repair", "Door Lock Installation"
CREATE TABLE services (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    category    TEXT NOT NULL,
    description TEXT NOT NULL
);

-- ----------------------------------------------------------------------------
-- Junction table: which services each tradesman offers, at what price and
-- mastery level. Composite PK = a tradesman can list a service only once.
-- ----------------------------------------------------------------------------
CREATE TABLE tradesman_services (
    tradesman_id INT           NOT NULL REFERENCES tradesmen (id) ON DELETE CASCADE,
    service_id   INT           NOT NULL REFERENCES services (id)  ON DELETE CASCADE,
    price        NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    mastery      mastery_level NOT NULL DEFAULT 'INTERMEDIATE',
    PRIMARY KEY (tradesman_id, service_id)
);

-- ----------------------------------------------------------------------------
-- Bookings: the transaction record. Lifecycle:
--   PENDING -> ACCEPTED -> COMPLETED | CANCELLED
--
-- The composite FK (tradesman_id, service_id) -> tradesman_services means a
-- booking can only reference a service the tradesman actually offers.
-- ----------------------------------------------------------------------------
CREATE TABLE bookings (
    id            SERIAL PRIMARY KEY,
    customer_id   INT            NOT NULL REFERENCES customers (id),
    tradesman_id  INT            NOT NULL,
    service_id    INT            NOT NULL,
    scheduled_for TIMESTAMPTZ    NOT NULL,
    status        booking_status NOT NULL DEFAULT 'PENDING',
    total_price   NUMERIC(10,2)  NOT NULL CHECK (total_price >= 0),
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),
    FOREIGN KEY (tradesman_id, service_id)
        REFERENCES tradesman_services (tradesman_id, service_id)
);

-- ----------------------------------------------------------------------------
-- Reviews: feedback is only valid against a real transaction.
--   * booking_id UNIQUE  -> at most one review per booking (no fake reviews)
--   * rating CHECK       -> 1..5 enforced by the database itself
-- ----------------------------------------------------------------------------
CREATE TABLE reviews (
    id         SERIAL PRIMARY KEY,
    booking_id INT         NOT NULL UNIQUE REFERENCES bookings (id) ON DELETE CASCADE,
    rating     SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes on FK columns that the app filters/joins on frequently
CREATE INDEX idx_bookings_customer  ON bookings (customer_id);
CREATE INDEX idx_bookings_tradesman ON bookings (tradesman_id);
CREATE INDEX idx_bookings_status    ON bookings (status);
CREATE INDEX idx_services_category  ON services (category);

-- ----------------------------------------------------------------------------
-- Reputation is derived data: computed live from reviews, never stored,
-- so it can never drift out of sync with the underlying transactions.
-- ----------------------------------------------------------------------------
CREATE VIEW tradesman_reputation AS
SELECT
    t.id                                            AS tradesman_id,
    ROUND(AVG(r.rating)::numeric, 1)                AS avg_rating,
    COUNT(r.id)                                     AS review_count,
    COUNT(b.id) FILTER (WHERE b.status = 'COMPLETED') AS completed_jobs
FROM tradesmen t
LEFT JOIN bookings b ON b.tradesman_id = t.id
LEFT JOIN reviews  r ON r.booking_id = b.id
GROUP BY t.id;
