import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { Resend } from "resend";
import { db } from "../db";
import { bookings, drivers } from "../db/schema";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { buildBookingEmailHtml, buildManifestHtml } from "../lib/email";
import { env } from "../lib/env";
import type { JwtPayload } from "../lib/jwt";
import type { JwtPayload } from "../lib/jwt";

const router = new Hono<{ Variables: { user: JwtPayload } }>();
const stripe = new Stripe(env.STRIPE_SECRET_KEY ?? "");
const resend = new Resend(env.RESEND_API_KEY);

const ADMIN_EMAIL = "book@westminsterchariots.com";

// POST /api/v1/payments/checkout — create Stripe checkout session
router.post("/checkout", requireAdmin, async (c) => {
  const body = z.object({
    bookingId: z.string().uuid(),
    clientEmail: z.string().email(),
    amount: z.number().positive(),
  }).safeParse(await c.req.json());

  if (!body.success) return c.json({ error: body.error.flatten() }, 400);
  const { bookingId, clientEmail, amount } = body.data;

  const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, bookingId) });
  if (!booking) return c.json({ error: "Booking not found" }, 404);

  const customers = await stripe.customers.list({ email: clientEmail, limit: 1 });
  const customerId = customers.data[0]?.id ?? (
    await stripe.customers.create({ email: clientEmail })
  ).id;

  const origin = env.ALLOWED_ORIGINS[0];
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: {
          name: `Westminster Chariots — ${booking.vehicleType === "suv" ? "Business SUV" : "Business Class"}`,
          description: `${booking.pickupLocation} → ${booking.dropoffLocation} on ${booking.pickupDate} at ${booking.pickupTime}`,
        },
        unit_amount: Math.round(amount * 100),
      },
      quantity: 1,
    }],
    mode: "payment",
    success_url: `${origin}/booking-confirmed?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.reservationNumber}`,
    cancel_url: `${origin}/book`,
    metadata: { booking_id: bookingId },
  });

  // Send payment link email to client
  try {
    const result = await resend.emails.send({
      from: "Westminster Chariots <book@mail.westminsterchariots.com>",
      to: clientEmail,
      subject: `Payment Requested — ${booking.reservationNumber}`,
      html: buildBookingEmailHtml(
        { ...booking, pickupTime: booking.pickupTime, pickupDate: booking.pickupDate },
        "payment_requested",
        undefined,
        session.url!
      ),
    });
    console.log("Stripe checkout payment email sent:", result);
  } catch (emailError: any) {
    console.error("Failed to send Stripe checkout payment email:", emailError);
    console.error("Email error details:", JSON.stringify(emailError, null, 2));
  }

  // Update email phase
  await db.update(bookings).set({ emailPhase: "payment_requested", updatedAt: new Date() }).where(eq(bookings.id, bookingId));

  return c.json({ url: session.url });
});

// POST /api/v1/payments/webhook — Stripe webhook
router.post("/webhook", async (c) => {
  const sig = c.req.header("stripe-signature");
  const rawBody = await c.req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, env.STRIPE_WEBHOOK_SECRET ?? "");
  } catch {
    return c.json({ error: "Invalid signature" }, 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;
    if (bookingId) {
      await db.update(bookings)
        .set({ emailPhase: "payment_received", updatedAt: new Date() })
        .where(eq(bookings.id, bookingId));
    }
  }

  return c.json({ received: true });
});

