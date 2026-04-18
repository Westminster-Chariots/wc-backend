import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { fleet } from "./fleet";
import { users } from "./users";

export const drivers = pgTable("drivers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  status: text("status").notNull().default("available"),
  vehicleId: uuid("vehicle_id").references(() => fleet.id, { onDelete: "set null" }),
  photoUrl: text("photo_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
