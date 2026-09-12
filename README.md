# CineBook 🎬 — Production-Ready Cinema Ticket Booking Web App

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Serverless-blue?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.38-yellow?style=for-the-badge)](https://orm.drizzle.team/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Tested_with-Vitest-green?style=for-the-badge&logo=vitest)](https://vitest.dev/)

CineBook is a production-grade cinema ticketing platform engineered for high-concurrency seat reservation, zero double-booking guarantees, and seamless deployment to **Vercel** with **Neon Serverless PostgreSQL** from Vercel Marketplace.

---

## 👥 The CineBook Multi-Agent Team

1. **Agent 1: App Agent (Frontend & Interactive UI)**
   - High-performance, responsive UI built with Next.js 15 App Router and Tailwind CSS.
   - Cinematic dark-mode aesthetic with amber/gold neon accents, glassmorphic cards, and micro-animations.
   - Curved auditorium seat map with live status (`AVAILABLE`, `HELD`, `BOOKED`, `BLOCKED`), seating tiers (Standard, Premium, VIP Recliner, Wheelchair Accessible), and a 10-minute hold countdown clock.
   - Comprehensive pages: Home, Movie Details, Cinemas, Showtimes, Interactive Seat Selection, Checkout, Digital Ticket with dynamic SVG QR Code, My Bookings, and Admin Dashboard.
   - Full cancellation flow allowing refunds up to 2 hours before showtime.

2. **Agent 2: Database Engine Agent (Data, ACID Locks & Concurrency)**
   - Neon PostgreSQL schema with Drizzle ORM managing 14 relational tables with strict UUID primary keys, UTC timestamps, and integer minor units (cents) for monetary amounts.
   - ACID row-level locking (`FOR UPDATE`) in seat hold transactions.
   - Unique constraints on cinema screens, auditorium seat coordinates, and `(showtime_id, seat_id)` ensuring a seat cannot be booked twice.
   - Payment idempotency key deduplication to prevent double charges and duplicate tickets.
   - Idempotent background cleanup endpoint (`/api/cron/release-holds`) protected by `CRON_SECRET`.

3. **Agent 3: QA Agent (Testing, Telemetry & Verification)**
   - Comprehensive automated test suite powered by Vitest verifying:
     - Concurrent race conditions (two users attempting to lock the exact same seat simultaneously; strictly 1 succeeds).
     - Seat hold expiration and automatic release.
     - Payment idempotency keys and price tampering rejection.
     - Auth password hashing, JWT session verification, and IDOR protection.
   - Vercel production build validation.

---

## ⚡ Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v22 and v24)
- **npm** or **pnpm**

### 2. Clone and Install
```bash
cd Cinebook
npm install
```

### 3. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env.local
```

Configure your environment variables:
```env
# Neon PostgreSQL (from Vercel Marketplace)
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:YOUR_PASSWORD@ep-sample.us-east-2.aws.neon.tech/neondb?sslmode=require

# Application Secrets
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long!
CRON_SECRET=your_cron_secret_auth_token_for_maintenance_jobs
PAYMENT_WEBHOOK_SECRET=whsec_test_secret_for_cinebook_payment_webhooks
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note**: CineBook includes a built-in state engine with sample movies, flagship cinemas, auditoriums, and pre-generated seats. If no live database URL is provided during local dev, the app will run with in-memory persistence and full ACID locking so you can test all features immediately!

### 4. Database Migrations & Seeding
```bash
# Generate SQL migrations from schema
npm run db:generate

# Apply migrations to live Neon PostgreSQL
npm run db:migrate

# Seed database with sample blockbusters, theaters, auditoriums, and seats
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running the Automated QA Test Suite

Run all concurrency, hold expiry, payment idempotency, and security tests:
```bash
npm test
```

### What is Tested:
1. **Concurrent Seat Locking Race Condition (`tests/booking-concurrency.test.ts`)**:
   Simultaneously fires two asynchronous seat-hold requests for the exact same seat from two different sessions. Verifies that strictly one succeeds with HTTP 201/success and the other receives a conflict rejection (HTTP 409).
2. **Hold Expiry & Release (`tests/hold-expiry.test.ts`)**:
   Holds a seat, advances the clock past the 10-minute threshold, triggers the release job, and verifies the seat status returns to `AVAILABLE` and the booking is marked `EXPIRED`.
3. **Payment Idempotency (`tests/payment-idempotency.test.ts`)**:
   Tests payment confirmation and validates that re-sending the same idempotency key returns the existing ticket without double charging. Rejects requests that tamper with seat pricing.
4. **Auth & IDOR Security (`tests/auth-security-idor.test.ts`)**:
   Tests bcrypt hashing, session cookies, and ensures User B cannot view, confirm, or cancel User A's reservations.

---

## 🚀 Vercel Deployment Instructions

### Step 1: Push Repository to GitHub
```bash
git init
git add .
git commit -m "feat: complete CineBook production app"
git remote add origin https://github.com/YOUR_USER/cinebook.git
git push -u origin main
```

### Step 2: Provision Neon PostgreSQL via Vercel Marketplace
1. Log in to the [Vercel Dashboard](https://vercel.com).
2. Navigate to your Project -> **Storage** -> **Marketplace** -> Select **Neon Serverless Postgres**.
3. Choose your preferred region (e.g. `US East (Ohio)` or `EU Frankfurt`).
4. Vercel automatically injects the following environment variables:
   - `DATABASE_URL`: Pooled connection string for serverless API routes.
   - `DATABASE_URL_UNPOOLED`: Direct connection string for Drizzle Kit migrations.

### Step 3: Add Additional Production Secrets in Vercel
In **Project Settings** -> **Environment Variables**, add:
- `JWT_SECRET`: Random 32+ character string.
- `CRON_SECRET`: Secure bearer token for Vercel Cron.
- `PAYMENT_WEBHOOK_SECRET`: Secret key for Stripe/payment webhook verification.

### Step 4: Configure Vercel Cron for Expired Seat Release
In `vercel.json` (already configured in this repository):
```json
{
  "crons": [
    {
      "path": "/api/cron/release-holds",
      "schedule": "*/5 * * * *"
    }
  ]
}
```
Vercel will call `/api/cron/release-holds` every 5 minutes with `Authorization: Bearer ${CRON_SECRET}` to automatically release expired seat holds.

### Step 5: Build & Deploy
Deploying triggers `next build` and runs the production build. To seed your production database on first deploy, run:
```bash
npm run db:migrate
npm run db:seed
```

---

## 🔐 Default Demo Accounts

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin** | `admin@cinebook.com` | `CineBook2026!` | Full Admin Portal, revenue metrics, manual hold release |
| **Customer** | `alex@cinebook.com` | `CineBook2026!` | Ticket booking, seat selection, cancellation |

*Both accounts can also be logged into with 1-click on the `/auth/login` page.*

---

## 🛡️ Architecture & Database Rules

- **UUIDs**: All primary keys (`users.id`, `movies.id`, `showtimes.id`, `bookings.id`, `tickets.id`, etc.) are generated as UUIDs.
- **Integer Minor Units**: All monetary amounts (`subtotal_cents`, `price_standard_cents`, `total_cents`, etc.) are stored as integers to prevent IEEE-754 floating point rounding discrepancies.
- **Seat States**: `AVAILABLE`, `HELD`, `BOOKED`, `BLOCKED`.
- **Booking States**: `PENDING`, `CONFIRMED`, `CANCELLED`, `EXPIRED`, `REFUNDED`.
- **Payment Separation**: Payment records and statuses (`PENDING`, `SUCCEEDED`, `FAILED`, `REFUNDED`) are stored in a dedicated `payments` table linked to `bookings`.
