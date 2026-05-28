import { pgTable, uuid, text, jsonb, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";
import { bookings } from "./bookings";

export const documentTypeEnum = pgEnum("document_type", [
  "driver_manifest",
  "client_invoice",
  "trip_confirmation",
]);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentType: documentTypeEnum("document_type").notNull(),
  documentNumber: text("document_number").notNull().unique(),
  clientEmail: text("client_email").notNull(),
  clientName: text("client_name").notNull(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  documentData: jsonb("document_data").notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
