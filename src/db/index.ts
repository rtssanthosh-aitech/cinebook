import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { Pool, neonConfig } from "@neondatabase/serverless";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "";

export const isLiveDatabaseConfigured = Boolean(
  connectionString && !connectionString.includes("samplepassword") && !connectionString.includes("placeholder")
);

function createDbClient() {
  if (!isLiveDatabaseConfigured) {
    // When no live DB URL is provided, we use a fallback proxy or postgres-js
    return null;
  }

  try {
    if (connectionString.includes("neon.tech")) {
      // Neon serverless pooled connection
      const pool = new Pool({ connectionString });
      return drizzleNeon(pool, { schema });
    } else {
      // Standard PostgreSQL connection (local or Docker or preview)
      const client = postgres(connectionString, { max: 10 });
      return drizzlePostgres(client, { schema });
    }
  } catch (error) {
    console.error("Failed to initialize PostgreSQL connection:", error);
    return null;
  }
}

export const db = createDbClient();
export { schema };
