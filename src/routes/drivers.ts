import { Hono } from "hono";
import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { db } from "../db";
import { drivers, users, userRoles } from "../db/schema";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { buildDriverAccountEmail } from "../lib/email-templates";
import { env } from "../lib/env";
import type { JwtPayload } from "../lib/jwt";

const resend = new Resend(env.RESEND_API_KEY);

const router = new Hono<{ Variables: { user: JwtPayload } }>();

const DriverSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  status: z.string().default("available"),
  vehicleId: z.string().uuid().nullable().optional(),
  photoUrl: z.string().url().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// GET /api/v1/drivers — any authenticated user (needed for booking assignment UI)
router.get("/", requireAuth, async (c) => {
  const rows = await db.query.drivers.findMany({ orderBy: [asc(drivers.name)] });
  return c.json(rows);
});

// GET /api/v1/drivers/:id
router.get("/:id", requireAuth, async (c) => {
  const row = await db.query.drivers.findFirst({ where: eq(drivers.id, c.req.param("id")) });
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

// POST /api/v1/drivers — admin only
router.post("/", requireAdmin, async (c) => {
  const body = DriverSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  // Check if email is provided
  if (!body.data.email) {
    return c.json({ error: "Email is required to create driver account" }, 400);
  }

  try {
    // Check if user already exists
    let user = await db.query.users.findFirst({ where: eq(users.email, body.data.email) });
    let tempPassword = "";
    
    if (!user) {
      // Create new user account with temporary password
      tempPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(tempPassword, 12);
      
      [user] = await db.insert(users).values({
        email: body.data.email,
        passwordHash,
      }).returning();

      // TODO: Send email with temporary password
      console.log(`Driver account created. Temp password: ${tempPassword}`);
    }

    // Check if user already has driver role
    const existingDriverRole = await db.query.userRoles.findFirst({
      where: eq(userRoles.userId, user.id),
    });

    if (!existingDriverRole) {
      // Add driver role (user can be both client and driver)
      await db.insert(userRoles).values({
        userId: user.id,
        role: "client", // Default role, driver status is in drivers table
      });
    }

    // Create driver record
    const [driver] = await db.insert(drivers).values({
      ...body.data,
      userId: user.id,
    }).returning();

    // Send welcome email with credentials
    const loginUrl = `${env.ALLOWED_ORIGINS[0]}/auth`;
    try {
      const result = await resend.emails.send({
        from: "Westminster Chariots <no-reply@mail.westminsterchariots.com>",
        to: body.data.email,
        subject: "Welcome to Westminster Chariots - Driver Account Created",
        html: buildDriverAccountEmail(body.data.name, body.data.email, tempPassword, loginUrl),
      });
      console.log("Driver welcome email sent:", result);
    } catch (emailError: any) {
      console.error("Failed to send driver welcome email:", emailError);
      console.error("Email error details:", JSON.stringify(emailError, null, 2));
      // Continue even if email fails
    }

    return c.json(driver, 201);
  } catch (error: any) {
    console.error("Driver creation error:", error);
    return c.json({ error: "Failed to create driver", details: error.message }, 500);
  }
});

// PATCH /api/v1/drivers/:id — admin only
router.patch("/:id", requireAdmin, async (c) => {
  const body = DriverSchema.partial().safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const [updated] = await db
    .update(drivers)
    .set(body.data)
    .where(eq(drivers.id, c.req.param("id")))
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

// DELETE /api/v1/drivers/:id — admin only
router.delete("/:id", requireAdmin, async (c) => {
  const existing = await db.query.drivers.findFirst({ where: eq(drivers.id, c.req.param("id")) });
  if (!existing) return c.json({ error: "Not found" }, 404);
  await db.delete(drivers).where(eq(drivers.id, c.req.param("id")));
  return c.json({ message: "Deleted" });
});

export default router;
