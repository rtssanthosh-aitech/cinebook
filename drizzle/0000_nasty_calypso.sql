CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" varchar(255),
	"details" jsonb DEFAULT '{}'::jsonb,
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auditoriums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cinema_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"screen_type" varchar(50) DEFAULT 'STANDARD' NOT NULL,
	"total_seats" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"showtime_seat_id" uuid NOT NULL,
	"seat_id" uuid NOT NULL,
	"price_cents" integer NOT NULL,
	"seat_type" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_reference" varchar(32) NOT NULL,
	"user_id" uuid NOT NULL,
	"showtime_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"service_fee_cents" integer DEFAULT 150 NOT NULL,
	"tax_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_booking_reference_unique" UNIQUE("booking_reference")
);
--> statement-breakpoint
CREATE TABLE "cinemas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"address" varchar(500) NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"postal_code" varchar(32) NOT NULL,
	"phone" varchar(50),
	"amenities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cinemas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	CONSTRAINT "genres_name_unique" UNIQUE("name"),
	CONSTRAINT "genres_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "movie_genres" (
	"movie_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL,
	CONSTRAINT "movie_genres_movie_id_genre_id_pk" PRIMARY KEY("movie_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "movies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"synopsis" text NOT NULL,
	"poster_url" varchar(1024) NOT NULL,
	"backdrop_url" varchar(1024) NOT NULL,
	"trailer_url" varchar(1024),
	"duration_mins" integer NOT NULL,
	"release_date" varchar(32) NOT NULL,
	"rating" varchar(32) NOT NULL,
	"language" varchar(64) DEFAULT 'English' NOT NULL,
	"status" varchar(32) DEFAULT 'NOW_SHOWING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "movies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"payment_intent_id" varchar(255) NOT NULL,
	"provider" varchar(50) DEFAULT 'STRIPE_TEST' NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "seats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auditorium_id" uuid NOT NULL,
	"row_label" varchar(10) NOT NULL,
	"seat_number" integer NOT NULL,
	"seat_type" varchar(50) DEFAULT 'STANDARD' NOT NULL,
	"is_accessible" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "showtime_seats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"showtime_id" uuid NOT NULL,
	"seat_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'AVAILABLE' NOT NULL,
	"hold_expires_at" timestamp with time zone,
	"held_by_user_id" uuid,
	"booking_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "showtimes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"movie_id" uuid NOT NULL,
	"auditorium_id" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"price_standard_cents" integer DEFAULT 1400 NOT NULL,
	"price_premium_cents" integer DEFAULT 1850 NOT NULL,
	"price_vip_cents" integer DEFAULT 2400 NOT NULL,
	"status" varchar(50) DEFAULT 'SCHEDULED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"ticket_code" varchar(64) NOT NULL,
	"qr_payload" text NOT NULL,
	"status" varchar(50) DEFAULT 'VALID' NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tickets_ticket_code_unique" UNIQUE("ticket_code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(32) DEFAULT 'USER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditoriums" ADD CONSTRAINT "auditoriums_cinema_id_cinemas_id_fk" FOREIGN KEY ("cinema_id") REFERENCES "public"."cinemas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_showtime_seat_id_showtime_seats_id_fk" FOREIGN KEY ("showtime_seat_id") REFERENCES "public"."showtime_seats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_seat_id_seats_id_fk" FOREIGN KEY ("seat_id") REFERENCES "public"."seats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_showtime_id_showtimes_id_fk" FOREIGN KEY ("showtime_id") REFERENCES "public"."showtimes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_genres" ADD CONSTRAINT "movie_genres_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_genres" ADD CONSTRAINT "movie_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seats" ADD CONSTRAINT "seats_auditorium_id_auditoriums_id_fk" FOREIGN KEY ("auditorium_id") REFERENCES "public"."auditoriums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showtime_seats" ADD CONSTRAINT "showtime_seats_showtime_id_showtimes_id_fk" FOREIGN KEY ("showtime_id") REFERENCES "public"."showtimes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showtime_seats" ADD CONSTRAINT "showtime_seats_seat_id_seats_id_fk" FOREIGN KEY ("seat_id") REFERENCES "public"."seats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showtime_seats" ADD CONSTRAINT "showtime_seats_held_by_user_id_users_id_fk" FOREIGN KEY ("held_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showtimes" ADD CONSTRAINT "showtimes_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showtimes" ADD CONSTRAINT "showtimes_auditorium_id_auditoriums_id_fk" FOREIGN KEY ("auditorium_id") REFERENCES "public"."auditoriums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "cinema_auditorium_name_idx" ON "auditoriums" USING btree ("cinema_id","name");--> statement-breakpoint
CREATE INDEX "booking_items_booking_idx" ON "booking_items" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "booking_user_idx" ON "bookings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "booking_showtime_idx" ON "bookings" USING btree ("showtime_id");--> statement-breakpoint
CREATE INDEX "booking_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "booking_reference_idx" ON "bookings" USING btree ("booking_reference");--> statement-breakpoint
CREATE INDEX "payment_booking_idx" ON "payments" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "payment_idempotency_idx" ON "payments" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "auditorium_seat_pos_idx" ON "seats" USING btree ("auditorium_id","row_label","seat_number");--> statement-breakpoint
CREATE INDEX "seat_auditorium_idx" ON "seats" USING btree ("auditorium_id");--> statement-breakpoint
CREATE UNIQUE INDEX "showtime_seat_unique_idx" ON "showtime_seats" USING btree ("showtime_id","seat_id");--> statement-breakpoint
CREATE INDEX "showtime_seat_status_idx" ON "showtime_seats" USING btree ("showtime_id","status");--> statement-breakpoint
CREATE INDEX "showtime_seat_hold_expiry_idx" ON "showtime_seats" USING btree ("hold_expires_at");--> statement-breakpoint
CREATE INDEX "showtime_movie_idx" ON "showtimes" USING btree ("movie_id");--> statement-breakpoint
CREATE INDEX "showtime_auditorium_idx" ON "showtimes" USING btree ("auditorium_id");--> statement-breakpoint
CREATE INDEX "showtime_start_time_idx" ON "showtimes" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "ticket_booking_idx" ON "tickets" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "ticket_code_idx" ON "tickets" USING btree ("ticket_code");