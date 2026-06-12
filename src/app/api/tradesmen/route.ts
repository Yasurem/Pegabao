import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type TradesmanRow = {
  id: number;
  name: string;
  location: string;
  verified: boolean;
  avg_rating: number | null;
  review_count: number;
  services: { name: string; category: string; price: number; mastery: string }[];
};

// GET /api/tradesmen?service=plumbing — list tradesmen, optionally filtered
// by service name/category match. The filter is a parameterized ILIKE ($1),
// never string interpolation, so it is safe from SQL injection.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get("service");

  const { rows } = await query<TradesmanRow>(
    `
    SELECT
        t.id, t.name, t.location, t.verified,
        rep.avg_rating::float8 AS avg_rating,
        rep.review_count::int  AS review_count,
        COALESCE(
            json_agg(
                json_build_object(
                    'name',     s.name,
                    'category', s.category,
                    'price',    ts.price,
                    'mastery',  ts.mastery
                ) ORDER BY s.name
            ) FILTER (WHERE s.id IS NOT NULL),
            '[]'
        ) AS services
    FROM tradesmen t
    JOIN tradesman_reputation rep ON rep.tradesman_id = t.id
    LEFT JOIN tradesman_services ts ON ts.tradesman_id = t.id
    LEFT JOIN services s            ON s.id = ts.service_id
    WHERE $1::text IS NULL OR EXISTS (
        SELECT 1
        FROM tradesman_services ts2
        JOIN services s2 ON s2.id = ts2.service_id
        WHERE ts2.tradesman_id = t.id
          AND (s2.name ILIKE '%' || $1 || '%' OR s2.category ILIKE '%' || $1 || '%')
    )
    GROUP BY t.id, rep.avg_rating, rep.review_count
    ORDER BY rep.avg_rating DESC NULLS LAST, t.name
    `,
    [service]
  );

  return NextResponse.json(rows);
}
