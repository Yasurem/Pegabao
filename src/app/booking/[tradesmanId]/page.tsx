import { notFound } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { query } from "@/lib/db";
import { BookingForm } from "@/components/BookingForm";

export const dynamic = "force-dynamic";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ tradesmanId: string }>;
}) {
  const { tradesmanId } = await params;
  const id = Number(tradesmanId);
  if (!Number.isInteger(id)) notFound();

  const { rows: tm } = await query<{ name: string; location: string }>(
    `SELECT name, location FROM tradesmen WHERE id = $1`,
    [id]
  );
  if (tm.length === 0) notFound();

  const { rows: services } = await query<{
    service_id: number;
    name: string;
    category: string;
    price: number;
  }>(
    `SELECT ts.service_id, s.name, s.category, ts.price::float8 AS price
     FROM tradesman_services ts
     JOIN services s ON s.id = ts.service_id
     WHERE ts.tradesman_id = $1
     ORDER BY s.name`,
    [id]
  );

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <header className="sticky top-0 bg-surface border-b border-outline-variant/20 flex items-center gap-4 px-margin-mobile py-base h-[64px] z-50">
        <Link
          href={`/tradesman/${id}`}
          className="text-on-surface-variant p-2 rounded-full flex items-center justify-center min-h-[48px] min-w-[48px]"
          aria-label="Back"
        >
          <Icon name="arrow_back" />
        </Link>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">
          Confirm Booking
        </h1>
      </header>

      <BookingForm
        tradesmanId={id}
        tradesmanName={tm[0].name}
        location={tm[0].location}
        services={services}
      />
    </div>
  );
}
