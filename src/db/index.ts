import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema/index";

// AWS migration: replace with:
// import { Pool } from "pg";
// import { drizzle } from "drizzle-orm/node-postgres";
// const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// export const db = drizzle(pool, { schema });

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
