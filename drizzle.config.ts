import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config();

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // AWS migration: change dialect to "postgresql" and swap DATABASE_URL
  // No other changes needed — Drizzle is DB-agnostic
  verbose: true,
  strict: true,
});
