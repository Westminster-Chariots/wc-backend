import { Hono } from "hono";
import { z } from "zod";
import { eq, desc, asc, and } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "../db";
import { bookings, auditLog, drivers } from "../db/schema";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { buildPaymentLinkEmail, buildManifestEmail, buildCancellationEmail } from "../lib/email-templates";
import { env } from "../lib/env";
import { notifyBookingUpdate } from "../lib/pusher";
import type { JwtPayload } from "../lib/jwt";

const resend = new Resend(env.RESEND_API_KEY);

const router = new Hono<{ Variables: { user: JwtPayload } }>();

// ─── Helpers ────────────────────────────────────────────────────────────────

function calcPrice(distance: number, duration: number, vehicleType: string) {
  if (vehicleType === "suv") return 37 + 4.5 * distance + 1.55 * duration;
  return 30 + 4.0 * distance + 1.25 * duration;
}

function gatekeeperStatus(pickupDate: string, pickupTime: string) {
  const pickup = new Date(`${pickupDate}T${pickupTime}`);
  const diffHours = (pickup.getTime() - Date.now()) / 3_600_000;
  if (diffHours < 4) return "emergency";
  if (diffHours < 12) return "urgent";
  return "standard";
}

function generateReservationNumber() {
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const random = Math.random().toString(36).substring(2, 5).toUpperCase(); // 3 random chars
  return `WC${timestamp}${random}`;
}

async function writeAudit(
  action: string,
  entityId: string,
  performedBy: string,
  details: Record<string, unknown>
) {
  await db.insert(auditLog).values({
    action,
    entityType: "booking",
    entityId,
    performedBy,
    details: JSON.stringify(details),
  });
}

// ─── Schemas ────────────────────────────────────────────────────────────────

const LegSchema = z.object({
  pickup: z.string().min(1),
  dropoff: z.string().min(1),
  pickupDate: z.string(),
  pickupTime: z.string(),
  distanceMiles: z.number(),
  durationMinutes: z.number(),
});

const CreateBookingSchema = z.object({
  pickup: z.string().min(1),
  dropoff: z.string().min(1),
  pickupDate: z.string(),
  pickupTime: z.string(),
  vehicleType: z.enum(["sedan", "suv"]).default("sedan"),
  distanceMiles: z.number(),
  durationMinutes: z.number(),
  isAirportPickup: z.boolean().optional(),
  flightNumber: z.string().optional(),
  specialRequests: z.string().optional(),
  // guest / booking-for-someone-else fields
  clientName: z.string().optional(),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().optional(),
  // multi-leg
  additionalLegs: z.array(LegSchema).optional(),
});

const StatusSchema = z.object({
  status: z.enum(["pending", "assigned", "en_route", "on_site", "in_progress", "done", "cancelled"]),
});

// ─── Routes ─────────────────────────────────────────────────────────────────

// GET /api/v1/bookings — admin: all bookings; client: own bookings
router.get("/", requireAuth, async (c) => {
  const user = c.get("user");
  const { page = "0", pageSize = "50" } = c.req.query();
  const limit = Math.min(Number(pageSize), 200);
  const offset = Number(page) * limit;

  const rows =
    user.role === "admin"
      ? await db.query.bookings.findMany({
          orderBy: [asc(bookings.pickupDate), asc(bookings.pickupTime)],
          limit,
          offset,
        })
      : await db.query.bookings.findMany({
          where: eq(bookings.userId, user.sub),
          orderBy: [desc(bookings.pickupDate), desc(bookings.pickupTime)],
          limit,
          offset,
        });

  return c.json(rows);
});

// GET /api/v1/bookings/:id
router.get("/:id", requireAuth, async (c) => {
  const user = c.get("user");
  const row = await db.query.bookings.findFirst({ where: eq(bookings.id, c.req.param("id")) });
  if (!row) return c.json({ error: "Not found" }, 404);
  if (user.role !== "admin" && row.userId !== user.sub) return c.json({ error: "Forbidden" }, 403);
  return c.json(row);
});

