import { pgTable, uuid, text, integer, numeric, boolean, timestamp, pgEnum, date, time } from "drizzle-orm/pg-core";
import { users } from "./users";
import { drivers } from "./fleet";

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "assigned",
  "en_route",
  "on_site",
  "in_progress",
  "done",
  "cancelled",
]);

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  reservationNumber: text("reservation_number").notNull().unique(),
  pickupLocation: text("pickup_location").notNull(),
  dropoffLocation: text("dropoff_location").notNull(),
  pickupDate: date("pickup_date").notNull(),
  pickupTime: time("pickup_time").notNull(),
  vehicleType: text("vehicle_type").notNull().default("sedan"),
  isAirportPickup: boolean("is_airport_pickup").default(false),
  flightNumber: text("flight_number"),
  specialRequests: text("special_requests"),
  distanceMiles: numeric("distance_miles", { precision: 8, scale: 2 }),
  durationMinutes: integer("duration_minutes"),
  basePrice: numeric("base_price", { precision: 10, scale: 2 }),
  gratuity: numeric("gratuity", { precision: 10, scale: 2 }),
  waitTimeFee: numeric("wait_time_fee", { precision: 10, scale: 2 }).default("0"),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }),
  status: bookingStatusEnum("status").notNull().default("pending"),
  gatekeeperStatus: text("gatekeeper_status").default("standard"),
  driverId: uuid("driver_id").references(() => drivers.id, { onDelete: "set null" }),
  dispatcherNotes: text("dispatcher_notes"),
  clientName: text("client_name"),
  clientPhone: text("client_phone"),
  clientEmail: text("client_email"),
  emailPhase: text("email_phase"),
  tripGroupId: text("trip_group_id"),
  legOrder: integer("leg_order"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
