import { createServerSupabaseClient, createUserScopedClient } from './supabase';
import type { CreatePackageInput, CreateTripInput, CreateAgreementInput } from './validations';
import { generateOtp, hashOtp } from './api-helpers';
import { calculateDeliveryPricing } from '@carryam/shared';

// ====================================================================
// DATABASE QUERY LAYER
// All Supabase queries centralized here. No direct DB calls in routes.
// ====================================================================

// -------------------------------------------------------------------
// Profiles
// -------------------------------------------------------------------

export async function getProfile(userId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw new Error(`Profile not found: ${error.message}`);
  return data;
}

export async function upsertProfile(userId: string, updates: {
  readonly first_name?: string;
  readonly last_name?: string;
  readonly phone_number?: string;
  readonly email?: string;
  readonly avatar_url?: string;
}) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates })
    .select()
    .single();

  if (error) throw new Error(`Profile upsert failed: ${error.message}`);
  return data;
}

// -------------------------------------------------------------------
// Trips
// -------------------------------------------------------------------

export async function listTrips(filters?: {
  readonly status?: string;
  readonly limit?: number;
  readonly offset?: number;
}) {
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from('trips')
    .select('*, carrier:profiles!trips_carrier_id_fkey(*)', { count: 'exact' })
    .order('departure_time', { ascending: true });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const limit = filters?.limit ?? 20;
  const offset = filters?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(`Trips query failed: ${error.message}`);
  return { trips: data ?? [], total: count ?? 0 };
}

export async function getTrip(tripId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('trips')
    .select('*, carrier:profiles!trips_carrier_id_fkey(*)')
    .eq('id', tripId)
    .single();

  if (error) throw new Error(`Trip not found: ${error.message}`);
  return data;
}

export async function createTrip(carrierId: string, input: CreateTripInput) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('trips')
    .insert({
      carrier_id: carrierId,
      origin_name: input.originName,
      origin_coordinates: `POINT(${input.originCoordinates.lng} ${input.originCoordinates.lat})`,
      destination_name: input.destinationName,
      destination_coordinates: `POINT(${input.destinationCoordinates.lng} ${input.destinationCoordinates.lat})`,
      departure_time: input.departureTime,
      estimated_arrival_time: input.estimatedArrivalTime,
      travel_mode: input.travelMode,
      vehicle_registration: input.vehicleRegistration,
      max_capacity_kg: input.maxCapacityKg,
      available_capacity_kg: input.maxCapacityKg,
      price_per_kg_kobo: input.pricePerKgKobo,
      status: 'SCHEDULED',
    })
    .select('*, carrier:profiles!trips_carrier_id_fkey(*)')
    .single();

  if (error) throw new Error(`Trip creation failed: ${error.message}`);
  return data;
}

// -------------------------------------------------------------------
// Packages
// -------------------------------------------------------------------

export async function listPackages(filters?: {
  readonly status?: string;
  readonly senderId?: string;
  readonly limit?: number;
  readonly offset?: number;
}) {
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from('packages')
    .select('*, sender:profiles!packages_sender_id_fkey(*), items:package_items(*)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.senderId) {
    query = query.eq('sender_id', filters.senderId);
  }

  const limit = filters?.limit ?? 20;
  const offset = filters?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(`Packages query failed: ${error.message}`);
  return { packages: data ?? [], total: count ?? 0 };
}

export async function getPackage(packageId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('packages')
    .select('*, sender:profiles!packages_sender_id_fkey(*), items:package_items(*)')
    .eq('id', packageId)
    .single();

  if (error) throw new Error(`Package not found: ${error.message}`);
  return data;
}

export async function createPackage(senderId: string, input: CreatePackageInput) {
  const supabase = createServerSupabaseClient();

  // Insert package
  const { data: pkg, error: pkgError } = await supabase
    .from('packages')
    .insert({
      sender_id: senderId,
      receiver_name: input.receiverName,
      receiver_phone: input.receiverPhone,
      origin_name: input.originName,
      origin_coordinates: `POINT(${input.originCoordinates.lng} ${input.originCoordinates.lat})`,
      destination_name: input.destinationName,
      destination_coordinates: `POINT(${input.destinationCoordinates.lng} ${input.destinationCoordinates.lat})`,
      total_weight_kg: input.totalWeightKg,
      category: input.category,
      declared_value_kobo: input.declaredValueKobo,
      offered_bounty_kobo: input.offeredBountyKobo,
      pickup_window_start: input.pickupWindowStart,
      pickup_window_end: input.pickupWindowEnd,
      status: 'LISTED',
    })
    .select()
    .single();

  if (pkgError) throw new Error(`Package creation failed: ${pkgError.message}`);

  // Insert package items
  if (input.items.length > 0) {
    const itemRows = input.items.map(item => ({
      package_id: pkg.id,
      title: item.title,
      quantity: item.quantity,
      item_value_kobo: item.itemValueKobo,
      is_fragile: item.isFragile,
      is_perishable: item.isPerishable,
      unsealed_photo_urls: item.unsealedPhotoUrls,
    }));

    const { error: itemsError } = await supabase
      .from('package_items')
      .insert(itemRows);

    if (itemsError) throw new Error(`Package items creation failed: ${itemsError.message}`);
  }

  return pkg;
}

// -------------------------------------------------------------------
// Agreements
// -------------------------------------------------------------------