// POST /api/v1/bookings — create booking (+ optional multi-leg)
router.post("/", requireAuth, async (c) => {
  const user = c.get("user");
  const body = CreateBookingSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const d = body.data;
  const distanceMiles = Math.round(d.distanceMiles * 10) / 10;
  const durationMinutes = Math.round(d.durationMinutes);
  const basePrice = calcPrice(distanceMiles, durationMinutes, d.vehicleType);
  const gratuity = Math.round(basePrice * 0.2 * 100) / 100;
  const totalPrice = Math.round((basePrice + gratuity) * 100) / 100;
  const gkStatus = gatekeeperStatus(d.pickupDate, d.pickupTime);
  const hasLegs = (d.additionalLegs?.length ?? 0) > 0;
  const tripGroupId = hasLegs ? `TG-${crypto.randomUUID().slice(0, 8).toUpperCase()}` : null;

  const clientName = d.clientName ?? user.email.split("@")[0];
  const clientEmail = d.clientEmail ?? user.email;
  const reservationNumber = generateReservationNumber();

  try {
    const [primary] = await db
      .insert(bookings)
      .values({
        userId: user.sub,
        reservationNumber,
        pickupLocation: d.pickup,
        dropoffLocation: d.dropoff,
        pickupDate: d.pickupDate,
        pickupTime: d.pickupTime + ':00', // Add seconds for PostgreSQL time format
        vehicleType: d.vehicleType,
        isAirportPickup: d.isAirportPickup ?? false,
        flightNumber: d.flightNumber ?? null,
        specialRequests: d.specialRequests ?? null,
        distanceMiles: distanceMiles.toString(),
        durationMinutes,
        basePrice: basePrice.toFixed(2),
        gratuity: gratuity.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
        gatekeeperStatus: gkStatus,
        clientName,
        clientEmail,
        clientPhone: d.clientPhone ?? null,
        tripGroupId,
        legOrder: 1,
        emailPhase: "none",
      })
      .returning();

    if (hasLegs && d.additionalLegs) {
      const legRows = d.additionalLegs.map((leg, i) => {
        const ld = Math.round(leg.distanceMiles * 10) / 10;
        const ldm = Math.round(leg.durationMinutes);
        const lp = calcPrice(ld, ldm, d.vehicleType);
        const lg = Math.round(lp * 0.2 * 100) / 100;
        return {
          userId: user.sub,
          reservationNumber: generateReservationNumber(),
          pickupLocation: leg.pickup,
          dropoffLocation: leg.dropoff,
          pickupDate: leg.pickupDate,
          pickupTime: leg.pickupTime + ':00',
          vehicleType: d.vehicleType,
          distanceMiles: ld.toString(),
          durationMinutes: ldm,
          basePrice: lp.toFixed(2),
          gratuity: lg.toFixed(2),
          totalPrice: (Math.round((lp + lg) * 100) / 100).toFixed(2),
          gatekeeperStatus: gatekeeperStatus(leg.pickupDate, leg.pickupTime),
          clientName,
          clientEmail,
          clientPhone: d.clientPhone ?? null,
          tripGroupId,
          legOrder: i + 2,
          emailPhase: "none",
        };
      });
      await db.insert(bookings).values(legRows);
    }

    return c.json(primary, 201);
  } catch (error) {
    console.error("Booking creation error:", error);
    return c.json({ error: "Internal server error", details: error.message }, 500);
  }
});

// PATCH /api/v1/bookings/:id/status — admin only
router.patch("/:id/status", requireAdmin, async (c) => {
  const user = c.get("user");
  const body = StatusSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const existing = await db.query.bookings.findFirst({ where: eq(bookings.id, c.req.param("id")) });
  if (!existing) return c.json({ error: "Not found" }, 404);

  // If cancelling and driver was assigned, send cancellation email
  if (body.data.status === "cancelled" && existing.driverId && existing.emailPhase === "manifest_sent") {
    const driver = await db.query.drivers.findFirst({ where: eq(drivers.id, existing.driverId) });
    if (driver?.email) {
      try {
        await resend.emails.send({
          from: "Westminster Chariots Dispatch <dispatch@westminsterchariots.com>",
          to: driver.email,
          subject: `Trip Cancelled - ${existing.reservationNumber}`,
          html: buildCancellationEmail(
            driver.name,
            existing.reservationNumber,
            existing.clientName,
            existing.pickupDate,
            existing.pickupTime,
            existing.pickupLocation,
            existing.dropoffLocation
          ),
        });
      } catch (emailError) {
        console.error("Failed to send cancellation email to driver:", emailError);
      }
    }
  }

  const [updated] = await db
    .update(bookings)
    .set({ status: body.data.status, updatedAt: new Date() })
    .where(eq(bookings.id, c.req.param("id")))
    .returning();

  await writeAudit("status_change", updated.id, user.sub, {
    reservationNumber: updated.reservationNumber,
    from: existing.status,
    to: body.data.status,
  });

  // Send Pusher notification to client
  await notifyBookingUpdate(
    updated.userId,
    updated.id,
    updated.status,
    updated.driverId ?? undefined,
    undefined // Driver name will be fetched if needed
  );

  return c.json(updated);
});

