"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "./Icon";

type Service = {
  service_id: number;
  name: string;
  category: string;
  price: number;
};

export function BookingForm({
  tradesmanId,
  tradesmanName,
  location,
  services,
}: {
  tradesmanId: number;
  tradesmanName: string;
  location: string;
  services: Service[];
}) {
  const [serviceId, setServiceId] = useState<number | null>(
    services[0]?.service_id ?? null
  );
  const [scheduledFor, setScheduledFor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);

  const selected = services.find((s) => s.service_id === serviceId) ?? null;

  async function submit() {
    if (serviceId == null) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tradesmanId,
          serviceId,
          scheduledFor: scheduledFor || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed");
      setBookingId(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  // Success state
  if (bookingId != null) {
    return (
      <main className="flex-grow flex flex-col items-center justify-center px-margin-mobile py-stack-md text-center gap-stack-sm">
        <div className="w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center">
          <Icon
            name="check_circle"
            fill
            className="text-on-secondary-container text-[48px]"
          />
        </div>
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
          Booking requested!
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-[300px]">
          Your request (#{bookingId}) was sent to {tradesmanName}. You&apos;ll be
          notified once it&apos;s accepted.
        </p>
        <Link
          href="/customer"
          className="mt-stack-sm h-touch-target-min px-6 bg-primary text-on-primary font-cta text-cta rounded-lg flex items-center justify-center"
        >
          Back to Home
        </Link>
      </main>
    );
  }

  return (
    <>
      <main className="flex-grow px-margin-mobile md:px-margin-desktop py-stack-md max-w-2xl mx-auto w-full pb-32">
        {/* Progress */}
        <div className="mb-stack-md">
          <div className="flex justify-between items-center mb-2">
            <span className="font-label-lg text-label-lg text-on-surface-variant">
              Details
            </span>
            <span className="font-label-lg text-label-lg text-on-surface-variant">
              Schedule
            </span>
            <span className="font-label-lg text-label-lg text-primary">
              Confirm
            </span>
          </div>
          <div className="flex w-full h-2 bg-surface-variant rounded-full overflow-hidden">
            <div className="h-full bg-primary w-full" />
          </div>
        </div>

        <h2 className="font-headline-lg-mobile text-headline-lg-mobile mb-stack-sm text-on-surface">
          Review Details
        </h2>

        {/* Service selection */}
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-margin-mobile mb-stack-md shadow-sm flex flex-col gap-stack-sm">
          <label className="font-label-lg text-label-lg text-on-surface">
            Select a service
          </label>
          <div className="flex flex-col gap-2">
            {services.map((s) => (
              <label
                key={s.service_id}
                className={`flex items-center justify-between gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  serviceId === s.service_id
                    ? "border-secondary bg-secondary-container/10"
                    : "border-outline-variant/40"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="service"
                    className="accent-primary"
                    checked={serviceId === s.service_id}
                    onChange={() => setServiceId(s.service_id)}
                  />
                  <span className="flex flex-col">
                    <span className="font-body-md text-on-surface">{s.name}</span>
                    <span className="font-body-md text-on-surface-variant text-[12px]">
                      {s.category}
                    </span>
                  </span>
                </span>
                <span className="font-headline-md text-primary font-bold">
                  ₱{s.price.toLocaleString()}
                </span>
              </label>
            ))}
          </div>

          <hr className="border-outline-variant/20" />

          <div className="flex items-start gap-4 text-on-surface-variant">
            <Icon name="location_on" className="text-[18px]" />
            <p className="font-body-md text-body-md">{location}</p>
          </div>
        </div>

        {/* Schedule */}
        <div className="mb-stack-md">
          <label
            className="block font-label-lg text-label-lg text-on-surface mb-2"
            htmlFor="schedule"
          >
            Preferred schedule
          </label>
          <input
            id="schedule"
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="w-full bg-surface-container-lowest border-2 border-outline focus:border-secondary rounded p-3 font-body-md text-on-surface outline-none"
          />
        </div>

        {error && (
          <p className="font-body-md text-error mb-stack-sm">{error}</p>
        )}
      </main>

      {/* Fixed action */}
      <div className="fixed bottom-0 left-0 w-full bg-surface border-t border-outline-variant/20 p-margin-mobile pb-safe z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          {selected && (
            <div className="font-body-md text-on-surface-variant">
              Est.{" "}
              <span className="font-bold text-primary">
                ₱{selected.price.toLocaleString()}
              </span>
            </div>
          )}
          <button
            onClick={submit}
            disabled={submitting || serviceId == null}
            className="flex-1 max-w-[280px] ml-auto bg-primary text-on-primary font-cta text-cta h-touch-target-min rounded flex items-center justify-center active:scale-95 disabled:opacity-60"
          >
            {submitting ? "Booking…" : "Confirm Booking"}
          </button>
        </div>
      </div>
    </>
  );
}
