"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "./Icon";

const labels = ["Needs Improvement", "Fair", "Good", "Very Good", "Excellent work!"];

export function ReviewForm({ bookingId }: { bookingId: number }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (rating < 1) {
      setError("Please pick a star rating first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit review");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center text-center gap-stack-sm py-8">
        <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center">
          <Icon
            name="check"
            fill
            className="text-on-secondary-container text-[36px]"
          />
        </div>
        <p className="font-headline-md text-on-surface">Salamat sa iyong review!</p>
        <Link
          href="/customer"
          className="mt-2 h-touch-target-min px-6 bg-primary text-on-primary font-cta text-cta rounded-full flex items-center justify-center"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Stars */}
      <section className="flex flex-col items-center gap-stack-sm py-4">
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className="p-2 h-touch-target-min w-touch-target-min flex items-center justify-center active:scale-90 transition-transform"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              <Icon
                name="star"
                fill={n <= rating}
                className={`text-[40px] transition-colors ${
                  n <= rating ? "text-secondary-container" : "text-outline-variant"
                }`}
              />
            </button>
          ))}
        </div>
        <span className="font-label-lg text-label-lg text-secondary h-6">
          {rating > 0 ? labels[rating - 1] : ""}
        </span>
      </section>

      {/* Feedback */}
      <div className="flex flex-col gap-2">
        <label
          className="font-label-lg text-label-lg text-on-surface px-1"
          htmlFor="feedback"
        >
          Detailed Feedback
        </label>
        <textarea
          id="feedback"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ikwento ang karanasan…"
          className="w-full bg-surface-container-lowest border-2 border-tertiary/40 focus:border-secondary-container rounded-xl p-4 font-body-lg text-body-lg text-on-surface placeholder:text-on-surface-variant/50 resize-none outline-none"
        />
      </div>

      {error && <p className="font-body-md text-error">{error}</p>}

      {/* Fixed action */}
      <div className="fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur-md border-t border-outline-variant/20 p-margin-mobile z-40 pb-safe">
        <div className="md:max-w-2xl md:mx-auto w-full">
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="w-full h-[56px] bg-primary-container text-on-primary-container font-cta text-cta rounded-full flex items-center justify-center active:scale-[0.98] shadow-sm disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit Review"}
          </button>
        </div>
      </div>
    </>
  );
}
