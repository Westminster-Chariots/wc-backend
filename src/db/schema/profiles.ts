import { pgTable, uuid, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  email: text("email"),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  isCorporate: boolean("is_corporate").default(false),
  corporateName: text("corporate_name"),
  clientCode: text("client_code"),
  stateAbbrev: text("state_abbrev").default("D"),
  notes: text("notes"),
  preferences: jsonb("preferences").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
