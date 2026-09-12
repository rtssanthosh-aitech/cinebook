import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Users
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 32 }).notNull().default("USER"), // 'USER' | 'ADMIN'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. Movies
export const movies = pgTable("movies", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  synopsis: text("synopsis").notNull(),
  posterUrl: varchar("poster_url", { length: 1024 }).notNull(),
  backdropUrl: varchar("backdrop_url", { length: 1024 }).notNull(),
  trailerUrl: varchar("trailer_url", { length: 1024 }),
  durationMins: integer("duration_mins").notNull(),
  releaseDate: varchar("release_date", { length: 32 }).notNull(),
  rating: varchar("rating", { length: 32 }).notNull(), // 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17'
  language: varchar("language", { length: 64 }).notNull().default("English"),
  status: varchar("status", { length: 32 }).notNull().default("NOW_SHOWING"), // 'NOW_SHOWING' | 'COMING_SOON' | 'ARCHIVED'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. Genres
export const genres = pgTable("genres", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
});

// 4. Movie Genres (Junction)
export const movieGenres = pgTable(
  "movie_genres",
  {
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    genreId: uuid("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.movieId, table.genreId] }),
  ]
);

// 5. Cinemas
export const cinemas = pgTable("cinemas", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  address: varchar("address", { length: 500 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  postalCode: varchar("postal_code", { length: 32 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  amenities: jsonb("amenities").$type<string[]>().default([]).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 6. Auditoriums
export const auditoriums = pgTable(
  "auditoriums",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cinemaId: uuid("cinema_id")
      .notNull()
      .references(() => cinemas.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(), // e.g. 'Screen 1', 'IMAX Grand'
    screenType: varchar("screen_type", { length: 50 }).notNull().default("STANDARD"), // 'STANDARD' | 'IMAX' | 'DOLBY_ATMOS' | 'VIP'
    totalSeats: integer("total_seats").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Unique constraint on cinema_id + auditorium name
    uniqueIndex("cinema_auditorium_name_idx").on(table.cinemaId, table.name),
  ]
);

// 7. Seats
export const seats = pgTable(
  "seats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditoriumId: uuid("auditorium_id")
      .notNull()
      .references(() => auditoriums.id, { onDelete: "cascade" }),
    rowLabel: varchar("row_label", { length: 10 }).notNull(), // 'A', 'B', 'C'
    seatNumber: integer("seat_number").notNull(), // 1, 2, 3
    seatType: varchar("seat_type", { length: 50 }).notNull().default("STANDARD"), // 'STANDARD' | 'PREMIUM' | 'VIP'
    isAccessible: boolean("is_accessible").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Unique constraint for auditorium seat positions
    uniqueIndex("auditorium_seat_pos_idx").on(table.auditoriumId, table.rowLabel, table.seatNumber),
    index("seat_auditorium_idx").on(table.auditoriumId),
  ]
);

// 8. Showtimes
export const showtimes = pgTable(
  "showtimes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    auditoriumId: uuid("auditorium_id")
      .notNull()
      .references(() => auditoriums.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    // Money as integer minor units (cents)
    priceStandardCents: integer("price_standard_cents").notNull().default(1400),
    pricePremiumCents: integer("price_premium_cents").notNull().default(1850),
    priceVipCents: integer("price_vip_cents").notNull().default(2400),
    status: varchar("status", { length: 50 }).notNull().default("SCHEDULED"), // 'SCHEDULED' | 'CANCELLED' | 'COMPLETED'
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("showtime_movie_idx").on(table.movieId),
    index("showtime_auditorium_idx").on(table.auditoriumId),
    index("showtime_start_time_idx").on(table.startTime),
  ]
);

// 9. Showtime Seats
export const showtimeSeats = pgTable(
  "showtime_seats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    showtimeId: uuid("showtime_id")
      .notNull()
      .references(() => showtimes.id, { onDelete: "cascade" }),
    seatId: uuid("seat_id")
      .notNull()
      .references(() => seats.id, { onDelete: "cascade" }),
    // Seat status: AVAILABLE, HELD, BOOKED, BLOCKED
    status: varchar("status", { length: 50 }).notNull().default("AVAILABLE"),
    holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }),
    heldByUserId: uuid("held_by_user_id").references(() => users.id, { onDelete: "set null" }),
    bookingId: uuid("booking_id"), // linked booking
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Unique constraint that prevents the same showtime seat from being booked twice
    uniqueIndex("showtime_seat_unique_idx").on(table.showtimeId, table.seatId),
    index("showtime_seat_status_idx").on(table.showtimeId, table.status),
    index("showtime_seat_hold_expiry_idx").on(table.holdExpiresAt),
  ]
);

// 10. Bookings
export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingReference: varchar("booking_reference", { length: 32 }).notNull().unique(), // e.g. 'CB-8K9L2'
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    showtimeId: uuid("showtime_id")
      .notNull()
      .references(() => showtimes.id, { onDelete: "cascade" }),
    // Booking status: PENDING, CONFIRMED, CANCELLED, EXPIRED, REFUNDED
    status: varchar("status", { length: 50 }).notNull().default("PENDING"),
    // Money as integer minor units (cents)
    subtotalCents: integer("subtotal_cents").notNull(),
    serviceFeeCents: integer("service_fee_cents").notNull().default(150),
    taxCents: integer("tax_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("booking_user_idx").on(table.userId),
    index("booking_showtime_idx").on(table.showtimeId),
    index("booking_status_idx").on(table.status),
    index("booking_reference_idx").on(table.bookingReference),
  ]
);

// 11. Booking Items
export const bookingItems = pgTable(
  "booking_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    showtimeSeatId: uuid("showtime_seat_id")
      .notNull()
      .references(() => showtimeSeats.id, { onDelete: "cascade" }),
    seatId: uuid("seat_id")
      .notNull()
      .references(() => seats.id, { onDelete: "cascade" }),
    priceCents: integer("price_cents").notNull(),
    seatType: varchar("seat_type", { length: 50 }).notNull(),
  },
  (table) => [
    index("booking_items_booking_idx").on(table.bookingId),
  ]
);

