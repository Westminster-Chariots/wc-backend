import { Hono } from "hono";
import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { db } from "../db";
import { pricingConfig, flatZones } from "../db/schema";
import { requireAuth, requireAdmin } from "../middleware/auth";
import type { JwtPayload } from "../lib/jwt";

const router = new Hono<{ Variables: { user: JwtPayload } }>();

// GET /api/v1/pricing/config
router.get("/config", requireAuth, async (c) => {
  const rows = await db.query.pricingConfig.findMany({ orderBy: [asc(pricingConfig.vehicleType)] });
  return c.json(rows);
});

// PATCH /api/v1/pricing/config/:id — admin only
router.patch("/config/:id", requireAdmin, async (c) => {
  const user = c.get("user");
  const body = z.object({
    baseRate: z.number().optional(),
    ratePerMile: z.number().optional(),
    ratePerMinute: z.number().optional(),
    gratuityPercent: z.number().optional(),
    waitTimeHourly: z.number().optional(),
  }).safeParse(await c.req.json());

  if (!body.success) return c.json({ error: body.error.flatten() }, 400);
  const d = body.data;

  const [updated] = await db
    .update(pricingConfig)
    .set({
      ...(d.baseRate !== undefined && { baseRate: String(d.baseRate) }),
      ...(d.ratePerMile !== undefined && { ratePerMile: String(d.ratePerMile) }),
      ...(d.ratePerMinute !== undefined && { ratePerMinute: String(d.ratePerMinute) }),
      ...(d.gratuityPercent !== undefined && { gratuityPercent: String(d.gratuityPercent) }),
      ...(d.waitTimeHourly !== undefined && { waitTimeHourly: String(d.waitTimeHourly) }),
      updatedBy: user.sub,
      updatedAt: new Date(),
    })
    .where(eq(pricingConfig.id, c.req.param("id")))
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

// GET /api/v1/pricing/zones
router.get("/zones", requireAuth, async (c) => {
  const rows = await db.query.flatZones.findMany({ orderBy: [asc(flatZones.name)] });
  return c.json(rows);
});

// POST /api/v1/pricing/zones — admin only
router.post("/zones", requireAdmin, async (c) => {
  const body = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    sedanPrice: z.number(),
    suvPrice: z.number(),
    radiusMiles: z.number().default(0),
    isActive: z.boolean().default(true),
  }).safeParse(await c.req.json());

  if (!body.success) return c.json({ error: body.error.flatten() }, 400);
  const d = body.data;

  const [row] = await db
    .insert(flatZones)
    .values({
      name: d.name,
      code: d.code,
      sedanPrice: String(d.sedanPrice),
      suvPrice: String(d.suvPrice),
      radiusMiles: String(d.radiusMiles),
      isActive: d.isActive,
    })
    .returning();

  return c.json(row, 201);
});

// PATCH /api/v1/pricing/zones/:id — admin only
router.patch("/zones/:id", requireAdmin, async (c) => {
  const body = z.object({
    sedanPrice: z.number().optional(),
    suvPrice: z.number().optional(),
    radiusMiles: z.number().optional(),
    isActive: z.boolean().optional(),
  }).safeParse(await c.req.json());

  if (!body.success) return c.json({ error: body.error.flatten() }, 400);
  const d = body.data;

  const [updated] = await db
    .update(flatZones)
    .set({
      ...(d.sedanPrice !== undefined && { sedanPrice: String(d.sedanPrice) }),
      ...(d.suvPrice !== undefined && { suvPrice: String(d.suvPrice) }),
      ...(d.radiusMiles !== undefined && { radiusMiles: String(d.radiusMiles) }),
      ...(d.isActive !== undefined && { isActive: d.isActive }),
      updatedAt: new Date(),
    })
    .where(eq(flatZones.id, c.req.param("id")))
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

// DELETE /api/v1/pricing/zones/:id — admin only
router.delete("/zones/:id", requireAdmin, async (c) => {
  const existing = await db.query.flatZones.findFirst({ where: eq(flatZones.id, c.req.param("id")) });
  if (!existing) return c.json({ error: "Not found" }, 404);
  await db.delete(flatZones).where(eq(flatZones.id, c.req.param("id")));
  return c.json({ message: "Deleted" });
});

export default router;
