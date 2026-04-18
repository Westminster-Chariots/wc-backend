import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { bookings } from "./bookings";

export const campaignHistory = pgTable("campaign_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  subject: text("subject").notNull(),
  heading: text("heading").notNull(),
  body: text("body").notNull(),
  ctaText: text("cta_text"),
  ctaUrl: text("cta_url"),
  audience: text("audience").notNull(),
  recipientCount: integer("recipient_count").notNull().default(0),
  sentCount: integer("sent_count"),
  failedCount: integer("failed_count"),
  status: text("status").notNull().default("draft"),
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dispatcherTasks = pgTable("dispatcher_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("medium"),
  isCompleted: boolean("is_completed").notNull().default(false),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  completedBy: uuid("completed_by").references(() => users.id, { onDelete: "set null" }),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  performedBy: uuid("performed_by").references(() => users.id, { onDelete: "set null" }),
  details: text("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
