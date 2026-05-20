import { pgTable, uuid, text, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const pricingConfig = pgTable("pricing_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  vehicleType: text("vehicle_type").notNull(),
  baseRate: numeric("base_rate", { precision: 10, scale: 2 }).notNull().default("30"),
  ratePerMile: numeric("rate_per_mile", { precision: 10, scale: 2 }).notNull().default("4.00"),
  ratePerMinute: numeric("rate_per_minute", { precision: 10, scale: 2 }).notNull().default("1.25"),
  taxPercent: numeric("tax_percent", { precision: 5, scale: 2 }).notNull().default("20"),
  waitTimeHourly: numeric("wait_time_hourly", { precision: 10, scale: 2 }).notNull().default("95"),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const flatZones = pgTable("flat_zones", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  sedanPrice: numeric("sedan_price", { precision: 10, scale: 2 }).notNull().default("0"),
  suvPrice: numeric("suv_price", { precision: 10, scale: 2 }).notNull().default("0"),
  radiusMiles: numeric("radius_miles", { precision: 6, scale: 1 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
