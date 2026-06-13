import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/bookings — create a PENDING booking.
// No auth yet, so the booking is attributed to the first seeded customer.
// The composite FK (tradesman_id, service_id) → tradesman_services means the
// database itself rejects booking a service the tradesman doesn't offer.
export async function POST(request: Request) {
  let body: { tradesmanId?: number; serviceId?: number; scheduledFor?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const tradesmanId = Number(body.tradesmanId);
  const serviceId = Number(body.serviceId);
  if (!Number.isInteger(tradesmanId) || !Number.isInteger(serviceId)) {
    return NextResponse.json(
      { error: "tradesmanId and serviceId are required" },
      { status: 400 }
    );
  }

  const scheduledFor = body.scheduledFor
    ? new Date(body.scheduledFor)
    : new Date(Date.now() + 86_400_000);
  if (Number.isNaN(scheduledFor.getTime())) {
    return NextResponse.json({ error: "Invalid scheduledFor" }, { status: 400 });
  }

  // The offered price doubles as the total price estimate.
  const priceRes = await query<{ price: string }>(
    `SELECT price FROM tradesman_services WHERE tradesman_id = $1 AND service_id = $2`,
    [tradesmanId, serviceId]
  );
  if (priceRes.rows.length === 0) {
    return NextResponse.json(
      { error: "This tradesman does not offer that service" },
      { status: 400 }
    );
  }

  const customerRes = await query<{ id: number }>(
    `SELECT id FROM customers ORDER BY id LIMIT 1`
  );
  if (customerRes.rows.length === 0) {
    return NextResponse.json(
      { error: "No customer account available — seed the database first" },
      { status: 409 }
    );
  }

  try {
    const { rows } = await query<{ id: number }>(
      `INSERT INTO bookings
         (customer_id, tradesman_id, service_id, scheduled_for, status, total_price)
       VALUES ($1, $2, $3, $4, 'PENDING', $5)
       RETURNING id`,
      [
        customerRes.rows[0].id,
        tradesmanId,
        serviceId,
        scheduledFor.toISOString(),
        priceRes.rows[0].price,
      ]
    );
    return NextResponse.json({ id: rows[0].id }, { status: 201 });
  } catch (err) {
    // 23503 = foreign_key_violation (e.g. composite FK not satisfied)
    const code = (err as { code?: string }).code;
    if (code === "23503") {
      return NextResponse.json(
        { error: "Invalid tradesman/service combination" },
        { status: 400 }
      );
    }
    throw err;
  }
}
