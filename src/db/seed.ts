import { db, isLiveDatabaseConfigured } from "./index";
import * as schema from "./schema";
import { memoryDb } from "../services/dataStore";

async function main() {
  console.log("🌱 Starting CineBook database seeding...");

  if (!isLiveDatabaseConfigured || !db) {
    console.log("⚡ Live PostgreSQL DATABASE_URL is not configured.");
    console.log("⚡ Populated in-memory database with:");
    console.log(`   - ${memoryDb.users.length} users (Admin: admin@cinebook.com, User: alex@cinebook.com)`);
    console.log(`   - ${memoryDb.movies.length} blockbuster movies`);
    console.log(`   - ${memoryDb.cinemas.length} luxury cinemas`);
    console.log(`   - ${memoryDb.auditoriums.length} auditoriums`);
    console.log(`   - ${memoryDb.seats.length} seats`);
    console.log(`   - ${memoryDb.showtimes.length} showtimes`);
    console.log(`   - ${memoryDb.showtimeSeats.length} showtime seats`);
    console.log("✅ In-memory database ready for dev and test mode!");
    return;
  }

  console.log("🚀 Seeding Live Neon PostgreSQL database...");

  // 1. Insert Genres
  for (const g of memoryDb.genres) {
    await db.insert(schema.genres).values(g).onConflictDoNothing();
  }

  // 2. Insert Users
  for (const u of memoryDb.users) {
    await db.insert(schema.users).values(u).onConflictDoNothing();
  }

  // 3. Insert Movies
  for (const m of memoryDb.movies) {
    await db.insert(schema.movies).values(m).onConflictDoNothing();
  }

  // 4. Insert Movie Genres
  for (const mg of memoryDb.movieGenres) {
    await db.insert(schema.movieGenres).values(mg).onConflictDoNothing();
  }

  // 5. Insert Cinemas
  for (const c of memoryDb.cinemas) {
    await db.insert(schema.cinemas).values(c).onConflictDoNothing();
  }

  // 6. Insert Auditoriums
  for (const a of memoryDb.auditoriums) {
    await db.insert(schema.auditoriums).values(a).onConflictDoNothing();
  }

  // 7. Insert Seats
  for (const s of memoryDb.seats) {
    await db.insert(schema.seats).values(s).onConflictDoNothing();
  }

  // 8. Insert Showtimes
  for (const st of memoryDb.showtimes) {
    await db.insert(schema.showtimes).values(st).onConflictDoNothing();
  }

  // 9. Insert Showtime Seats
  for (const sts of memoryDb.showtimeSeats) {
    await db.insert(schema.showtimeSeats).values(sts).onConflictDoNothing();
  }

  console.log("✅ Live database seeded successfully!");
}

main().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
