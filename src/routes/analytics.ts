import { Hono } from "hono";
import { gte, eq } from "drizzle-orm";
import { db } from "../db";
import { bookings } from "../db/schema";
import { requireAdmin } from "../middleware/auth";
import type { JwtPayload } from "../lib/jwt";

const router = new Hono<{ Variables: { user: JwtPayload } }>();

// GET /api/v1/analytics
router.get("/", requireAdmin, async (c) => {
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0];
  const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0];

  const all = await db.query.bookings.findMany();

  const totalBookings = all.length;
  const totalRevenue = all.reduce((s, b) => s + Number(b.totalPrice ?? 0), 0);
  const activeBookings = all.filter((b) => !["done", "cancelled"].includes(b.status)).length;

  const todayRows = all.filter((b) => b.pickupDate === today);
  const completedToday = todayRows.filter((b) => b.status === "done").length;
  const revenueToday = todayRows
    .filter((b) => b.status === "done")
    .reduce((s, b) => s + Number(b.totalPrice ?? 0), 0);

  const revenueThisWeek = all
    .filter((b) => b.pickupDate >= weekAgo && b.status === "done")
    .reduce((s, b) => s + Number(b.totalPrice ?? 0), 0);

  const revenueThisMonth = all
    .filter((b) => b.pickupDate >= monthAgo && b.status === "done")
    .reduce((s, b) => s + Number(b.totalPrice ?? 0), 0);

  const bookingsByStatus = all.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {});

  const routeCounts = all.reduce<Record<string, number>>((acc, b) => {
    const route = `${b.pickupLocation} → ${b.dropoffLocation}`;
    acc[route] = (acc[route] ?? 0) + 1;
    return acc;
  }, {});

  const topRoutes = Object.entries(routeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([route, count]) => ({ route, count }));

  const averageBookingValue = totalRevenue / (totalBookings || 1);

  return c.json({
    totalBookings,
    totalRevenue,
    activeBookings,
    completedToday,
    revenueToday,
    revenueThisWeek,
    revenueThisMonth,
    bookingsByStatus,
    topRoutes,
    averageBookingValue,
  });
});

export default router;
