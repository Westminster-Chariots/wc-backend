import { Hono } from "hono";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import { invoices, invoiceItems } from "../db/schema";
import { requireAuth, requireAdmin } from "../middleware/auth";
import type { JwtPayload } from "../lib/jwt";

const router = new Hono<{ Variables: { user: JwtPayload } }>();

const ItemSchema = z.object({
  bookingId: z.string().uuid().nullable().optional(),
  description: z.string().min(1),
  price: z.number(),
  passengerName: z.string().nullable().optional(),
  pickupDate: z.string().nullable().optional(),
  pickupTime: z.string().nullable().optional(),
  routingInfo: z.string().nullable().optional(),
});

const CreateInvoiceSchema = z.object({
  clientUserId: z.string().uuid().nullable().optional(),
  clientName: z.string().min(1),
  clientEmail: z.string().email().nullable().optional(),
  clientPhone: z.string().nullable().optional(),
  clientAddress: z.string().nullable().optional(),
  subtotal: z.number(),
  tax: z.number().default(0),
  total: z.number(),
  status: z.string().default("draft"),
  dueDate: z.string().nullable().optional(),
  paymentTerms: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  items: z.array(ItemSchema).min(1),
});

// GET /api/v1/invoices — admin: all; client: own
router.get("/", requireAuth, async (c) => {
  const user = c.get("user");
  const rows =
    user.role === "admin"
      ? await db.query.invoices.findMany({ orderBy: [desc(invoices.createdAt)] })
      : await db.query.invoices.findMany({
          where: eq(invoices.clientUserId, user.sub),
          orderBy: [desc(invoices.createdAt)],
        });
  return c.json(rows);
});

// GET /api/v1/invoices/:id — includes items
router.get("/:id", requireAuth, async (c) => {
  const user = c.get("user");
  const invoice = await db.query.invoices.findFirst({ where: eq(invoices.id, c.req.param("id")) });
  if (!invoice) return c.json({ error: "Not found" }, 404);
  if (user.role !== "admin" && invoice.clientUserId !== user.sub) return c.json({ error: "Forbidden" }, 403);

  const items = await db.query.invoiceItems.findMany({
    where: eq(invoiceItems.invoiceId, invoice.id),
    orderBy: [desc(invoiceItems.createdAt)],
  });

  return c.json({ ...invoice, items });
});

// POST /api/v1/invoices — admin only
router.post("/", requireAdmin, async (c) => {
  const user = c.get("user");
  const body = CreateInvoiceSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);
  const { items, ...invoiceData } = body.data;

  const [invoice] = await db
    .insert(invoices)
    .values({
      clientUserId: invoiceData.clientUserId ?? null,
      clientName: invoiceData.clientName,
      clientEmail: invoiceData.clientEmail ?? null,
      clientPhone: invoiceData.clientPhone ?? null,
      clientAddress: invoiceData.clientAddress ?? null,
      subtotal: String(invoiceData.subtotal),
      tax: String(invoiceData.tax),
      total: String(invoiceData.total),
      status: invoiceData.status,
      dueDate: invoiceData.dueDate ?? null,
      paymentTerms: invoiceData.paymentTerms ?? null,
      notes: invoiceData.notes ?? null,
      createdBy: user.sub,
    })
    .returning();

  const itemRows = items.map((item) => ({
    invoiceId: invoice.id,
    bookingId: item.bookingId ?? null,
    description: item.description,
    price: String(item.price),
    passengerName: item.passengerName ?? null,
    pickupDate: item.pickupDate ?? null,
    pickupTime: item.pickupTime ?? null,
    routingInfo: item.routingInfo ?? null,
  }));

  const insertedItems = await db.insert(invoiceItems).values(itemRows).returning();

  return c.json({ ...invoice, items: insertedItems }, 201);
});

// PATCH /api/v1/invoices/:id/status — admin only
router.patch("/:id/status", requireAdmin, async (c) => {
  const body = z.object({
    status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
  }).safeParse(await c.req.json());

  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const [updated] = await db
    .update(invoices)
    .set({ status: body.data.status, updatedAt: new Date() })
    .where(eq(invoices.id, c.req.param("id")))
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

// DELETE /api/v1/invoices/:id — admin only (cascades to items via FK)
router.delete("/:id", requireAdmin, async (c) => {
  const existing = await db.query.invoices.findFirst({ where: eq(invoices.id, c.req.param("id")) });
  if (!existing) return c.json({ error: "Not found" }, 404);
  await db.delete(invoices).where(eq(invoices.id, c.req.param("id")));
  return c.json({ message: "Deleted" });
});

export default router;
