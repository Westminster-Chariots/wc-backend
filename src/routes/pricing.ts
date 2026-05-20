import { Hono } from "hono";
import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { db } from "../db";
import { pricingConfig, flatZones, vehiclePricing } from "../db/schema";
import { requireAuth, requireAdmin } from "../middleware/auth";
import type { JwtPayload } from "../lib/jwt";

const router = new Hono<{ Variables: { user: JwtPayload } }>();

// POST /api/v1/pricing/calculate — calculate price for a trip
router.post("/calculate", requireAuth, async (c) => {
  const body = z.object({
    distanceMiles: z.number(),
    durationMinutes: z.number(),
    vehicleType: z.string(),
  }).safeParse(await c.req.json());

  if (!body.success) return c.json({ error: body.error.flatten() }, 400);
  const { distanceMiles, durationMinutes, vehicleType } = body.data;

  // Get pricing config from database
  const vehicleTypeNormalized = vehicleType.toLowerCase();
  const config = await db.query.pricingConfig.findFirst({
    where: eq(pricingConfig.vehicleType, vehicleTypeNormalized)
  });

  if (!config) {
    return c.json({ error: "Pricing config not found for vehicle type" }, 404);
  }

  // Calculate price using database formula:
  // Price = baseRate + (ratePerMile × miles) + (ratePerMinute × minutes)
  const baseRate = parseFloat(config.baseRate);
  const ratePerMile = parseFloat(config.ratePerMile);
  const ratePerMinute = parseFloat(config.ratePerMinute);
  const taxPercent = parseFloat(config.taxPercent);

  const subtotal = baseRate + (ratePerMile * distanceMiles) + (ratePerMinute * durationMinutes);
  const tax = subtotal * (taxPercent / 100);
  const total = subtotal + tax;

  return c.json({
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    breakdown: {
      baseRate,
      ratePerMile,
      ratePerMinute,
      distanceMiles,
      durationMinutes,
      taxPercent,
    }
  });
});

// GET /api/v1/pricing/config
router.get("/config", requireAuth, async (c) => {
  const rows = await db.query.pricingConfig.findMany({ orderBy: [asc(pricingConfig.vehicleType)] });
  return c.json(rows);
});

// POST /api/v1/pricing/config — admin only (create new pricing config)
router.post("/config", requireAdmin, async (c) => {
  const user = c.get("user");
  const body = z.object({
    vehicleType: z.string().min(1),
    baseRate: z.number().default(30),
    ratePerMile: z.number().default(4.0),
    ratePerMinute: z.number().default(1.25),
    taxPercent: z.number().default(20),
    waitTimeHourly: z.number().default(95),
  }).safeParse(await c.req.json());

  if (!body.success) return c.json({ error: body.error.flatten() }, 400);
  const d = body.data;

  // Check if config already exists for this vehicle type
  const existing = await db.query.pricingConfig.findFirst({
    where: eq(pricingConfig.vehicleType, d.vehicleType.toLowerCase())
  });

  if (existing) {
    return c.json({ error: "Pricing config already exists for this vehicle type" }, 409);
  }

  const [row] = await db
    .insert(pricingConfig)
    .values({
      vehicleType: d.vehicleType.toLowerCase(),
      baseRate: String(d.baseRate),
      ratePerMile: String(d.ratePerMile),
      ratePerMinute: String(d.ratePerMinute),
      taxPercent: String(d.taxPercent),
      waitTimeHourly: String(d.waitTimeHourly),
      updatedBy: user.sub,
    })
    .returning();

  return c.json(row, 201);
});

// PATCH /api/v1/pricing/config/:id — admin only
router.patch("/config/:id", requireAdmin, async (c) => {
  const user = c.get("user");
  const body = z.object({
    baseRate: z.number().optional(),
    ratePerMile: z.number().optional(),
    ratePerMinute: z.number().optional(),
    taxPercent: z.number().optional(),
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
      ...(d.taxPercent !== undefined && { taxPercent: String(d.taxPercent) }),
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

// GET /api/v1/pricing/vehicles — get all vehicle-specific pricing
router.get("/vehicles", requireAuth, async (c) => {
  const rows = await db.query.vehiclePricing.findMany();
  return c.json(rows);
});

// GET /api/v1/pricing/vehicles/:vehicleId — get pricing for specific vehicle
router.get("/vehicles/:vehicleId", requireAuth, async (c) => {
  const row = await db.query.vehiclePricing.findFirst({
    where: eq(vehiclePricing.vehicleId, c.req.param("vehicleId"))
  });
  if (!row) return c.json(null);
  return c.json(row);
});

// PUT /api/v1/pricing/vehicles/:vehicleId — upsert vehicle-specific pricing (admin only)
router.put("/vehicles/:vehicleId", requireAdmin, async (c) => {
  const user = c.get("user");
  const vehicleId = c.req.param("vehicleId");
  
  const body = z.object({
    baseRate: z.number().optional(),
    ratePerMile: z.number().optional(),
    ratePerMinute: z.number().optional(),
    taxPercent: z.number().optional(),
  }).safeParse(await c.req.json());

  if (!body.success) return c.json({ error: body.error.flatten() }, 400);
  const d = body.data;

  // Check if pricing already exists
  const existing = await db.query.vehiclePricing.findFirst({
    where: eq(vehiclePricing.vehicleId, vehicleId)
  });

  if (existing) {
    // Update existing
    const [updated] = await db
      .update(vehiclePricing)
      .set({
        ...(d.baseRate !== undefined && { baseRate: String(d.baseRate) }),
        ...(d.ratePerMile !== undefined && { ratePerMile: String(d.ratePerMile) }),
        ...(d.ratePerMinute !== undefined && { ratePerMinute: String(d.ratePerMinute) }),
        ...(d.taxPercent !== undefined && { taxPercent: String(d.taxPercent) }),
        updatedBy: user.sub,
        updatedAt: new Date(),
      })
      .where(eq(vehiclePricing.vehicleId, vehicleId))
      .returning();
    return c.json(updated);
  } else {
    // Create new
    const [created] = await db
      .insert(vehiclePricing)
      .values({
        vehicleId,
        ...(d.baseRate !== undefined && { baseRate: String(d.baseRate) }),
        ...(d.ratePerMile !== undefined && { ratePerMile: String(d.ratePerMile) }),
        ...(d.ratePerMinute !== undefined && { ratePerMinute: String(d.ratePerMinute) }),
        ...(d.taxPercent !== undefined && { taxPercent: String(d.taxPercent) }),
        updatedBy: user.sub,
      })
      .returning();
    return c.json(created, 201);
  }
});

// DELETE /api/v1/pricing/vehicles/:vehicleId — delete vehicle-specific pricing (admin only)
router.delete("/vehicles/:vehicleId", requireAdmin, async (c) => {
  const existing = await db.query.vehiclePricing.findFirst({
    where: eq(vehiclePricing.vehicleId, c.req.param("vehicleId"))
  });
  if (!existing) return c.json({ error: "Not found" }, 404);
  
  await db.delete(vehiclePricing).where(eq(vehiclePricing.vehicleId, c.req.param("vehicleId")));
  return c.json({ message: "Deleted" });
});

export default router;
