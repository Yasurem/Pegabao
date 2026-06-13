import { query } from "./db";

// Shared shapes ------------------------------------------------------------

export type ServiceOffering = {
  name: string;
  category: string;
  price: number;
  mastery: string;
};

export type TradesmanCard = {
  id: number;
  name: string;
  location: string;
  bio: string | null;
  verified: boolean;
  avg_rating: number | null;
  review_count: number;
  completed_jobs: number;
  services: ServiceOffering[];
};

// One reusable SELECT body: a tradesman joined to the reputation view and
// their offered services aggregated into JSON.
const TRADESMAN_SELECT = `
  SELECT
      t.id, t.name, t.location, t.bio, t.verified,
      rep.avg_rating::float8   AS avg_rating,
      rep.review_count::int    AS review_count,
      rep.completed_jobs::int  AS completed_jobs,
      COALESCE(
          json_agg(
              json_build_object(
                  'name', s.name, 'category', s.category,
                  'price', ts.price, 'mastery', ts.mastery
              ) ORDER BY s.name
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
      ) AS services
  FROM tradesmen t
  JOIN tradesman_reputation rep ON rep.tradesman_id = t.id
  LEFT JOIN tradesman_services ts ON ts.tradesman_id = t.id
  LEFT JOIN services s            ON s.id = ts.service_id
`;

// Reads --------------------------------------------------------------------

// Distinct service categories from the catalog (powers the home grid).
export async function getCategories() {
  const { rows } = await query<{ category: string; service_count: number }>(`
    SELECT category, COUNT(*)::int AS service_count
    FROM services
    GROUP BY category
    ORDER BY category
  `);
  return rows;
}

export async function getTopRatedTradesmen(limit = 6) {
  const { rows } = await query<TradesmanCard>(
    `${TRADESMAN_SELECT}
     GROUP BY t.id, rep.avg_rating, rep.review_count, rep.completed_jobs
     ORDER BY rep.avg_rating DESC NULLS LAST, t.name
     LIMIT $1`,
    [limit]
  );
  return rows;
}

export async function searchTradesmen(term: string | null, sort: string | null) {
  // Sort whitelist — never interpolate user input into the ORDER BY.
  const orderBy =
    sort === "price"
      ? "MIN(ts.price) ASC NULLS LAST"
      : sort === "rating"
        ? "rep.avg_rating DESC NULLS LAST"
        : "t.name";

  const { rows } = await query<TradesmanCard>(
    `${TRADESMAN_SELECT}
     WHERE $1::text IS NULL OR EXISTS (
         SELECT 1 FROM tradesman_services ts2
         JOIN services s2 ON s2.id = ts2.service_id
         WHERE ts2.tradesman_id = t.id
           AND (s2.name ILIKE '%' || $1 || '%' OR s2.category ILIKE '%' || $1 || '%')
     )
     GROUP BY t.id, rep.avg_rating, rep.review_count, rep.completed_jobs
     ORDER BY ${orderBy}, t.name`,
    [term]
  );
  return rows;
}

export async function getTradesman(id: number) {
  const { rows } = await query<TradesmanCard>(
    `${TRADESMAN_SELECT}
     WHERE t.id = $1
     GROUP BY t.id, rep.avg_rating, rep.review_count, rep.completed_jobs`,
    [id]
  );
  return rows[0] ?? null;
}

export type Review = {
  reviewer: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export async function getTradesmanReviews(id: number, limit = 5) {
  const { rows } = await query<Review>(
    `SELECT c.name AS reviewer, r.rating, r.comment, r.created_at
     FROM reviews r
     JOIN bookings  b ON b.id = r.booking_id
     JOIN customers c ON c.id = b.customer_id
     WHERE b.tradesman_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2`,
    [id, limit]
  );
  return rows;
}

// Worker dashboard stats for a given tradesman.
export type WorkerStats = {
  earnings_week: number;
  completed_jobs: number;
  pending_requests: number;
};

export async function getWorkerStats(tradesmanId: number) {
  const { rows } = await query<WorkerStats>(
    `SELECT
        COALESCE(SUM(total_price) FILTER (
            WHERE status = 'COMPLETED' AND created_at > now() - interval '7 days'
        ), 0)::float8                                  AS earnings_week,
        COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed_jobs,
        COUNT(*) FILTER (WHERE status = 'PENDING')::int   AS pending_requests
     FROM bookings
     WHERE tradesman_id = $1`,
    [tradesmanId]
  );
  return rows[0] ?? { earnings_week: 0, completed_jobs: 0, pending_requests: 0 };
}

export async function getPendingRequests(tradesmanId: number) {
  const { rows } = await query<{
    id: number;
    customer: string;
    service: string;
    category: string;
    total_price: number;
    created_at: string;
  }>(
    `SELECT b.id, c.name AS customer, s.name AS service, s.category,
            b.total_price::float8 AS total_price, b.created_at
     FROM bookings b
     JOIN customers c ON c.id = b.customer_id
     JOIN services  s ON s.id = b.service_id
     WHERE b.tradesman_id = $1 AND b.status = 'PENDING'
     ORDER BY b.created_at DESC`,
    [tradesmanId]
  );
  return rows;
}
