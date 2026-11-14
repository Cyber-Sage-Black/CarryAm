-- ====================================================================
-- CARRYAM PRODUCTION SCHEMA & POSTGIS CORRIDOR ENGINE
-- ====================================================================
-- Migration: 20261107000000_init_carryam_schema.sql
-- Database: PostgreSQL 16 + PostGIS on Supabase
-- Target Beachhead: Lagos ⇄ Ibadan Corridor
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Enumerated Types
CREATE TYPE kyc_tier_enum AS ENUM ('TIER_0', 'TIER_1', 'TIER_2', 'TIER_3');
CREATE TYPE kyc_status_enum AS ENUM ('NOT_SUBMITTED', 'PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE id_provider_enum AS ENUM ('PREMBLY', 'SMILE_ID');
CREATE TYPE id_type_enum AS ENUM ('NIN', 'BVN', 'DRIVERS_LICENSE', 'PASSPORT', 'VOTERS_CARD');

CREATE TYPE travel_mode_enum AS ENUM ('PRIVATE_CAR', 'COMMERCIAL_BUS', 'TRAIN', 'AIR', 'MOTORCYCLE');
CREATE TYPE trip_status_enum AS ENUM ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

CREATE TYPE package_category_enum AS ENUM ('FASHION', 'ELECTRONICS', 'DOCUMENTS', 'PERISHABLE_FOOD', 'COSMETICS', 'GENERAL');
CREATE TYPE package_status_enum AS ENUM (
    'DRAFT', 'LISTED', 'REQUESTED', 'AGREED', 'ESCROW_FUNDED',
    'HANDED_OVER', 'IN_TRANSIT', 'DELIVERED', 'SETTLED', 'DISPUTED', 'CANCELLED'
);

CREATE TYPE agreement_status_enum AS ENUM ('PROPOSED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');
CREATE TYPE escrow_status_enum AS ENUM (
    'PENDING_DEPOSIT', 'HELD_IN_ESCROW', 'RELEASED_TO_CARRIER', 'REFUNDED_TO_SENDER', 'PARTIAL_SETTLEMENT'
);

CREATE TYPE ledger_account_type_enum AS ENUM (
    'SENDER_PAYABLE', 'ESCROW_HOLDING', 'CARRIER_WALLET', 'PLATFORM_REVENUE', 'GUARANTEE_RESERVE', 'GATEWAY_CLEARING'
);
CREATE TYPE ledger_entry_type_enum AS ENUM ('DEBIT', 'CREDIT');

CREATE TYPE handover_stage_enum AS ENUM ('PICKUP', 'DELIVERY');
CREATE TYPE seal_status_enum AS ENUM ('SEALED', 'VERIFIED_INTACT', 'DAMAGED_BREACHED');
CREATE TYPE dispute_status_enum AS ENUM (
    'OPEN', 'UNDER_INVESTIGATION', 'RESOLVED_REFUND', 'RESOLVED_PAYOUT', 'RESOLVED_SPLIT', 'DISMISSED'
);
CREATE TYPE dispute_reason_enum AS ENUM (
    'ITEM_DAMAGED', 'ITEM_MISSING', 'SEAL_TAMPERED', 'NO_SHOW', 'SEVERE_DELAY', 'CONTRABAND_SUSPECTED'
);

-- ====================================================================
-- 3. Core Relational Tables
-- ====================================================================

-- 3.1 Profiles Table (Linked to Supabase Auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    kyc_tier kyc_tier_enum NOT NULL DEFAULT 'TIER_0',
    trust_score NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK (trust_score >= 0.00 AND trust_score <= 5.00),
    completed_deliveries_count INT NOT NULL DEFAULT 0,
    dispute_count INT NOT NULL DEFAULT 0,
    is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_profiles_phone ON public.profiles(phone_number);
CREATE INDEX idx_profiles_kyc ON public.profiles(kyc_tier, is_suspended);

-- 3.2 KYC Verifications Table
CREATE TABLE public.kyc_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider id_provider_enum NOT NULL,
    id_type id_type_enum NOT NULL,
    id_number_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of NIN/BVN
    provider_reference VARCHAR(255),
    verification_status kyc_status_enum NOT NULL DEFAULT 'PENDING',
    target_tier kyc_tier_enum NOT NULL,
    liveness_score NUMERIC(5, 2),
    facial_match_score NUMERIC(5, 2),
    raw_provider_payload JSONB,
    rejection_reason TEXT,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_kyc_user ON public.kyc_verifications(user_id);
CREATE INDEX idx_kyc_hash ON public.kyc_verifications(id_number_hash);

-- 3.3 Trips Table (With PostGIS LineString Corridor)
CREATE TABLE public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    origin_name VARCHAR(255) NOT NULL,
    origin_point GEOGRAPHY(Point, 4326) NOT NULL,
    destination_name VARCHAR(255) NOT NULL,
    destination_point GEOGRAPHY(Point, 4326) NOT NULL,
    route_corridor GEOGRAPHY(LineString, 4326) NOT NULL, -- Mapbox decoded polyline in WGS84
    departure_time TIMESTAMPTZ NOT NULL,
    estimated_arrival_time TIMESTAMPTZ NOT NULL,
    travel_mode travel_mode_enum NOT NULL DEFAULT 'PRIVATE_CAR',
    vehicle_registration VARCHAR(50),
    max_capacity_kg NUMERIC(6, 2) NOT NULL CHECK (max_capacity_kg > 0),
    available_capacity_kg NUMERIC(6, 2) NOT NULL CHECK (available_capacity_kg >= 0),
    price_per_kg_kobo BIGINT NOT NULL DEFAULT 100000, -- in Nigerian Kobo (₦1,000 = 100000 kobo)
    status trip_status_enum NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_trip_dates CHECK (estimated_arrival_time > departure_time)
);
CREATE INDEX idx_trips_carrier ON public.trips(carrier_id);
CREATE INDEX idx_trips_corridor_gist ON public.trips USING GIST (route_corridor);
CREATE INDEX idx_trips_departure ON public.trips(departure_time, status);

-- 3.4 Packages Table
CREATE TABLE public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    receiver_name VARCHAR(150) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    origin_name VARCHAR(255) NOT NULL,
    origin_point GEOGRAPHY(Point, 4326) NOT NULL,
    destination_name VARCHAR(255) NOT NULL,
    destination_point GEOGRAPHY(Point, 4326) NOT NULL,
    total_weight_kg NUMERIC(6, 2) NOT NULL CHECK (total_weight_kg > 0),
    category package_category_enum NOT NULL,
    declared_value_kobo BIGINT NOT NULL CHECK (declared_value_kobo >= 0),
    offered_bounty_kobo BIGINT NOT NULL CHECK (offered_bounty_kobo > 0),
    pickup_window_start TIMESTAMPTZ NOT NULL,
    pickup_window_end TIMESTAMPTZ NOT NULL,
    status package_status_enum NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_package_window CHECK (pickup_window_end >= pickup_window_start)
);
CREATE INDEX idx_packages_sender ON public.packages(sender_id);
CREATE INDEX idx_packages_origin_gist ON public.packages USING GIST (origin_point);
CREATE INDEX idx_packages_dest_gist ON public.packages USING GIST (destination_point);
CREATE INDEX idx_packages_status ON public.packages(status, pickup_window_start);

