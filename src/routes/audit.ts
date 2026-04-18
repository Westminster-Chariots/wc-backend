import { Hono } from "hono";
import { z } from "zod";
import { desc } from "drizzle-orm";
import { db } from "../db";
import { auditLog } from "../db/schema";
import { requireAdmin } from "../middleware/auth";
import type { JwtPayload } from "../lib/jwt";

const router = new Hono<{ Variables: { user: JwtPayload } }>();

// GET /api/v1/audit — admin only, last 200 entries
router.get("/", requireAdmin, async (c) => {
  const rows = await db.query.auditLog.findMany({
    orderBy: [desc(auditLog.createdAt)],
    limit: 200,
  });
  return c.json(rows);
});

// POST /api/v1/audit — admin only, manual log entry
router.post("/", requireAdmin, async (c) => {
  const user = c.get("user");
  const body = z.object({
    action: z.string().min(1),
    entityType: z.string().min(1),
    entityId: z.string().uuid().optional(),
    details: z.record(z.unknown()).optional(),
  }).safeParse(await c.req.json());

  if (!body.success) return c.json({ error: body.error.flatten() }, 400);
  const d = body.data;

  const [row] = await db
    .insert(auditLog)
    .values({
      action: d.action,
      entityType: d.entityType,
      entityId: d.entityId ?? null,
      performedBy: user.sub,
      details: d.details ? JSON.stringify(d.details) : null,
    })
    .returning();

  return c.json(row, 201);
});

export default router;
