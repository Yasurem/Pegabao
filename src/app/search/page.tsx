import Link from "next/link";
import { Icon } from "@/components/Icon";
import { BottomNav } from "@/components/BottomNav";
import { searchTradesmen } from "@/lib/queries";

export const dynamic = "force-dynamic";

const sorts = [
  { key: "nearby", label: "Nearby", icon: "near_me" },
  { key: "price", label: "Lowest Price", icon: null },
  { key: "rating", label: "Highest Rated", icon: null },
] as const;

export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; sort?: string }>;
}) {
  const { service, sort } = await searchParams;
  const term = service?.trim() || null;
  const results = await searchTradesmen(term, sort ?? null);

  const minPrice = (services: { price: number }[]) =>
    services.length ? Math.min(...services.map((s) => s.price)) : null;

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-[100px] md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface border-b border-outline-variant/20 flex justify-between items-center px-margin-mobile py-base">
        <div className="flex items-center gap-2">
          <Link
            href="/customer"
            className="w-10 h-10 flex items-center justify-center text-on-surface-variant rounded-full"
            aria-label="Back"
          >
            <Icon name="arrow_back" />
          </Link>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">
            PegaBao
          </h1>
        </div>
        <button className="w-10 h-10 flex items-center justify-center text-primary rounded-full">
          <Icon name="location_on" />
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-md flex flex-col gap-stack-md">
        {/* Search + filters */}
        <section className="flex flex-col gap-stack-sm">
          <form action="/search" className="relative w-full">
            <Icon
              name="search"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary"
            />
            <input
              name="service"
              defaultValue={term ?? ""}
              className="w-full h-[56px] pl-12 pr-4 bg-surface-container-lowest border-2 border-outline rounded-lg focus:border-secondary font-body-lg text-on-surface placeholder:text-on-surface-variant outline-none"
              placeholder="Find a service (e.g. Plumber, Electrician)"
              type="text"
            />
          </form>
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {sorts.map((s) => {
              const active = sort === s.key;
              const href = term
                ? `/search?service=${encodeURIComponent(term)}&sort=${s.key}`
                : `/search?sort=${s.key}`;
              return (
                <Link
                  key={s.key}
                  href={href}
                  className={`shrink-0 h-[48px] px-4 rounded-full font-label-lg text-label-lg flex items-center gap-2 border-2 ${
                    active
                      ? "bg-tertiary-container text-on-tertiary-container border-transparent"
                      : "bg-surface-container-lowest border-outline-variant text-on-surface-variant"
                  }`}
                >
                  {s.icon && <Icon name={s.icon} className="text-lg" />}
                  {s.label}
                </Link>
              );
            })}
          </div>
        </section>

        <div className="flex justify-between items-center">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Available Professionals
          </h2>
          <span className="font-body-md text-on-surface-variant">
            {results.length} found
          </span>
        </div>

        {/* Results */}
        <section className="flex flex-col gap-stack-sm">
          {results.length === 0 && (
            <p className="text-on-surface-variant font-body-md py-8 text-center">
              No professionals match “{term}”. Try a different service.
            </p>
          )}
          {results.map((t) => (
            <article
              key={t.id}
              className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/20 shadow-sm flex flex-col sm:flex-row gap-4"
            >
              <div className="flex-shrink-0 self-start w-[80px] h-[80px] rounded-full bg-primary-container border-4 border-surface flex items-center justify-center text-white text-3xl font-bold">
                {t.name.charAt(0)}
              </div>
              <div className="flex flex-col flex-grow justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-headline-md text-xl font-bold text-on-surface flex items-center gap-1">
                        {t.name}
                        {t.verified && (
                          <Icon
                            name="verified"
                            fill
                            className="text-secondary text-lg"
                          />
                        )}
                      </h3>
                      <p className="font-body-md text-on-surface-variant flex items-center gap-1">
                        {t.services[0]?.name ?? "Tradesman"}
                        <span className="text-tertiary">•</span> {t.location}
                      </p>
                    </div>
                    <div className="bg-surface-container px-2 py-1 rounded flex items-center gap-1">
                      <Icon
                        name="star"
                        fill
                        className="text-secondary text-lg"
                      />
                      <span className="font-label-lg text-label-lg text-on-surface font-bold">
                        {t.avg_rating?.toFixed(1) ?? "—"}
                      </span>
                      <span className="text-on-surface-variant text-sm">
                        ({t.review_count})
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {t.services.slice(0, 3).map((s) => (
                      <span
                        key={s.name}
                        className="px-3 py-1 bg-tertiary-container/30 text-on-tertiary-container rounded-full font-label-lg text-xs"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-4">
                  <div className="font-body-lg text-on-surface">
                    <span className="font-bold text-primary">
                      ₱{minPrice(t.services)?.toLocaleString() ?? "—"}
                    </span>{" "}
                    <span className="text-on-surface-variant text-sm">
                      starting fee
                    </span>
                  </div>
                  <Link
                    href={`/tradesman/${t.id}`}
                    className="w-full sm:w-auto h-[48px] px-6 bg-primary text-on-primary font-cta text-cta rounded-lg flex items-center justify-center active:scale-95"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
