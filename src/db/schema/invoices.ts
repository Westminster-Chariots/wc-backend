import { pgTable, uuid, text, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { users } from "./users";
import { bookings } from "./bookings";

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  clientUserId: uuid("client_user_id").references(() => users.id, { onDelete: "set null" }),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  clientAddress: text("client_address"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  tax: numeric("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("draft"),
  dueDate: date("due_date"),
  paymentTerms: text("payment_terms"),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  passengerName: text("passenger_name"),
  pickupDate: date("pickup_date"),
  pickupTime: text("pickup_time"),
  routingInfo: text("routing_info"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
