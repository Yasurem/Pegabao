import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/reviews — leave a review for a booking.
// Defense-in-depth: the app gates on booking status (reviews only for
// COMPLETED jobs), and the database enforces the rest — booking_id UNIQUE
// (one review per booking) and CHECK (rating BETWEEN 1 AND 5).
export async function POST(request: Request) {
  let body: { bookingId?: number; rating?: number; comment?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const bookingId = Number(body.bookingId);
  const rating = Number(body.rating);
  const comment = body.comment?.trim() || null;

  if (!Number.isInteger(bookingId)) {
    return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "rating must be an integer from 1 to 5" },
      { status: 400 }
    );
  }

  // App-layer rule: a review is only meaningful for a completed job.
  const booking = await query<{ status: string }>(
    `SELECT status FROM bookings WHERE id = $1`,
    [bookingId]
  );
  if (booking.rows.length === 0) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.rows[0].status !== "COMPLETED") {
    return NextResponse.json(
      { error: "You can only review a completed booking" },
      { status: 409 }
    );
  }

  try {
    const { rows } = await query<{ id: number }>(
      `INSERT INTO reviews (booking_id, rating, comment)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [bookingId, rating, comment]
    );
    return NextResponse.json({ id: rows[0].id }, { status: 201 });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "23505") {
      // unique_violation on booking_id
      return NextResponse.json(
        { error: "This booking has already been reviewed" },
        { status: 409 }
      );
    }
    if (code === "23514") {
      // check_violation on rating
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }
    throw err;
  }
}
