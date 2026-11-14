import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MatchedPackageResult } from './types';

export function getSupabaseClient(supabaseUrl: string, supabaseAnonKey: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

/**
 * Invokes the PostGIS corridor matching RPC function `match_packages_for_trip`
 * defined in `supabase/migrations/20261107000000_init_carryam_schema.sql`
 */
export async function matchPackagesForTrip(
  supabase: SupabaseClient,
  tripId: string,
  bufferMeters: number = 5000,
  timeWindowHours: number = 4
): Promise<{ data: MatchedPackageResult[] | null; error: any }> {
  const { data, error } = await supabase.rpc('match_packages_for_trip', {
    p_trip_id: tripId,
    p_buffer_meters: bufferMeters,
    p_time_window_hours: timeWindowHours,
  });

  if (error) {
    return { data: null, error };
  }

  const mapped: MatchedPackageResult[] = (data || []).map((row: any) => ({
    packageId: row.package_id,
    senderId: row.sender_id,
    category: row.category,
    totalWeightKg: parseFloat(row.total_weight_kg),
    offeredBountyKobo: parseInt(row.offered_bounty_kobo, 10),
    originDistanceMeters: parseFloat(row.origin_distance_meters),
    destinationDistanceMeters: parseFloat(row.destination_distance_meters),
    pickupFraction: parseFloat(row.pickup_fraction),
    dropoffFraction: parseFloat(row.dropoff_fraction),
  }));

  return { data: mapped, error: null };
}