// POST /api/v1/payments/send-booking-email — booking lifecycle emails (authenticated users & admin)
router.post("/send-booking-email", requireAuth, async (c) => {
  const user = c.get("user");
  const body = z.object({
    bookingId: z.string().uuid(),
    phase: z.enum(["pending", "confirmed", "cancelled"]),
  }).safeParse(await c.req.json());

  if (!body.success) return c.json({ error: body.error.flatten() }, 400);
  const { bookingId, phase } = body.data;

  const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, bookingId) });
  if (!booking) return c.json({ error: "Booking not found" }, 404);

  // Only allow users to send "pending" emails for their own bookings
  // Only admins can send "confirmed" and "cancelled" emails
  if (phase !== "pending" && user.role !== "admin") {
    return c.json({ error: "Only admins can send confirmation and cancellation emails" }, 403);
  }

  // If user is not admin and phase is pending, verify it's their booking
  if (user.role !== "admin" && booking.userId !== user.sub) {
    return c.json({ error: "Can only send emails for your own bookings" }, 403);
  }

  const clientEmail = booking.clientEmail;
  if (!clientEmail) return c.json({ error: "No client email on booking" }, 400);

  let driverName: string | undefined;
  if (phase === "confirmed" && booking.driverId) {
    const driver = await db.query.drivers.findFirst({ where: eq(drivers.id, booking.driverId) });
    driverName = driver?.name;
  }

  const subjectMap = {
    pending: `Booking Received — ${booking.reservationNumber}`,
    confirmed: `Booking Confirmed — ${booking.reservationNumber}`,
    cancelled: `Cancellation Confirmed — ${booking.reservationNumber}`,
  };

  const phaseMap = { pending: "pending_sent", confirmed: "confirmed_sent", cancelled: "cancelled_sent" };

  try {
    const result = await resend.emails.send({
      from: "Westminster Chariots <book@mail.westminsterchariots.com>",
      to: clientEmail,
      subject: subjectMap[phase],
      html: buildBookingEmailHtml(booking, phase, driverName),
    });
    console.log(`Booking ${phase} email sent to client:`, result);

    // Admin notification for pending bookings from users
    if (phase === "pending") {
      const adminEmails = ["admin@westminsterchariots.com", "westminsterchariots@gmail.com"];
      const adminPromises = adminEmails.map(adminEmail =>
        resend.emails.send({
          from: "Westminster Chariots <book@mail.westminsterchariots.com>",
          to: adminEmail,
          subject: `New Booking Request — ${booking.reservationNumber}`,
          html: buildBookingEmailHtml(booking, phase),
        })
      );
      await Promise.all(adminPromises);
      console.log("Admin notification emails sent for booking:", booking.reservationNumber);
    }

    await db.update(bookings)
      .set({ emailPhase: phaseMap[phase], updatedAt: new Date() })
      .where(eq(bookings.id, bookingId));

    return c.json({ success: true, phase: phaseMap[phase] });
  } catch (emailError) {
    console.error("Failed to send booking email:", emailError);
    console.error("Email error details:", JSON.stringify(emailError, null, 2));
    return c.json({ error: "Failed to send email" }, 500);
  }
});

// POST /api/v1/payments/forward-manifest — send manifest to driver email
router.post("/forward-manifest", requireAdmin, async (c) => {
  const body = z.object({
    bookingId: z.string().uuid(),
    driverEmail: z.string().email(),
    driverName: z.string().optional(),
  }).safeParse(await c.req.json());

  if (!body.success) return c.json({ error: body.error.flatten() }, 400);
  const { bookingId, driverEmail, driverName } = body.data;

  const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, bookingId) });
  if (!booking) return c.json({ error: "Booking not found" }, 404);

  const name = driverName ?? "Driver";

  try {
    const result = await resend.emails.send({
      from: "Westminster Chariots <dispatch@mail.westminsterchariots.com>",
      to: driverEmail,
      subject: `WC Trip Manifest — ${booking.reservationNumber} | ${booking.pickupDate}`,
      html: buildManifestHtml(booking, name),
    });
    console.log("Forward manifest email sent:", result);
  } catch (emailError: any) {
    console.error("Failed to send forward manifest email:", emailError);
    console.error("Email error details:", JSON.stringify(emailError, null, 2));
    return c.json({ error: "Failed to send email" }, 500);
  }

  await db.update(bookings)
    .set({ emailPhase: "manifest_sent", updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));

  return c.json({ success: true, message: `Manifest sent to ${driverEmail}` });
});

export default router;