// PATCH /api/v1/bookings/:id/assign — admin only
router.patch("/:id/assign", requireAdmin, async (c) => {
  const user = c.get("user");
  const body = z.object({ driverId: z.string().uuid().nullable() }).safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const existing = await db.query.bookings.findFirst({ where: eq(bookings.id, c.req.param("id")) });
  if (!existing) return c.json({ error: "Not found" }, 404);

  const newStatus =
    body.data.driverId === null
      ? "pending"
      : existing.status === "pending"
      ? "assigned"
      : existing.status;

  const [updated] = await db
    .update(bookings)
    .set({ driverId: body.data.driverId, status: newStatus as any, updatedAt: new Date() })
    .where(eq(bookings.id, c.req.param("id")))
    .returning();

  await writeAudit(
    body.data.driverId ? "driver_assigned" : "driver_unassigned",
    updated.id,
    user.sub,
    { reservationNumber: updated.reservationNumber, driverId: body.data.driverId }
  );

  // Send Pusher notification if driver was assigned
  if (body.data.driverId && newStatus === "assigned") {
    const driver = await db.query.drivers.findFirst({ where: eq(drivers.id, body.data.driverId) });
    await notifyBookingUpdate(
      updated.userId,
      updated.id,
      updated.status,
      updated.driverId ?? undefined,
      driver?.name
    );
  }

  return c.json(updated);
});

// PATCH /api/v1/bookings/:id/notes — admin only
router.patch("/:id/notes", requireAdmin, async (c) => {
  const body = z.object({ dispatcherNotes: z.string() }).safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const [updated] = await db
    .update(bookings)
    .set({ dispatcherNotes: body.data.dispatcherNotes, updatedAt: new Date() })
    .where(eq(bookings.id, c.req.param("id")))
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

// PATCH /api/v1/bookings/:id/email-phase — admin only
router.patch("/:id/email-phase", requireAdmin, async (c) => {
  const body = z
    .object({
      emailPhase: z.enum(["none", "pending_sent", "payment_requested", "confirmed_sent", "manifest_sent"]),
    })
    .safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const [updated] = await db
    .update(bookings)
    .set({ emailPhase: body.data.emailPhase, updatedAt: new Date() })
    .where(eq(bookings.id, c.req.param("id")))
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

// DELETE /api/v1/bookings/:id — admin only
router.delete("/:id", requireAdmin, async (c) => {
  const user = c.get("user");
  const existing = await db.query.bookings.findFirst({ where: eq(bookings.id, c.req.param("id")) });
  if (!existing) return c.json({ error: "Not found" }, 404);

  await db.delete(bookings).where(eq(bookings.id, c.req.param("id")));

  await writeAudit("booking_deleted", existing.id, user.sub, {
    reservationNumber: existing.reservationNumber,
  });

  return c.json({ message: "Deleted" });
});

// POST /api/v1/bookings/:id/send-payment-link — admin only
router.post("/:id/send-payment-link", requireAdmin, async (c) => {
  const user = c.get("user");
  const body = z.object({ finalPrice: z.number() }).safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, c.req.param("id")) });
  if (!booking) return c.json({ error: "Not found" }, 404);

  // TODO: Generate Stripe payment link
  const paymentLink = `${env.ALLOWED_ORIGINS[0]}/book/checkout?booking=${booking.id}`;

  // Send email with payment link
  try {
    await resend.emails.send({
      from: "Westminster Chariots <no-reply@westminsterchariots.com>",
      to: booking.clientEmail,
      subject: `Complete Your Booking - ${booking.reservationNumber}`,
      html: buildPaymentLinkEmail(
        booking.clientName,
        booking.reservationNumber,
        booking.pickupDate,
        booking.pickupTime,
        booking.pickupLocation,
        booking.dropoffLocation,
        booking.vehicleType,
        body.data.finalPrice,
        paymentLink
      ),
    });
  } catch (emailError) {
    console.error("Failed to send payment link email:", emailError);
    return c.json({ error: "Failed to send email" }, 500);
  }

  await db
    .update(bookings)
    .set({ 
      totalPrice: body.data.finalPrice.toString(),
      emailPhase: "payment_requested",
      updatedAt: new Date() 
    })
    .where(eq(bookings.id, c.req.param("id")));

  await writeAudit("payment_link_sent", booking.id, user.sub, {
    reservationNumber: booking.reservationNumber,
    finalPrice: body.data.finalPrice,
  });

  return c.json({ message: "Payment link sent" });
});

// POST /api/v1/bookings/:id/send-manifest — admin only
router.post("/:id/send-manifest", requireAdmin, async (c) => {
  const user = c.get("user");
  const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, c.req.param("id")) });
  if (!booking) return c.json({ error: "Not found" }, 404);
  if (!booking.driverId) return c.json({ error: "No driver assigned" }, 400);

  const driver = await db.query.drivers.findFirst({ where: eq(drivers.id, booking.driverId) });
  if (!driver) return c.json({ error: "Driver not found" }, 404);
  if (!driver.email) return c.json({ error: "Driver has no email" }, 400);

  // Send email to driver with manifest
  try {
    await resend.emails.send({
      from: "Westminster Chariots Dispatch <dispatch@westminsterchariots.com>",
      to: driver.email,
      subject: `New Assignment - ${booking.reservationNumber}`,
      html: buildManifestEmail(
        driver.name,
        booking.reservationNumber,
        booking.clientName,
        booking.clientPhone || "N/A",
        booking.pickupDate,
        booking.pickupTime,
        booking.pickupLocation,
        booking.dropoffLocation,
        booking.vehicleType,
        booking.specialRequests
      ),
    });
  } catch (emailError) {
    console.error("Failed to send manifest email:", emailError);
    return c.json({ error: "Failed to send email" }, 500);
  }

  await db
    .update(bookings)
    .set({ emailPhase: "manifest_sent", updatedAt: new Date() })
    .where(eq(bookings.id, c.req.param("id")));

  await writeAudit("manifest_sent", booking.id, user.sub, {
    reservationNumber: booking.reservationNumber,
    driverId: driver.id,
    driverEmail: driver.email,
  });

  return c.json({ message: "Manifest sent to driver" });
});

