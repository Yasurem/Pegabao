import Link from "next/link";
import { Icon } from "@/components/Icon";
import { query } from "@/lib/db";
import { getWorkerStats, getPendingRequests } from "@/lib/queries";

export const dynamic = "force-dynamic";

// No auth yet: the dashboard represents the first seeded tradesman.
export default async function WorkerDashboard() {
  const { rows: workers } = await query<{ id: number; name: string }>(
    `SELECT id, name FROM tradesmen ORDER BY id LIMIT 1`
  );

  if (workers.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8 text-center">
        <p className="font-body-md text-on-surface-variant">
          No tradesman accounts yet. Run <code>npm run db:seed</code> first.
        </p>
      </main>
    );
  }

  const worker = workers[0];
  const [stats, pending, upcoming] = await Promise.all([
    getWorkerStats(worker.id),
    getPendingRequests(worker.id),
    query<{ service: string; category: string; scheduled_for: string }>(
      `SELECT s.name AS service, s.category, b.scheduled_for
       FROM bookings b JOIN services s ON s.id = b.service_id
       WHERE b.tradesman_id = $1 AND b.status = 'ACCEPTED'
       ORDER BY b.scheduled_for`,
      [worker.id]
    ).then((r) => r.rows),
  ]);

  const firstName = worker.name.split(" ")[1] ?? worker.name;

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-[90px]">
      <header className="sticky top-0 bg-surface border-b border-outline-variant/20 flex justify-between items-center px-margin-mobile py-base z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white font-bold">
            {worker.name.charAt(0)}
          </div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">
            PegaBao
          </h1>
        </div>
        <button className="text-primary p-2 rounded-full flex items-center justify-center min-h-[48px] min-w-[48px]">
          <Icon name="location_on" />
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-margin-mobile py-stack-md flex flex-col gap-stack-md">
        {/* Welcome + status */}
        <section className="flex flex-col gap-stack-sm md:flex-row md:items-end md:justify-between bg-surface-container-lowest p-margin-mobile rounded-xl shadow-sm border border-outline-variant/20">
          <div>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">
              Magandang araw, {firstName}!
            </h2>
            <p className="text-on-surface-variant mt-1">Ready for today&apos;s jobs?</p>
          </div>
          <div className="flex items-center gap-3 mt-4 md:mt-0 p-3 bg-surface-container rounded-lg border border-outline-variant/30">
            <span className="font-label-lg text-on-surface">Open for Jobs</span>
            <span className="relative w-12 h-6 rounded-full bg-primary-container flex items-center">
              <span className="absolute right-0 w-6 h-6 rounded-full bg-white border-4 border-primary-container" />
            </span>
          </div>
        </section>

        {/* Earnings bento */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-stack-sm">
          <div className="bg-surface-container-lowest p-margin-mobile rounded-xl shadow-sm border border-outline-variant/20 border-l-4 border-l-earth-yellow flex flex-col justify-center">
            <p className="font-label-lg text-on-surface-variant uppercase tracking-wider mb-2">
              Earnings This Week
            </p>
            <span className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              ₱{stats.earnings_week.toLocaleString()}
            </span>
          </div>
          <div className="bg-surface-container-lowest p-margin-mobile rounded-xl shadow-sm border border-outline-variant/20 flex items-center justify-between">
            <div>
              <p className="font-label-lg text-on-surface-variant uppercase tracking-wider mb-2">
                Completed Jobs
              </p>
              <span className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                {stats.completed_jobs}
              </span>
            </div>
            <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
              <Icon name="task_alt" className="text-3xl" />
            </div>
          </div>
        </section>

        {/* New requests */}
        <section>
          <div className="flex items-center justify-between mb-stack-sm">
            <h3 className="font-headline-md text-on-surface">New Requests</h3>
            {stats.pending_requests > 0 && (
              <span className="bg-error text-on-error font-label-lg px-2 py-1 rounded-full text-xs">
                {stats.pending_requests} New
              </span>
            )}
          </div>
          {pending.length === 0 ? (
            <p className="text-on-surface-variant font-body-md bg-surface-container-low rounded-xl p-4">
              No new requests right now.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {pending.map((p) => (
                <div
                  key={p.id}
                  className="bg-surface-container-lowest p-margin-mobile rounded-xl shadow-sm border border-outline-variant/30 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary-container" />
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-headline-md text-on-surface">
                        {p.service}
                      </h4>
                      <p className="text-on-surface-variant flex items-center gap-1 mt-1">
                        <Icon name="person" className="text-[18px]" /> {p.customer}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="block font-headline-md text-on-surface">
                        ₱{p.total_price.toLocaleString()}
                      </span>
                      <span className="text-on-surface-variant text-sm">
                        Estimated
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 bg-primary-container text-white font-cta min-h-[56px] rounded-lg flex items-center justify-center gap-2 active:scale-[0.98]">
                      <Icon name="check_circle" fill /> Accept
                    </button>
                    <button className="flex-1 border-2 border-delft-blue text-delft-blue font-cta min-h-[56px] rounded-lg flex items-center justify-center gap-2 active:scale-[0.98]">
                      <Icon name="close" /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming */}
        <section>
          <h3 className="font-headline-md text-on-surface mb-stack-sm">
            Upcoming Jobs
          </h3>
          {upcoming.length === 0 ? (
            <p className="text-on-surface-variant font-body-md bg-surface-container-low rounded-xl p-4">
              No upcoming jobs scheduled.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {upcoming.map((u, i) => (
                <div
                  key={i}
                  className="bg-surface-container-lowest p-4 rounded-lg shadow-sm border border-outline-variant/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-tertiary-container/20 rounded-full flex items-center justify-center text-delft-blue">
                      <Icon name="handyman" />
                    </div>
                    <div>
                      <h4 className="font-label-lg text-on-surface">{u.service}</h4>
                      <p className="text-on-surface-variant text-sm flex items-center gap-1">
                        <Icon name="calendar_today" className="text-[16px]" />
                        {new Date(u.scheduled_for).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Icon name="chevron_right" className="text-outline" />
                </div>
              ))}
            </div>
          )}
        </section>

        <Link
          href="/"
          className="text-center font-label-lg text-label-lg text-on-surface-variant py-2"
        >
          Switch role
        </Link>
      </main>
    </div>
  );
}