// 12. Payments
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull().unique(),
    paymentIntentId: varchar("payment_intent_id", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 50 }).notNull().default("STRIPE_TEST"),
    // Money as integer minor units
    amountCents: integer("amount_cents").notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("USD"),
    // Payment status: PENDING, SUCCEEDED, FAILED, REFUNDED
    status: varchar("status", { length: 50 }).notNull().default("PENDING"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("payment_booking_idx").on(table.bookingId),
    index("payment_idempotency_idx").on(table.idempotencyKey),
  ]
);

// 13. Tickets
export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    ticketCode: varchar("ticket_code", { length: 64 }).notNull().unique(), // e.g. 'TKT-9F38A1'
    qrPayload: text("qr_payload").notNull(),
    status: varchar("status", { length: 50 }).notNull().default("VALID"), // 'VALID' | 'USED' | 'CANCELLED'
    issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("ticket_booking_idx").on(table.bookingId),
    index("ticket_code_idx").on(table.ticketCode),
  ]
);

// 14. Audit Logs
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }).notNull(),
    entityId: varchar("entity_id", { length: 255 }),
    details: jsonb("details").$type<Record<string, unknown>>().default({}),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_user_idx").on(table.userId),
    index("audit_action_idx").on(table.action),
    index("audit_created_at_idx").on(table.createdAt),
  ]
);

// Drizzle Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  auditLogs: many(auditLogs),
}));

export const moviesRelations = relations(movies, ({ many }) => ({
  movieGenres: many(movieGenres),
  showtimes: many(showtimes),
}));

export const genresRelations = relations(genres, ({ many }) => ({
  movieGenres: many(movieGenres),
}));

export const movieGenresRelations = relations(movieGenres, ({ one }) => ({
  movie: one(movies, {
    fields: [movieGenres.movieId],
    references: [movies.id],
  }),
  genre: one(genres, {
    fields: [movieGenres.genreId],
    references: [genres.id],
  }),
}));

export const cinemasRelations = relations(cinemas, ({ many }) => ({
  auditoriums: many(auditoriums),
}));

export const auditoriumsRelations = relations(auditoriums, ({ one, many }) => ({
  cinema: one(cinemas, {
    fields: [auditoriums.cinemaId],
    references: [cinemas.id],
  }),
  seats: many(seats),
  showtimes: many(showtimes),
}));

export const seatsRelations = relations(seats, ({ one, many }) => ({
  auditorium: one(auditoriums, {
    fields: [seats.auditoriumId],
    references: [auditoriums.id],
  }),
  showtimeSeats: many(showtimeSeats),
}));

export const showtimesRelations = relations(showtimes, ({ one, many }) => ({
  movie: one(movies, {
    fields: [showtimes.movieId],
    references: [movies.id],
  }),
  auditorium: one(auditoriums, {
    fields: [showtimes.auditoriumId],
    references: [auditoriums.id],
  }),
  showtimeSeats: many(showtimeSeats),
  bookings: many(bookings),
}));

export const showtimeSeatsRelations = relations(showtimeSeats, ({ one }) => ({
  showtime: one(showtimes, {
    fields: [showtimeSeats.showtimeId],
    references: [showtimes.id],
  }),
  seat: one(seats, {
    fields: [showtimeSeats.seatId],
    references: [seats.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  showtime: one(showtimes, {
    fields: [bookings.showtimeId],
    references: [showtimes.id],
  }),
  items: many(bookingItems),
  payments: many(payments),
  tickets: many(tickets),
}));

export const bookingItemsRelations = relations(bookingItems, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingItems.bookingId],
    references: [bookings.id],
  }),
  showtimeSeat: one(showtimeSeats, {
    fields: [bookingItems.showtimeSeatId],
    references: [showtimeSeats.id],
  }),
  seat: one(seats, {
    fields: [bookingItems.seatId],
    references: [seats.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  booking: one(bookings, {
    fields: [tickets.bookingId],
    references: [bookings.id],
  }),
}));
