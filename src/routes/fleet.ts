import { Hono } from "hono";
import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { db } from "../db";
import { fleet } from "../db/schema";
import { requireAuth, requireAdmin } from "../middleware/auth";
import type { JwtPayload } from "../lib/jwt";

const router = new Hono<{ Variables: { user: JwtPayload } }>();

const VehicleSchema = z.object({
  vehicleType: z.enum(["sedan", "suv"]),
  make: z.string().default("Mercedes-Benz"),
  model: z.string().min(1),
  plate: z.string().min(1),
  year: z.number().int().nullable().optional(),
  color: z.string().default("Black"),
  status: z.string().default("available"),
  imageUrl: z.string().url().nullable().optional(),
  passengerCapacity: z.number().int().default(3),
  luggageCapacity: z.number().int().default(2),
  notes: z.string().nullable().optional(),
});

// GET /api/v1/fleet — any authenticated user
router.get("/", requireAuth, async (c) => {
  const rows = await db.query.fleet.findMany({ orderBy: [asc(fleet.make), asc(fleet.model)] });
  return c.json(rows);
});

// GET /api/v1/fleet/:id
router.get("/:id", requireAuth, async (c) => {
  const row = await db.query.fleet.findFirst({ where: eq(fleet.id, c.req.param("id")) });
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

// POST /api/v1/fleet — admin only
router.post("/", requireAdmin, async (c) => {
  const body = VehicleSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);
  const [row] = await db.insert(fleet).values(body.data).returning();
  return c.json(row, 201);
});

// PATCH /api/v1/fleet/:id — admin only
router.patch("/:id", requireAdmin, async (c) => {
  const body = VehicleSchema.partial().safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const [updated] = await db
    .update(fleet)
    .set(body.data)
    .where(eq(fleet.id, c.req.param("id")))
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

// DELETE /api/v1/fleet/:id — admin only
router.delete("/:id", requireAdmin, async (c) => {
  const existing = await db.query.fleet.findFirst({ where: eq(fleet.id, c.req.param("id")) });
  if (!existing) return c.json({ error: "Not found" }, 404);
  await db.delete(fleet).where(eq(fleet.id, c.req.param("id")));
  return c.json({ message: "Deleted" });
});

export default router;