// GET /api/v1/bookings/:id/driver — get driver info for booking
router.get("/:id/driver", requireAuth, async (c) => {
  const user = c.get("user");
  const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, c.req.param("id")) });
  
  if (!booking) return c.json({ error: "Booking not found" }, 404);
  if (user.role !== "admin" && booking.userId !== user.sub) {
    return c.json({ error: "Forbidden" }, 403);
  }
  if (!booking.driverId) {
    return c.json({ error: "No driver assigned yet" }, 404);
  }

  const driver = await db.query.drivers.findFirst({ where: eq(drivers.id, booking.driverId) });
  if (!driver) return c.json({ error: "Driver not found" }, 404);

  // Return driver info with vehicle details from booking
  return c.json({
    id: driver.id,
    name: driver.name,
    phone: driver.phone,
    photo: null, // TODO: Add photo field to drivers table
    rating: 4.8, // TODO: Add rating system
    vehicle: {
      make: booking.vehicleMake || "Mercedes-Benz",
      model: booking.vehicleModel || "S-Class",
      color: booking.vehicleColor || "Black",
      licensePlate: booking.licensePlate || "N/A",
    },
    currentLocation: driver.currentLocation || null,
  });
});

// PATCH /api/v1/bookings/:id/cancel — client can cancel their own booking
router.patch("/:id/cancel", requireAuth, async (c) => {
  const user = c.get("user");
  const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, c.req.param("id")) });
  
  if (!booking) return c.json({ error: "Booking not found" }, 404);
  if (user.role !== "admin" && booking.userId !== user.sub) {
    return c.json({ error: "Forbidden" }, 403);
  }
  if (!["pending", "assigned"].includes(booking.status)) {
    return c.json({ error: "Cannot cancel booking in current status" }, 400);
  }

  const [updated] = await db
    .update(bookings)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(bookings.id, c.req.param("id")))
    .returning();

  await writeAudit("booking_cancelled", updated.id, user.sub, {
    reservationNumber: updated.reservationNumber,
  });

  // Send Pusher notification
  await notifyBookingUpdate(
    updated.userId,
    updated.id,
    updated.status
  );

  return c.json(updated);
});

export default router;
