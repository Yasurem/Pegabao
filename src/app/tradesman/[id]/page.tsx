import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { getTradesman, getTradesmanReviews } from "@/lib/queries";

export const dynamic = "force-dynamic";

const masteryBadge: Record<string, string> = {
  MASTER: "bg-primary text-on-primary",
  EXPERT: "bg-secondary-container text-on-secondary-container",
  INTERMEDIATE: "bg-surface-variant text-on-surface-variant",
  BEGINNER: "bg-surface-variant text-on-surface-variant",
};

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

export default async function TradesmanProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tradesmanId = Number(id);
  if (!Number.isInteger(tradesmanId)) notFound();

  const [t, reviews] = await Promise.all([
    getTradesman(tradesmanId),
    getTradesmanReviews(tradesmanId),
  ]);
  if (!t) notFound();

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-[100px]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface flex justify-between items-center px-margin-mobile py-base border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="w-12 h-12 flex items-center justify-center text-on-surface-variant rounded-full"
            aria-label="Back"
          >
            <Icon name="arrow_back" />
          </Link>
          <span className="font-headline-md text-headline-md font-bold text-primary">
            PegaBao
          </span>
        </div>
        <button className="w-12 h-12 flex items-center justify-center text-primary rounded-full">
          <Icon name="share" />
        </button>
      </header>

      <main className="max-w-4xl mx-auto">
        {/* Hero */}
        <section className="bg-surface-container-lowest overflow-hidden mb-stack-md">
          <div className="relative h-48 w-full bg-gradient-to-br from-primary to-primary-container">
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
          <div className="px-margin-mobile pb-stack-md relative -mt-16 z-10">
            <div className="flex flex-col gap-stack-sm">
              <div className="w-32 h-32 rounded-full border-4 border-surface-container-lowest bg-primary-container shadow-sm flex items-center justify-center text-white text-5xl font-bold">
                {t.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                    {t.name}
                  </h1>
                  {t.verified && (
                    <span className="flex items-center gap-1 bg-tertiary-container/20 text-on-tertiary-container px-2 py-1 rounded-full border border-tertiary-container/30">
                      <Icon
                        name="verified"
                        fill
                        className="text-secondary-container text-lg"
                      />
                      <span className="font-label-lg text-label-lg text-[12px]">
                        Verified
                      </span>
                    </span>
                  )}
                </div>
                <p className="font-body-lg text-body-lg text-on-surface-variant">
                  {t.bio ?? t.services[0]?.name}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-2 px-margin-mobile mb-stack-md">
          {[
            {
              icon: "star",
              fill: true,
              color: "text-secondary-container",
              value: t.avg_rating?.toFixed(1) ?? "—",
              label: `${t.review_count} reviews`,
            },
            {
              icon: "work",
              fill: false,
              color: "text-tertiary",
              value: `${t.completed_jobs}`,
              label: "Jobs Done",
            },
            {
              icon: "location_on",
              fill: false,
              color: "text-primary",
              value: t.location.split(",")[0],
              label: "Location",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-stack-sm flex flex-col items-center justify-center text-center shadow-sm"
            >
              <Icon
                name={s.icon}
                fill={s.fill}
                className={`${s.color} mb-1 text-[28px]`}
              />
              <span className="font-headline-md text-headline-md text-on-surface">
                {s.value}
              </span>
              <span className="font-label-lg text-label-lg text-on-surface-variant text-[12px]">
                {s.label}
              </span>
            </div>
          ))}
        </section>

        {/* Verified skills */}
        <section className="px-margin-mobile mb-stack-md">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-stack-sm">
            Verified Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {t.services.map((s) => (
              <div
                key={s.name}
                className="bg-tertiary-container/20 border border-tertiary-container/30 rounded-full px-4 py-2 flex items-center gap-2"
              >
                <span className="font-label-lg text-label-lg text-on-tertiary-container">
                  {s.name}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    masteryBadge[s.mastery] ?? masteryBadge.BEGINNER
                  }`}
                >
                  {s.mastery}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="px-margin-mobile mb-stack-md">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-stack-sm">
            Standard Pricing
          </h2>
          <div className="flex flex-col gap-2">
            {t.services.map((s) => (
              <div
                key={s.name}
                className="bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-stack-sm flex justify-between items-center shadow-sm"
              >
                <div className="flex flex-col">
                  <span className="font-label-lg text-label-lg text-on-surface">
                    {s.name}
                  </span>
                  <span className="font-body-md text-body-md text-on-surface-variant text-[12px]">
                    {s.category}
                  </span>
                </div>
                <span className="font-headline-md text-headline-md text-primary font-bold">
                  ₱{Number(s.price).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Reviews */}
        <section className="px-margin-mobile mb-stack-md">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-stack-sm">
            Recent Reviews
          </h2>
          <div className="flex flex-col gap-stack-sm">
            {reviews.length === 0 && (
              <p className="text-on-surface-variant font-body-md">
                No reviews yet.
              </p>
            )}
            {reviews.map((r, i) => (
              <div
                key={i}
                className="bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-stack-sm shadow-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-secondary-container rounded-full flex items-center justify-center text-on-secondary-container font-bold">
                      {r.reviewer.charAt(0)}
                    </div>
                    <div>
                      <div className="font-label-lg text-label-lg text-on-surface">
                        {r.reviewer}
                      </div>
                      <div className="font-body-md text-body-md text-on-surface-variant text-[12px]">
                        {timeAgo(r.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex text-secondary-container">
                    {Array.from({ length: r.rating }).map((_, s) => (
                      <Icon key={s} name="star" fill className="text-[20px]" />
                    ))}
                  </div>
                </div>
                {r.comment && (
                  <p className="font-body-md text-body-md text-on-surface">
                    {r.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Fixed book action */}
      <div className="fixed bottom-0 w-full bg-surface-container-lowest border-t border-outline-variant/20 p-margin-mobile z-40">
        <Link
          href={`/booking/${t.id}`}
          className="w-full bg-primary-container text-on-primary-container font-cta text-cta h-touch-target-min rounded-lg flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
        >
          <Icon name="handyman" />
          Book Service Now
        </Link>
      </div>
    </div>
  );
}
