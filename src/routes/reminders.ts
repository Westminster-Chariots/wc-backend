import { Hono } from "hono";
import { and, eq, gte, lte, inArray, isNotNull } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "../db";
import { bookings } from "../db/schema";
import { buildReminderHtml } from "../lib/email";
import { env } from "../lib/env";

const router = new Hono();
const resend = new Resend(env.RESEND_API_KEY);

// POST /api/v1/reminders/process — called by cron, secured by shared secret
router.post("/process", async (c) => {
  const secret = c.req.header("x-cron-secret");
  if (secret !== env.JWT_SECRET) return c.json({ error: "Unauthorized" }, 401);

  const now = new Date();
  const in25h = new Date(now.getTime() + 25 * 3_600_000);
  const todayStr = now.toISOString().split("T")[0];
  const tomorrowStr = in25h.toISOString().split("T")[0];

  const upcoming = await db.query.bookings.findMany({
    where: and(
      inArray(bookings.status, ["pending", "assigned"]),
      gte(bookings.pickupDate, todayStr),
      lte(bookings.pickupDate, tomorrowStr),
      isNotNull(bookings.clientEmail)
    ),
  });

  let sent24h = 0, sent1h = 0, skipped = 0;

  for (const booking of upcoming) {
    const pickupDT = new Date(`${booking.pickupDate}T${booking.pickupTime}`);
    const hoursUntil = (pickupDT.getTime() - now.getTime()) / 3_600_000;
    const phase = booking.emailPhase ?? "none";

    let type: "24h" | "1h" | null = null;
    if (hoursUntil >= 23 && hoursUntil <= 25 && !phase.includes("reminder_24h")) type = "24h";
    else if (hoursUntil >= 0.5 && hoursUntil <= 1.5 && !phase.includes("reminder_1h")) type = "1h";

    if (!type) { skipped++; continue; }

    try {
      await resend.emails.send({
        from: "Westminster Chariots <book@westminsterchariots.com>",
        to: booking.clientEmail!,
        subject: type === "24h"
          ? `Reminder: Your ride tomorrow — ${booking.reservationNumber}`
          : `Arriving soon: Your ride in 1 hour — ${booking.reservationNumber}`,
        html: buildReminderHtml(booking, type),
      });

      const newPhase = phase === "none" ? `reminder_${type}` : `${phase},reminder_${type}`;
      await db.update(bookings)
        .set({ emailPhase: newPhase, updatedAt: new Date() })
        .where(eq(bookings.id, booking.id));

      if (type === "24h") sent24h++; else sent1h++;
    } catch {
      skipped++;
    }
  }

  return c.json({ processed: upcoming.length, sent24h, sent1h, skipped });
});

export default router;
