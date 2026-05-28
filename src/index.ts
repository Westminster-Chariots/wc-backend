import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env } from "./lib/env";
import auth from "./routes/auth";
import bookings from "./routes/bookings";
import clients from "./routes/clients";
import drivers from "./routes/drivers";
import fleet from "./routes/fleet";
import pricing from "./routes/pricing";
import invoices from "./routes/invoices";
import analytics from "./routes/analytics";
import audit from "./routes/audit";
import campaigns from "./routes/campaigns";
import payments from "./routes/payments";
import reminders from "./routes/reminders";
import uploads from "./routes/uploads";
import users from "./routes/users";
import contact from "./routes/contact";
import documents from "./routes/documents";

const app = new Hono();

app.use(logger());
app.use(
  "*",
  cors({
    origin: (origin) => {
      const allowedOrigins = env.ALLOWED_ORIGINS;
      // Allow wildcard
      if (allowedOrigins.includes('*')) return origin || '*';
      // Allow if origin is in the list
      if (allowedOrigins.includes(origin || '')) return origin;
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return true;
      // Default to first allowed origin
      return allowedOrigins[0];
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Request-ID", "X-CSRF-Token", "x-client-type"],
    exposeHeaders: ["Set-Cookie"],
  })
);

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/api/v1/auth", auth);
app.route("/api/v1/bookings", bookings);
app.route("/api/v1/clients", clients);
app.route("/api/v1/drivers", drivers);
app.route("/api/v1/fleet", fleet);
app.route("/api/v1/pricing", pricing);
app.route("/api/v1/invoices", invoices);
app.route("/api/v1/analytics", analytics);
app.route("/api/v1/audit", audit);
app.route("/api/v1/campaigns", campaigns);
app.route("/api/v1/payments", payments);
app.route("/api/v1/reminders", reminders);
app.route("/api/v1/uploads", uploads);
app.route("/api/v1/users", users);
app.route("/api/v1/contact", contact);
app.route("/api/v1/documents", documents);

console.log("✓ Documents route registered at /api/v1/documents");

serve({ fetch: app.fetch, port: env.PORT }, () => {
  console.log(`wc-backend running on port ${env.PORT}`);
});
