import { Hono } from "hono";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { users, userRoles, profiles } from "../db/schema";
import { requireAuth, requireAdmin } from "../middleware/auth";
import type { JwtPayload } from "../lib/jwt";

// Function to generate client code based on Westminster Chariots nomenclature
function generateClientCode(
  displayName: string,
  isCorporate: boolean,
  corporateName: string | null | undefined,
  stateAbbrev: string
): string {
  // Clean the display name to get initials
  const nameParts = displayName.trim().split(/\s+/);
  
  // Get first and last initials (uppercase)
  // For single name clients, use the same initial for both
  const firstInitial = nameParts[0]?.[0]?.toUpperCase() || 'X';
  const lastInitial = nameParts.length > 1 
    ? nameParts[nameParts.length - 1]?.[0]?.toUpperCase() || 'X'
    : firstInitial; // Use same initial for single name clients
  
  // Get corporate initial if corporate client
  let corpInitial = '';
  if (isCorporate && corporateName) {
    corpInitial = corporateName.trim().split(/\s+/)[0]?.[0]?.toUpperCase() || '';
  }
  
  // Generate random code
  const randomDigits = isCorporate 
    ? Math.floor(1000 + Math.random() * 9000).toString() // 4 digits for corporate
    : Math.floor(100 + Math.random() * 900).toString();  // 3 digits for private
  
  // Build the client code
  const stateCode = stateAbbrev.toUpperCase();
  
  if (isCorporate && corpInitial) {
    // Corporate format: State + Corp Initial + First Initial + Last Initial + - + 4 digits
    return `${stateCode}${corpInitial}${firstInitial}${lastInitial}-${randomDigits}`;
  } else {
    // Private format: State + First Initial + Last Initial + - + 3 digits
    return `${stateCode}${firstInitial}${lastInitial}-${randomDigits}`;
  }
}

const router = new Hono<{ Variables: { user: JwtPayload } }>();

const ProfileUpdateSchema = z.object({
  displayName: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  isCorporate: z.boolean().optional(),
  corporateName: z.string().nullable().optional(),
  stateAbbrev: z.string().optional(),
  notes: z.string().nullable().optional(),
});

// GET /api/v1/clients — admin only
router.get("/", requireAdmin, async (c) => {
  const rows = await db.query.profiles.findMany({
    orderBy: [desc(profiles.createdAt)],
  });
  return c.json(rows);
});

// GET /api/v1/clients/:id — admin or own profile
router.get("/:id", requireAuth, async (c) => {
  const user = c.get("user");
  const row = await db.query.profiles.findFirst({ where: eq(profiles.id, c.req.param("id")) });
  if (!row) return c.json({ error: "Not found" }, 404);
  if (user.role !== "admin" && row.userId !== user.sub) return c.json({ error: "Forbidden" }, 403);
  return c.json(row);
});

// POST /api/v1/clients — admin creates a client (no password — placeholder account)
router.post("/", requireAdmin, async (c) => {
  const body = z.object({
    displayName: z.string().min(1),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    isCorporate: z.boolean().default(false),
    corporateName: z.string().optional().nullable(),
    stateAbbrev: z.string().default("D"),
    notes: z.string().optional().nullable(),
  }).safeParse(await c.req.json());

  if (!body.success) return c.json({ error: body.error.flatten() }, 400);
  const d = body.data;

  // Generate client code using Westminster Chariots nomenclature
  const clientCode = generateClientCode(
    d.displayName,
    d.isCorporate,
    d.corporateName,
    d.stateAbbrev
  );

  // Use a placeholder email if none provided so the users table constraint is satisfied
  const email = d.email ?? `noemail-${crypto.randomUUID().slice(0, 8)}@placeholder.wc`;
  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 12); // unusable password

  const existing = d.email
    ? await db.query.users.findFirst({ where: eq(users.email, d.email) })
    : null;
  if (existing) return c.json({ error: "Email already in use" }, 409);

  const [user_] = await db.insert(users).values({ email, passwordHash }).returning();
  await db.insert(userRoles).values({ userId: user_.id, role: "client" });
  const [profile] = await db
    .insert(profiles)
    .values({
      userId: user_.id,
      displayName: d.displayName,
      email: d.email ?? null,
      phone: d.phone ?? null,
      isCorporate: d.isCorporate,
      corporateName: d.corporateName ?? null,
      clientCode: clientCode,
      stateAbbrev: d.stateAbbrev,
      notes: d.notes ?? null,
    })
    .returning();

  return c.json(profile, 201);
});

// PATCH /api/v1/clients/:id — admin or own profile
router.patch("/:id", requireAuth, async (c) => {
  const user = c.get("user");
  const existing = await db.query.profiles.findFirst({ where: eq(profiles.id, c.req.param("id")) });
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (user.role !== "admin" && existing.userId !== user.sub) return c.json({ error: "Forbidden" }, 403);

  const body = ProfileUpdateSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);
  const d = body.data;

  const [updated] = await db
    .update(profiles)
    .set({
      ...(d.displayName !== undefined && { displayName: d.displayName }),
      ...(d.email !== undefined && { email: d.email }),
      ...(d.phone !== undefined && { phone: d.phone }),
      ...(d.isCorporate !== undefined && { isCorporate: d.isCorporate }),
      ...(d.corporateName !== undefined && { corporateName: d.corporateName }),
      ...(d.stateAbbrev !== undefined && { stateAbbrev: d.stateAbbrev }),
      ...(d.notes !== undefined && { notes: d.notes }),
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, c.req.param("id")))
    .returning();

  return c.json(updated);
});

// DELETE /api/v1/clients/:id — admin only (cascades to user + profile via FK)
router.delete("/:id", requireAdmin, async (c) => {
  const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, c.req.param("id")) });
  if (!profile) return c.json({ error: "Not found" }, 404);
  // Deleting the user cascades to user_roles and profiles
  await db.delete(users).where(eq(users.id, profile.userId));
  return c.json({ message: "Deleted" });
});

export default router;