-- 3.5 Package Items Table (Unsealed photo inspections)
CREATE TABLE public.package_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    item_value_kobo BIGINT NOT NULL DEFAULT 0,
    is_fragile BOOLEAN NOT NULL DEFAULT FALSE,
    is_perishable BOOLEAN NOT NULL DEFAULT FALSE,
    unsealed_photo_urls TEXT[] NOT NULL, -- Minimum 3 unsealed inspection photos
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_package_items_package ON public.package_items(package_id);

-- 3.6 Delivery Agreements Table
CREATE TABLE public.delivery_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE RESTRICT,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    carrier_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    agreed_bounty_kobo BIGINT NOT NULL,
    platform_fee_kobo BIGINT NOT NULL,
    protection_fee_kobo BIGINT NOT NULL,
    total_sender_charge_kobo BIGINT NOT NULL,
    pickup_location_detail TEXT NOT NULL,
    dropoff_location_detail TEXT NOT NULL,
    sender_signed_at TIMESTAMPTZ,
    carrier_signed_at TIMESTAMPTZ,
    status agreement_status_enum NOT NULL DEFAULT 'PROPOSED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_active_agreement_package UNIQUE (package_id, status)
);
CREATE INDEX idx_agreements_carrier ON public.delivery_agreements(carrier_id, status);
CREATE INDEX idx_agreements_trip ON public.delivery_agreements(trip_id);

