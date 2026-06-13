import { notFound } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { query } from "@/lib/db";
import { ReviewForm } from "@/components/ReviewForm";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const id = Number(bookingId);
  if (!Number.isInteger(id)) notFound();

  const { rows } = await query<{
    tradesman: string;
    service: string;
    status: string;
    reviewed: boolean;
  }>(
    `SELECT t.name AS tradesman, s.name AS service, b.status,
            EXISTS (SELECT 1 FROM reviews r WHERE r.booking_id = b.id) AS reviewed
     FROM bookings b
     JOIN tradesmen t ON t.id = b.tradesman_id
     JOIN services  s ON s.id = b.service_id
     WHERE b.id = $1`,
    [id]
  );
  if (rows.length === 0) notFound();
  const booking = rows[0];

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <header className="sticky top-0 bg-surface border-b border-outline-variant/20 flex items-center justify-between px-margin-mobile h-[64px] z-40">
        <Link
          href="/customer"
          className="h-touch-target-min w-touch-target-min flex items-center justify-start text-on-surface-variant rounded-full"
          aria-label="Back"
        >
          <Icon name="arrow_back" className="text-[28px]" />
        </Link>
        <h1 className="font-headline-md text-headline-md font-bold text-primary absolute left-1/2 -translate-x-1/2">
          PegaBao
        </h1>
        <div className="h-touch-target-min w-touch-target-min" />
      </header>

      <main className="flex-1 flex flex-col px-margin-mobile py-stack-md gap-stack-md md:max-w-2xl md:mx-auto md:w-full pb-32">
        <section className="flex flex-col items-center text-center gap-stack-sm pt-4">
          <div className="w-[88px] h-[88px] rounded-full bg-primary-container flex items-center justify-center text-white text-3xl font-bold">
            {booking.tradesman.charAt(0)}
          </div>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface px-4">
            How was the service of {booking.tradesman}?
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {booking.service}
          </p>
        </section>

        {booking.reviewed ? (
          <p className="text-center font-body-md text-on-surface-variant bg-surface-container-low rounded-xl p-4">
            You&apos;ve already reviewed this booking. Salamat!
          </p>
        ) : booking.status !== "COMPLETED" ? (
          <p className="text-center font-body-md text-on-surface-variant bg-surface-container-low rounded-xl p-4">
            This booking is{" "}
            <span className="font-bold">{booking.status.toLowerCase()}</span>.
            You can leave a review once the job is completed.
          </p>
        ) : (
          <ReviewForm bookingId={id} />
        )}
      </main>
    </div>
  );
}
