import { Hono } from "hono";
import { v2 as cloudinary } from "cloudinary";
import { requireAuth } from "../middleware/auth";
import { env } from "../lib/env";
import type { JwtPayload } from "../lib/jwt";

const router = new Hono<{ Variables: { user: JwtPayload } }>();

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// POST /api/v1/uploads
router.post("/", requireAuth, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // "driver_photo" | "vehicle_image"

    if (!file) return c.json({ error: "No file provided" }, 400);

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `wc/${type}`,
          resource_type: "image",
          transformation: [
            { width: 800, height: 800, crop: "limit" },
            { quality: "auto" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return c.json({ url: result.secure_url });
  } catch (error: any) {
    console.error("Upload error:", error);
    return c.json({ error: "Upload failed", details: error.message }, 500);
  }
});

export default router;
