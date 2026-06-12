import { query } from "@/lib/db";

// Always render fresh from the database (no build-time prerender)
export const dynamic = "force-dynamic";

const masteryLabel: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  EXPERT: "Expert",
  MASTER: "Master",
};

type TradesmanRow = {
  id: number;
  name: string;
  location: string;
  bio: string | null;
  verified: boolean;
  avg_rating: number | null;
  review_count: number;
  completed_jobs: number;
  services: { name: string; category: string; price: number; mastery: string }[];
};

async function getTradesmen() {
  const { rows } = await query<TradesmanRow>(`
    SELECT
        t.id, t.name, t.location, t.bio, t.verified,
        rep.avg_rating::float8   AS avg_rating,
        rep.review_count::int    AS review_count,
        rep.completed_jobs::int  AS completed_jobs,
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
    GROUP BY t.id, rep.avg_rating, rep.review_count, rep.completed_jobs
    ORDER BY rep.avg_rating DESC NULLS LAST, t.name
  `);
  return rows;
}

export default async function Home() {
  let tradesmen: TradesmanRow[] | null = null;
  let dbError = false;

  try {
    tradesmen = await getTradesmen();
  } catch {
    dbError = true;
  }

  return (
    <main className="mx-auto max-w-4xl flex-1 px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold">
          Pega<span className="text-amber-600">Bao</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Find trusted local tradesmen — verified skills, real reviews.
        </p>
      </header>

      {dbError ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-6 text-sm">
          <p className="font-semibold">Database not reachable</p>
          <p className="mt-2 text-gray-700">
            Start PostgreSQL (or point <code>.env</code> at Supabase), then run{" "}
            <code className="rounded bg-amber-100 px-1">npm run db:setup</code>{" "}
            and{" "}
            <code className="rounded bg-amber-100 px-1">npm run db:seed</code>{" "}
            — see the README for setup steps.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {tradesmen!.map((t) => (
            <li
              key={t.id}
              className="rounded-lg border border-gray-200 p-5 shadow-sm"
            >
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">
                  {t.name}
                  {t.verified && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Verified
                    </span>
                  )}
                </h2>
                <span className="text-sm text-gray-500">{t.location}</span>
              </div>

              <p className="mt-1 text-sm text-gray-600">{t.bio}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {t.services.map((s) => (
                  <span
                    key={s.name}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs"
                  >
                    {s.name} · ₱{Number(s.price).toLocaleString()} ·{" "}
                    {masteryLabel[s.mastery]}
                  </span>
                ))}
              </div>

              <p className="mt-3 text-sm">
                {t.avg_rating !== null ? (
                  <>
                    <span className="font-medium text-amber-600">
                      ★ {t.avg_rating.toFixed(1)}
                    </span>{" "}
                    <span className="text-gray-500">
                      ({t.review_count} review{t.review_count === 1 ? "" : "s"}{" "}
                      · {t.completed_jobs} completed job
                      {t.completed_jobs === 1 ? "" : "s"})
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400">No reviews yet</span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
