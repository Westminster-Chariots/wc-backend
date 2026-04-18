import { pgTable, uuid, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const vehicleClassEnum = pgEnum("vehicle_class", ["sedan", "suv"]);

export const fleet = pgTable("fleet", {
  id: uuid("id").primaryKey().defaultRandom(),
  vehicleType: vehicleClassEnum("vehicle_type").notNull(),
  make: text("make").notNull().default("Mercedes-Benz"),
  model: text("model").notNull(),
  plate: text("plate").notNull(),
  year: integer("year"),
  color: text("color").default("Black"),
  status: text("status").notNull().default("available"),
  imageUrl: text("image_url"),
  passengerCapacity: integer("passenger_capacity").default(3),
  luggageCapacity: integer("luggage_capacity").default(2),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const drivers = pgTable("drivers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  status: text("status").notNull().default("available"),
  vehicleId: uuid("vehicle_id").references(() => fleet.id, { onDelete: "set null" }),
  photoUrl: text("photo_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
