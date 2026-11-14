-- ====================================================================
-- CARRYAM TEST SEED DATA: LAGOS ⇄ IBADAN CORRIDOR
-- ====================================================================

-- 1. Create Mock Authentication Users in auth.users (if running locally)
-- Note: In hosted Supabase, users are created via Auth API (Phone/Email)

DO $$
DECLARE
    v_carrier_id UUID := '11111111-1111-1111-1111-111111111111';
    v_sender_id  UUID := '22222222-2222-2222-2222-222222222222';
    v_trip_id    UUID := '33333333-3333-3333-3333-333333333333';
    v_package_id UUID := '44444444-4444-4444-4444-444444444444';
BEGIN
    -- Carrier Profile: Tunde (Verified Tier 2 Traveler)
    INSERT INTO public.profiles (
        id, phone_number, email, first_name, last_name, kyc_tier, trust_score, completed_deliveries_count
    ) VALUES (
        v_carrier_id, '+2348031112222', 'tunde.carrier@example.com', 'Tunde', 'Adeyemi', 'TIER_2', 4.95, 14
    ) ON CONFLICT (id) DO NOTHING;

    -- Sender Profile: Amina (Active Instagram Merchant)
    INSERT INTO public.profiles (
        id, phone_number, email, first_name, last_name, kyc_tier, trust_score, completed_deliveries_count
    ) VALUES (
        v_sender_id, '+2348029998888', 'amina.merchant@example.com', 'Amina', 'Bello', 'TIER_1', 4.88, 32
    ) ON CONFLICT (id) DO NOTHING;

    -- Trip: Lagos (Berger) -> Ibadan (Iwo Road)
    -- Approximate Lagos-Ibadan Expressway LineString (Berger -> Sagamu Interchange -> Ogere -> Guru Maharaj -> Iwo Road)
    INSERT INTO public.trips (
        id, carrier_id, origin_name, origin_point, destination_name, destination_point,
        route_corridor, departure_time, estimated_arrival_time, travel_mode,
        vehicle_registration, max_capacity_kg, available_capacity_kg, price_per_kg_kobo, status
    ) VALUES (
        v_trip_id,
        v_carrier_id,
        'TotalEnergies Berger, Lagos',
        ST_SetSRID(ST_MakePoint(3.3742, 6.6433), 4326)::geography, -- Berger (Lng, Lat)
        'Iwo Road Interchange, Ibadan',
        ST_SetSRID(ST_MakePoint(3.9398, 7.4019), 4326)::geography, -- Iwo Road (Lng, Lat)
        ST_SetSRID(ST_GeomFromText('LINESTRING(
            3.3742 6.6433,
            3.4120 6.7050,
            3.5100 6.8200,
            3.6200 6.9400,
            3.7500 7.1000,
            3.8500 7.2500,
            3.9398 7.4019
        )'), 4326)::geography,
        NOW() + INTERVAL '2 hours',
        NOW() + INTERVAL '5 hours',
        'PRIVATE_CAR',
        'KJA-492-AA (Silver Toyota Corolla)',
        30.0,
        28.0,
        100000,
        'SCHEDULED'
    ) ON CONFLICT (id) DO NOTHING;

    -- Package: Magodo Phase 2 (Lagos) -> Bodija Market (Ibadan)
    -- Both points lie within 2-3km of the Lagos-Ibadan Expressway corridor!
    INSERT INTO public.packages (
        id, sender_id, receiver_name, receiver_phone, origin_name, origin_point,
        destination_name, destination_point, total_weight_kg, category,
        declared_value_kobo, offered_bounty_kobo, pickup_window_start, pickup_window_end, status
    ) VALUES (
        v_package_id,
        v_sender_id,
        'Mrs. Funke Adeleke',
        '+2348055554444',
        'Magodo Phase 2 Gate, Lagos',
        ST_SetSRID(ST_MakePoint(3.3850, 6.6180), 4326)::geography, -- Magodo (Lng, Lat)
        'Bodija Market Junction, Ibadan',
        ST_SetSRID(ST_MakePoint(3.9056, 7.4325), 4326)::geography, -- Bodija (Lng, Lat)
        2.0,
        'COSMETICS',
        2500000, -- Declared value: ₦25,000
        250000,  -- Offered bounty: ₦2,500
        NOW() + INTERVAL '1 hour',
        NOW() + INTERVAL '4 hours',
        'LISTED'
    ) ON CONFLICT (id) DO NOTHING;

    -- Package Items (Mandatory unsealed photo URLs)
    INSERT INTO public.package_items (
        package_id, title, quantity, item_value_kobo, is_fragile, is_perishable, unsealed_photo_urls
    ) VALUES (
        v_package_id,
        'Organic Glow Skincare Cream Sets (3 Jars)',
        3,
        2500000,
        true,
        false,
        ARRAY[
            'https://r2.carryam.co/mock/open_top_view.jpg',
            'https://r2.carryam.co/mock/open_jars_inspect.jpg',
            'https://r2.carryam.co/mock/open_packaging_seal.jpg'
        ]
    );

    RAISE NOTICE 'CarryAm Lagos ⇄ Ibadan Seed Data Successfully Populated!';
END $$;
