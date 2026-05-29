import { Hono } from "hono";
import { db } from "../db";
import { documents } from "../db/schema";
import { eq, and, or, like, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { z } from "zod";
import type { JwtPayload } from "../lib/jwt";

const router = new Hono<{ Variables: { user: JwtPayload } }>();

const createDocumentSchema = z.object({
  documentType: z.enum(["driver_manifest", "client_invoice", "trip_confirmation"]),
  documentNumber: z.string(),
  clientEmail: z.string().email(),
  clientName: z.string(),
  bookingId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  documentData: z.any(),
});

// Create a new document
router.post("/", requireAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const validated = createDocumentSchema.parse(body);
    const user = c.get("user");

    const [document] = await db
      .insert(documents)
      .values({
        ...validated,
        createdBy: user.id,
      })
      .returning();

    return c.json(document, 201);
  } catch (error: any) {
    console.error("Create document error:", error);
    return c.json({ error: error.message || "Failed to create document" }, 400);
  }
});

// Get all documents with filters
router.get("/", requireAdmin, async (c) => {
  try {
    const { type, search, clientEmail, limit = "50", offset = "0" } = c.req.query();
    
    let query = db.select().from(documents);
    const conditions = [];

    if (type) {
      conditions.push(eq(documents.documentType, type as any));
    }

    if (clientEmail) {
      conditions.push(eq(documents.clientEmail, clientEmail));
    }

    if (search) {
      conditions.push(
        or(
          like(documents.documentNumber, `%${search}%`),
          like(documents.clientEmail, `%${search}%`),
          like(documents.clientName, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query
      .orderBy(desc(documents.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    return c.json(results);
  } catch (error: any) {
    console.error("Get documents error:", error);
    return c.json({ error: error.message || "Failed to fetch documents" }, 500);
  }
});

// Get documents for current user (client view)
router.get("/my-documents", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    
    const results = await db
      .select()
      .from(documents)
      .where(
        or(
          eq(documents.userId, user.id),
          eq(documents.clientEmail, user.email)
        )
      )
      .orderBy(desc(documents.createdAt));

    return c.json(results);
  } catch (error: any) {
    console.error("Get my documents error:", error);
    return c.json({ error: error.message || "Failed to fetch documents" }, 500);
  }
});

// Get a single document by ID
router.get("/:id", requireAuth, async (c) => {
  try {
    const { id } = c.param();
    
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));

    if (!document) {
      return c.json({ error: "Document not found" }, 404);
    }

    return c.json(document);
  } catch (error: any) {
    console.error("Get document error:", error);
    return c.json({ error: error.message || "Failed to fetch document" }, 500);
  }
});

// Update a document
router.patch("/:id", requireAdmin, async (c) => {
  try {
    const { id } = c.param();
    const body = await c.req.json();
    
    const [updated] = await db
      .update(documents)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, id))
      .returning();

    if (!updated) {
      return c.json({ error: "Document not found" }, 404);
    }

    return c.json(updated);
  } catch (error: any) {
    console.error("Update document error:", error);
    return c.json({ error: error.message || "Failed to update document" }, 500);
  }
});

// Delete a document
router.delete("/:id", requireAdmin, async (c) => {
  try {
    const { id } = c.param();
    
    const [deleted] = await db
      .delete(documents)
      .where(eq(documents.id, id))
      .returning();

    if (!deleted) {
      return c.json({ error: "Document not found" }, 404);
    }

    return c.json({ message: "Document deleted successfully" });
  } catch (error: any) {
    console.error("Delete document error:", error);
    return c.json({ error: error.message || "Failed to delete document" }, 500);
  }
});

export default router;
