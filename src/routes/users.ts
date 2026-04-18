import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { userRoles, users, profiles } from "../db/schema";
import { requireAdmin } from "../middleware/auth";
import type { JwtPayload } from "../lib/jwt";

const router = new Hono<{ Variables: { user: JwtPayload } }>();

// GET /api/v1/users/roles — admin only, get all user roles
router.get("/roles", requireAdmin, async (c) => {
  const rows = await db.query.userRoles.findMany();
  return c.json(rows);
});

// GET /api/v1/users — admin only, get all users with profiles and roles
router.get("/", requireAdmin, async (c) => {
  const allProfiles = await db.query.profiles.findMany();
  const allRoles = await db.query.userRoles.findMany();
  
  const roleMap = new Map<string, { role: "admin" | "client"; roleId: string }>();
  allRoles.forEach(r => roleMap.set(r.userId, { role: r.role, roleId: r.id }));
  
  const usersWithRoles = allProfiles.map(p => ({
    ...p,
    role: roleMap.get(p.userId)?.role || "client",
    roleId: roleMap.get(p.userId)?.roleId || "",
  }));
  
  return c.json(usersWithRoles);
});

// PATCH /api/v1/users/roles/:id — admin only, update user role
router.patch("/roles/:id", requireAdmin, async (c) => {
  const body = z.object({
    role: z.enum(["admin", "client"]),
  }).safeParse(await c.req.json());

  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const existing = await db.query.userRoles.findFirst({ where: eq(userRoles.id, c.req.param("id")) });
  if (!existing) return c.json({ error: "Role not found" }, 404);

  const [updated] = await db
    .update(userRoles)
    .set({ role: body.data.role })
    .where(eq(userRoles.id, c.req.param("id")))
    .returning();

  return c.json(updated);
});

export default router;