-- 3.7 Escrow Transactions Table
CREATE TABLE public.escrow_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id UUID NOT NULL UNIQUE REFERENCES public.delivery_agreements(id) ON DELETE RESTRICT,
    package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    carrier_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    gross_amount_kobo BIGINT NOT NULL,
    carrier_net_kobo BIGINT NOT NULL,
    platform_revenue_kobo BIGINT NOT NULL,
    guarantee_reserve_kobo BIGINT NOT NULL,
    payment_gateway VARCHAR(50) NOT NULL DEFAULT 'PAYSTACK',
    gateway_reference VARCHAR(255) NOT NULL UNIQUE,
    gateway_fee_kobo BIGINT NOT NULL DEFAULT 0,
    status escrow_status_enum NOT NULL DEFAULT 'PENDING_DEPOSIT',
    funded_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_escrow_status ON public.escrow_transactions(status);
CREATE INDEX idx_escrow_gateway_ref ON public.escrow_transactions(gateway_reference);

-- 3.8 Double-Entry Ledger Entries Table
CREATE TABLE public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_group_id UUID NOT NULL,
    escrow_transaction_id UUID NOT NULL REFERENCES public.escrow_transactions(id) ON DELETE RESTRICT,
    account_type ledger_account_type_enum NOT NULL,
    user_id UUID REFERENCES public.profiles(id),
    entry_type ledger_entry_type_enum NOT NULL,
    amount_kobo BIGINT NOT NULL CHECK (amount_kobo > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    memo VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ledger_group ON public.ledger_entries(transaction_group_id);
CREATE INDEX idx_ledger_user_account ON public.ledger_entries(user_id, account_type);

-- 3.9 Handover Records Table (OTPs, Security Seals & Photos)
CREATE TABLE public.handover_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id UUID NOT NULL REFERENCES public.delivery_agreements(id) ON DELETE RESTRICT,
    stage handover_stage_enum NOT NULL,
    actor_id UUID NOT NULL REFERENCES public.profiles(id),
    target_phone VARCHAR(20) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    otp_salt VARCHAR(64) NOT NULL,
    otp_attempts INT NOT NULL DEFAULT 0,
    otp_verified_at TIMESTAMPTZ,
    seal_serial_number VARCHAR(100),
    seal_qr_hash VARCHAR(255),
    seal_status seal_status_enum,
    inspection_photos JSONB NOT NULL DEFAULT '[]'::JSONB,
    notes TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_agreement_stage UNIQUE (agreement_id, stage)
);
CREATE INDEX idx_handover_agreement ON public.handover_records(agreement_id);
CREATE INDEX idx_handover_seal ON public.handover_records(seal_serial_number);

-- 3.10 Ratings & Reviews Table
CREATE TABLE public.ratings_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id UUID NOT NULL REFERENCES public.delivery_agreements(id) ON DELETE RESTRICT,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id),
    reviewee_id UUID NOT NULL REFERENCES public.profiles(id),
    rating_score INT NOT NULL CHECK (rating_score BETWEEN 1 AND 5),
    punctuality_score INT CHECK (punctuality_score BETWEEN 1 AND 5),
    package_care_score INT CHECK (package_care_score BETWEEN 1 AND 5),
    communication_score INT CHECK (communication_score BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_review_direction UNIQUE (agreement_id, reviewer_id, reviewee_id)
);

-- 3.11 Disputes Table
CREATE TABLE public.disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id UUID NOT NULL REFERENCES public.delivery_agreements(id) ON DELETE RESTRICT,
    raised_by_id UUID NOT NULL REFERENCES public.profiles(id),
    defendant_id UUID NOT NULL REFERENCES public.profiles(id),
    reason dispute_reason_enum NOT NULL,
    description TEXT NOT NULL,
    evidence_photo_urls TEXT[] NOT NULL DEFAULT '{}',
    status dispute_status_enum NOT NULL DEFAULT 'OPEN',
    payout_to_carrier_kobo BIGINT DEFAULT 0,
    refund_to_sender_kobo BIGINT DEFAULT 0,
    adjudication_notes TEXT,
    resolved_by_admin_id UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_disputes_agreement ON public.disputes(agreement_id);
