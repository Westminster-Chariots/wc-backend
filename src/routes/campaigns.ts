import { Hono } from "hono";
import { z } from "zod";
import { eq, lte, desc, and, isNotNull } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "../db";
import { campaignHistory, profiles, bookings } from "../db/schema";
import { requireAdmin } from "../middleware/auth";
import { buildPromoHtml } from "../lib/email";
import { env } from "../lib/env";
import type { JwtPayload } from "../lib/jwt";

const router = new Hono<{ Variables: { user: JwtPayload } }>();
const resend = new Resend(env.RESEND_API_KEY);

const CampaignSchema = z.object({
  audience: z.enum(["all", "first_time", "repeat", "corporate", "inactive", "recent"]),
  subject: z.string().min(1),
  heading: z.string().min(1),
  body: z.string().min(1),
  ctaText: z.string().default("Book Now"),
  ctaUrl: z.string().default("https://westminsterchariots.com/book"),
  scheduledFor: z.string().nullable().optional(),
});

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getRecipients(audience: string) {
  const allProfiles = await db.query.profiles.findMany({
    where: isNotNull(profiles.email),
  });

  if (audience === "all") return allProfiles;
  if (audience === "corporate") return allProfiles.filter((p) => p.isCorporate);

  const userIds = allProfiles.map((p) => p.userId);
  const allBookings = await db.query.bookings.findMany();

  const byUser: Record<string, typeof allBookings> = {};
  for (const b of allBookings) {
    if (!b.userId) continue;
    if (!byUser[b.userId]) byUser[b.userId] = [];
    byUser[b.userId].push(b);
  }

  const now = Date.now();
  const day = 86_400_000;

  return allProfiles.filter((p) => {
    const ub = (byUser[p.userId] ?? []).filter((b) => b.status !== "cancelled");
    if (audience === "first_time") return ub.length === 1;
    if (audience === "repeat") return ub.length >= 3;
    if (audience === "inactive") {
      if (ub.length === 0) return true;
      const last = Math.max(...ub.map((b) => new Date(b.pickupDate).getTime()));
      return now - last > 60 * day;
    }
    if (audience === "recent") {
      if (ub.length === 0) return false;
      const last = Math.max(...ub.map((b) => new Date(b.pickupDate).getTime()));
      return now - last <= 7 * day;
    }
    return false;
  });
}

async function sendBatch(
  recipients: { email: string | null; displayName: string | null }[],
  subject: string,
  heading: string,
  body: string,
  ctaText: string,
  ctaUrl: string
) {
  let sent = 0, failed = 0;
  for (let i = 0; i < recipients.length; i += 5) {
    const batch = recipients.slice(i, i + 5);
    await Promise.allSettled(
      batch.map(async (r) => {
        if (!r.email) { failed++; return; }
        try {
          const result = await resend.emails.send({
            from: "Westminster Chariots <info@mail.westminsterchariots.com>",
            to: r.email,
            subject,
            html: buildPromoHtml(heading, body, ctaText, ctaUrl, r.displayName ?? "Valued Client"),
          });
          console.log("Campaign email sent to:", r.email);
          sent++;
        } catch (err: any) {
          console.error("Failed to send campaign email to:", r.email, err);
          failed++;
        }
      })
    );
  }
  return { sent, failed };
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// GET /api/v1/campaigns — history
router.get("/", requireAdmin, async (c) => {
  const rows = await db.query.campaignHistory.findMany({
    orderBy: [desc(campaignHistory.createdAt)],
    limit: 50,
  });
  return c.json(rows);
});

// GET /api/v1/campaigns/count?audience=all
router.get("/count", requireAdmin, async (c) => {
  const audience = c.req.query("audience") ?? "all";
  const recipients = await getRecipients(audience);
  return c.json({ count: recipients.length });
});

// POST /api/v1/campaigns/send
router.post("/send", requireAdmin, async (c) => {
  const user = c.get("user");
  const body = CampaignSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);
  const d = body.data;

  // Schedule
  if (d.scheduledFor) {
    const recipients = await getRecipients(d.audience);
    const [row] = await db.insert(campaignHistory).values({
      subject: d.subject,
      heading: d.heading,
      body: d.body,
      ctaText: d.ctaText,
      ctaUrl: d.ctaUrl,
      audience: d.audience,
      recipientCount: recipients.length,
      status: "scheduled",
      scheduledFor: new Date(d.scheduledFor),
      createdBy: user.sub,
    }).returning();
    return c.json({ scheduled: true, recipientCount: recipients.length, campaign: row }, 201);
  }

  // Send now
  const recipients = await getRecipients(d.audience);
  const { sent, failed } = await sendBatch(recipients, d.subject, d.heading, d.body, d.ctaText, d.ctaUrl);

  const [row] = await db.insert(campaignHistory).values({
    subject: d.subject,
    heading: d.heading,
    body: d.body,
    ctaText: d.ctaText,
    ctaUrl: d.ctaUrl,
    audience: d.audience,
    recipientCount: recipients.length,
    sentCount: sent,
    failedCount: failed,
    status: "sent",
    sentAt: new Date(),
    createdBy: user.sub,
  }).returning();

  return c.json({ sent, failed, total: recipients.length, campaign: row });
});

// PATCH /api/v1/campaigns/:id/cancel — cancel a scheduled campaign
router.patch("/:id/cancel", requireAdmin, async (c) => {
  const [updated] = await db
    .update(campaignHistory)
    .set({ status: "cancelled" })
    .where(eq(campaignHistory.id, c.req.param("id")))
    .returning();
  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

// POST /api/v1/campaigns/process-scheduled — called by cron job
router.post("/process-scheduled", async (c) => {
  // Secured by a shared secret header instead of JWT (cron caller)
  const secret = c.req.header("x-cron-secret");
  if (secret !== env.JWT_SECRET) return c.json({ error: "Unauthorized" }, 401);

  const due = await db.query.campaignHistory.findMany({
    where: and(
      eq(campaignHistory.status, "scheduled"),
      lte(campaignHistory.scheduledFor!, new Date())
    ),
  });

  let processed = 0;
  for (const campaign of due) {
    await db.update(campaignHistory).set({ status: "sending" }).where(eq(campaignHistory.id, campaign.id));
    const recipients = await getRecipients(campaign.audience);
    const { sent, failed } = await sendBatch(
      recipients,
      campaign.subject,
      campaign.heading,
      campaign.body,
      campaign.ctaText ?? "Book Now",
      campaign.ctaUrl ?? "https://westminsterchariots.com/book"
    );
    await db.update(campaignHistory).set({
      status: "sent",
      sentCount: sent,
      failedCount: failed,
      recipientCount: recipients.length,
      sentAt: new Date(),
    }).where(eq(campaignHistory.id, campaign.id));
    processed++;
  }

  return c.json({ processed, total: due.length });
});

export default router;
