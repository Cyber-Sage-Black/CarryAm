# CarryAm — Supabase & Environment Setup Guide

CarryAm is built with **Supabase** (PostgreSQL 16 + PostGIS) as the unified backend for both the **Web App** (`apps/web`) and the **Mobile App** (`apps/mobile`).

---

## 1. Quick Start: Setting up Supabase

### Option A: Hosted Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com) and create a new project named **`carryam-prod`** (or `carryam-dev`). Select a region closest to West Africa (e.g., `eu-west-1` Dublin or `eu-central-1` Frankfurt).
2. In the Supabase Dashboard, navigate to **SQL Editor**.
3. Copy the contents of `supabase/migrations/20261107000000_init_carryam_schema.sql` and run it. This will:
   - Enable `postgis` spatial extensions
   - Create all 12 production tables
   - Install the `match_packages_for_trip` PostGIS corridor matching algorithm
   - Configure Row Level Security (RLS) policies
4. Run `supabase/seed.sql` to populate sample Lagos ⇄ Ibadan trips, listed packages, and verified test profiles.
5. In **Storage**, create two buckets:
   - `package-photos` (Public or signed URL read; for unsealed 3-photo inspections)
   - `kyc-documents` (Private; restricted to authenticated user and admins)

---

## 2. Environment Variables

Create `.env.local` inside `apps/web/` and `.env` inside `apps/mobile/`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-for-webhooks

# Mapbox (For Corridor Directions & Turn-by-Turn)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_public_token

# Paystack (For Agreement Escrow & Carrier Payouts)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_SECRET_KEY=sk_test_...

# Identity & SMS Verification
PREMBLY_API_KEY=your_prembly_key
TERMII_API_KEY=your_termii_key
```

---

## 3. Monorepo Structure

```
carryam/
├── supabase/
│   ├── migrations/
│   │   └── 20261107000000_init_carryam_schema.sql  # PostGIS & Tables DDL
│   └── seed.sql                                     # Lagos ⇄ Ibadan seed data
├── apps/
│   ├── web/                                         # Next.js 15 Web Application
│   └── mobile/                                      # React Native Expo Mobile App
└── packages/
    └── shared/                                      # Shared types & PostGIS RPC helpers
```

---

## 4. Running the Applications

### Web App:
```bash
npm install
npm run dev:web
# Web portal opens at http://localhost:3000
```

### Mobile App:
```bash
cd apps/mobile
npx expo start
# Scan the QR code with Expo Go on iOS / Android
# Or press 'w' to run in web browser preview
```