export async function listAgreements(filters?: {
  readonly senderId?: string;
  readonly carrierId?: string;
  readonly limit?: number;
}) {
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from('delivery_agreements')
    .select(`
      *,
      package:packages!delivery_agreements_package_id_fkey(*, sender:profiles!packages_sender_id_fkey(*), items:package_items(*)),
      trip:trips!delivery_agreements_trip_id_fkey(*, carrier:profiles!trips_carrier_id_fkey(*))
    `)
    .order('created_at', { ascending: false });

  if (filters?.senderId) {
    query = query.eq('sender_id', filters.senderId);
  }
  if (filters?.carrierId) {
    query = query.eq('carrier_id', filters.carrierId);
  }

  const limit = filters?.limit ?? 20;
  query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw new Error(`Agreements query failed: ${error.message}`);
  return data ?? [];
}

export async function getAgreement(agreementId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('delivery_agreements')
    .select(`
      *,
      package:packages!delivery_agreements_package_id_fkey(*, sender:profiles!packages_sender_id_fkey(*), items:package_items(*)),
      trip:trips!delivery_agreements_trip_id_fkey(*, carrier:profiles!trips_carrier_id_fkey(*))
    `)
    .eq('id', agreementId)
    .single();

  if (error) throw new Error(`Agreement not found: ${error.message}`);
  return data;
}

export async function createAgreement(
  senderId: string,
  carrierId: string,
  input: CreateAgreementInput,
) {
  const supabase = createServerSupabaseClient();

  // Calculate pricing
  const pkg = await getPackage(input.packageId);
  const pricing = calculateDeliveryPricing(input.agreedBountyKobo, pkg.declared_value_kobo);

  // Generate OTPs (hashed for storage)
  const handoverOtp = generateOtp();
  const deliveryOtp = generateOtp();
  const handoverOtpHash = await hashOtp(handoverOtp);
  const deliveryOtpHash = await hashOtp(deliveryOtp);

  // Insert agreement
  const { data: agreement, error: agrError } = await supabase
    .from('delivery_agreements')
    .insert({
      package_id: input.packageId,
      trip_id: input.tripId,
      sender_id: senderId,
      carrier_id: carrierId,
      agreed_bounty_kobo: input.agreedBountyKobo,
      platform_fee_kobo: pricing.platformFeeKobo,
      protection_fee_kobo: pricing.protectionFeeKobo,
      total_sender_charge_kobo: pricing.totalSenderChargeKobo,
      pickup_location_detail: input.pickupLocationDetail,
      dropoff_location_detail: input.dropoffLocationDetail,
      sender_signed_at: new Date().toISOString(),
      carrier_signed_at: new Date().toISOString(),
      status: 'ACCEPTED',
    })
    .select()
    .single();

  if (agrError) throw new Error(`Agreement creation failed: ${agrError.message}`);

  // Update package status
  await supabase
    .from('packages')
    .update({ status: 'AGREED' })
    .eq('id', input.packageId);

  // Create handover record with hashed OTPs
  const sealSerial = `CAM-SEAL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  await supabase
    .from('handover_records')
    .insert({
      agreement_id: agreement.id,
      package_id: input.packageId,
      seal_serial_number: sealSerial,
      handover_otp_hash: handoverOtpHash,
      delivery_otp_hash: deliveryOtpHash,
      inspection_photos: pkg.items?.[0]?.unsealed_photo_urls ?? [],
    });

  // Return agreement + plaintext OTPs for SMS dispatch (NEVER stored in DB)
  return {
    agreement,
    otps: {
      handoverOtp,  // Send to sender via SMS
      deliveryOtp,  // Send to receiver via SMS
    },
    sealSerialNumber: sealSerial,
  };
}

// -------------------------------------------------------------------
// Escrow / Wallet
// -------------------------------------------------------------------

export async function getWalletSummary(userId: string) {
  const supabase = createServerSupabaseClient();

  // Get ledger balance
  const { data: ledgerData, error: ledgerError } = await supabase
    .from('ledger_entries')
    .select('direction, amount_kobo')
    .eq('account_id', userId);

  if (ledgerError) throw new Error(`Wallet query failed: ${ledgerError.message}`);

  let creditKobo = 0;
  let debitKobo = 0;
  for (const entry of ledgerData ?? []) {
    if (entry.direction === 'CREDIT') {
      creditKobo += entry.amount_kobo;
    } else {
      debitKobo += entry.amount_kobo;
    }
  }

  // Get pending escrow
  const { data: escrowData } = await supabase
    .from('escrow_transactions')
    .select('carrier_net_kobo')
    .eq('carrier_id', userId)
    .eq('status', 'HELD_IN_ESCROW');

  const pendingEscrowKobo = (escrowData ?? []).reduce(
    (sum, e) => sum + e.carrier_net_kobo, 0,
  );

  // Get recent transactions
  const { data: transactions } = await supabase
    .from('ledger_entries')
    .select('*')
    .eq('account_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  return {
    availableBalanceNaira: (creditKobo - debitKobo) / 100,
    pendingEscrowNaira: pendingEscrowKobo / 100,
    lifetimeEarningsNaira: creditKobo / 100,
    transactions: transactions ?? [],
  };
}

export async function getHandover(agreementId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('handover_records')
    .select('*')
    .eq('agreement_id', agreementId)
    .single();

  if (error) throw new Error(`Handover record not found: ${error.message}`);
  return data;
}
