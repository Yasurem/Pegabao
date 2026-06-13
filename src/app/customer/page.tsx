import Link from "next/link";
import { Icon } from "@/components/Icon";
import { BottomNav } from "@/components/BottomNav";
import { getCategories, getTopRatedTradesmen } from "@/lib/queries";

export const dynamic = "force-dynamic";

// Material icon per service category.
const categoryIcon: Record<string, string> = {
  Carpentry: "carpenter",
  Plumbing: "plumbing",
  Electrical: "electrical_services",
  Locksmith: "key",
  Painting: "format_paint",
};

export default async function CustomerHome() {
  const [categories, topRated] = await Promise.all([
    getCategories(),
    getTopRatedTradesmen(8),
  ]);

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-[100px]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface border-b border-outline-variant/20 flex justify-between items-center px-margin-mobile py-base">
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white">
          <Icon name="person" fill />
        </div>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">
          PegaBao
        </h1>
        <button className="w-10 h-10 flex items-center justify-center text-primary rounded-full">
          <Icon name="location_on" />
        </button>
      </header>

      <main className="px-margin-mobile pt-stack-sm flex flex-col gap-stack-md">
        {/* Location + search */}
        <section className="flex flex-col gap-base">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Icon name="my_location" className="text-sm" />
            <p className="font-body-md text-body-md font-semibold">
              Quezon City, Metro Manila
            </p>
            <Icon name="expand_more" className="text-sm" />
          </div>
          <form action="/search" className="relative w-full">
            <Icon
              name="search"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              name="service"
              className="w-full h-touch-target-min pl-12 pr-4 bg-surface-container-lowest border-2 border-on-tertiary-container/30 focus:border-secondary-container rounded-lg font-body-lg text-body-lg text-on-surface placeholder:text-on-surface-variant/60 shadow-sm outline-none"
              placeholder="Ano ang kailangang ayusin?"
              type="text"
            />
          </form>
        </section>

        {/* Service categories */}
        <section className="flex flex-col gap-stack-sm">
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
            Services
          </h2>
          <div className="grid grid-cols-3 gap-gutter">
            {categories.map((c) => (
              <Link
                key={c.category}
                href={`/search?service=${encodeURIComponent(c.category)}`}
                className="flex flex-col items-center justify-center gap-2 p-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-sm active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
                  <Icon
                    name={categoryIcon[c.category] ?? "build"}
                    fill
                    className="text-3xl"
                  />
                </div>
                <span className="font-label-lg text-label-lg text-on-surface text-center leading-tight">
                  {c.category}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Top-rated */}
        <section className="flex flex-col gap-stack-sm pb-8">
          <div className="flex justify-between items-end">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
              Top-rated near you
            </h2>
            <Link
              href="/search?sort=rating"
              className="font-label-lg text-label-lg text-primary font-bold"
            >
              See all
            </Link>
          </div>
          <div className="flex overflow-x-auto hide-scrollbar gap-4 snap-x pb-4 -mx-margin-mobile px-margin-mobile">
            {topRated.map((t) => (
              <Link
                key={t.id}
                href={`/tradesman/${t.id}`}
                className="min-w-[260px] bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 shadow-sm snap-start flex gap-4"
              >
                <div className="w-[72px] h-[72px] rounded-lg flex-shrink-0 bg-primary-container flex items-center justify-center text-white text-2xl font-bold">
                  {t.name.charAt(0)}
                </div>
                <div className="flex flex-col justify-center w-full">
                  <div className="flex items-center gap-1">
                    <h3 className="font-body-lg text-body-lg font-bold text-on-surface leading-none">
                      {t.name}
                    </h3>
                    {t.verified && (
                      <Icon
                        name="verified"
                        fill
                        className="text-on-tertiary-container text-base"
                      />
                    )}
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {t.services[0]?.name ?? "Tradesman"}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Icon
                      name="star"
                      fill
                      className="text-secondary-container text-xl"
                    />
                    <span className="font-label-lg text-label-lg font-bold text-on-surface">
                      {t.avg_rating?.toFixed(1) ?? "—"}
                    </span>
                    <span className="font-body-md text-body-md text-on-surface-variant ml-1">
                      ({t.completed_jobs} jobs)
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
