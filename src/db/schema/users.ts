import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const appRoleEnum = pgEnum("app_role", ["admin", "client"]);
export const authProviderEnum = pgEnum("auth_provider", ["local", "google"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  googleId: text("google_id").unique(),
  provider: authProviderEnum("provider").notNull().default("local"),
  avatarUrl: text("avatar_url"),
  refreshToken: text("refresh_token"),
  pushToken: text("push_token"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: appRoleEnum("role").notNull().default("client"),
});