CREATE INDEX idx_disputes_status ON public.disputes(status);

-- ====================================================================
-- 4. Spatial Corridor Matching Function (PostGIS)
-- ====================================================================

CREATE OR REPLACE FUNCTION match_packages_for_trip(
    p_trip_id UUID,
    p_buffer_meters DOUBLE PRECISION DEFAULT 5000.0,
    p_time_window_hours INT DEFAULT 4
)
RETURNS TABLE (
    package_id UUID,
    sender_id UUID,
    category package_category_enum,
    total_weight_kg NUMERIC,
    offered_bounty_kobo BIGINT,
    origin_distance_meters DOUBLE PRECISION,
    destination_distance_meters DOUBLE PRECISION,
    pickup_fraction DOUBLE PRECISION,
    dropoff_fraction DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    WITH trip_ctx AS (
        SELECT 
            t.id AS trip_id,
            t.departure_time,
            t.available_capacity_kg,
            t.route_corridor::geometry AS route_geom,
            t.route_corridor AS route_geog
        FROM public.trips t
        WHERE t.id = p_trip_id
          AND t.status = 'SCHEDULED'
    )
    SELECT 
        p.id AS package_id,
        p.sender_id,
        p.category,
        p.total_weight_kg,
        p.offered_bounty_kobo,
        ST_Distance(p.origin_point, tc.route_geog) AS origin_distance_meters,
        ST_Distance(p.destination_point, tc.route_geog) AS destination_distance_meters,
        ST_LineLocatePoint(tc.route_geom, p.origin_point::geometry) AS pickup_fraction,
        ST_LineLocatePoint(tc.route_geom, p.destination_point::geometry) AS dropoff_fraction
    FROM public.packages p
    CROSS JOIN trip_ctx tc
    WHERE p.status = 'LISTED'
      AND p.total_weight_kg <= tc.available_capacity_kg
      AND p.pickup_window_start <= (tc.departure_time + (p_time_window_hours || ' hours')::INTERVAL)
      AND p.pickup_window_end >= (tc.departure_time - (p_time_window_hours || ' hours')::INTERVAL)
      AND ST_DWithin(p.origin_point, tc.route_geog, p_buffer_meters)
      AND ST_DWithin(p.destination_point, tc.route_geog, p_buffer_meters)
      AND ST_LineLocatePoint(tc.route_geom, p.origin_point::geometry) < 
          ST_LineLocatePoint(tc.route_geom, p.destination_point::geometry)
    ORDER BY 
        (origin_distance_meters + destination_distance_meters) ASC,
        p.offered_bounty_kobo DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ====================================================================
-- 5. Row Level Security (RLS) Policies
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handover_records ENABLE ROW LEVEL SECURITY;

-- Profiles: Public can read basic profile info; user can update own profile
CREATE POLICY "Public profiles are readable" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Trips: Active/scheduled trips are viewable by all authenticated users
CREATE POLICY "Trips are viewable by all authenticated users" ON public.trips
    FOR SELECT TO authenticated USING (status = 'SCHEDULED' OR carrier_id = auth.uid());

CREATE POLICY "Carriers can manage own trips" ON public.trips
    FOR ALL TO authenticated USING (carrier_id = auth.uid());

-- Packages: Listed packages are viewable by verified travelers
CREATE POLICY "Listed packages viewable by authenticated users" ON public.packages
    FOR SELECT TO authenticated USING (status = 'LISTED' OR sender_id = auth.uid());

CREATE POLICY "Senders can manage own packages" ON public.packages
    FOR ALL TO authenticated USING (sender_id = auth.uid());

-- Agreements: Only involved sender and carrier can view and manage
CREATE POLICY "Parties can view their agreements" ON public.delivery_agreements
    FOR SELECT TO authenticated USING (sender_id = auth.uid() OR carrier_id = auth.uid());

CREATE POLICY "Parties can update their agreements" ON public.delivery_agreements
    FOR UPDATE TO authenticated USING (sender_id = auth.uid() OR carrier_id = auth.uid());

-- Escrow: Only involved parties can view transaction status
CREATE POLICY "Parties can view escrow status" ON public.escrow_transactions
    FOR SELECT TO authenticated USING (sender_id = auth.uid() OR carrier_id = auth.uid());
