import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

  if (!connectionString || connectionString.includes("samplepassword")) {
    console.log("⚠️ No unpooled DATABASE_URL configured. Skipping physical migrations.");
    return;
  }

  console.log("⚡ Connecting to Neon PostgreSQL for database migrations...");
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log("⚡ Applying migrations from ./drizzle...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✅ Migrations applied successfully!");

  await sql.end();
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
