export type KycTier = 'TIER_0' | 'TIER_1' | 'TIER_2' | 'TIER_3';
export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type TravelMode = 'PRIVATE_CAR' | 'COMMERCIAL_BUS' | 'TRAIN' | 'AIR' | 'MOTORCYCLE';
export type TripStatus = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type PackageCategory = 
  | 'FASHION' 
  | 'ELECTRONICS' 
  | 'DOCUMENTS' 
  | 'PERISHABLE_FOOD' 
  | 'COSMETICS' 
  | 'GENERAL';

export type PackageStatus =
  | 'DRAFT'
  | 'LISTED'
  | 'REQUESTED'
  | 'AGREED'
  | 'ESCROW_FUNDED'
  | 'HANDED_OVER'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'SETTLED'
  | 'DISPUTED'
  | 'CANCELLED';

export type AgreementStatus = 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
export type EscrowStatus =
  | 'PENDING_DEPOSIT'
  | 'HELD_IN_ESCROW'
  | 'RELEASED_TO_CARRIER'
  | 'REFUNDED_TO_SENDER'
  | 'PARTIAL_SETTLEMENT';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Profile {
  id: string;
  phoneNumber: string;
  email?: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  kycTier: KycTier;
  trustScore: number;
  completedDeliveriesCount: number;
  disputeCount: number;
  isSuspended: boolean;
  createdAt: string;
}

export interface Trip {
  id: string;
  carrierId: string;
  originName: string;
  originCoordinates: GeoPoint;
  destinationName: string;
  destinationCoordinates: GeoPoint;
  departureTime: string;
  estimatedArrivalTime: string;
  travelMode: TravelMode;
  vehicleRegistration?: string;
  maxCapacityKg: number;
  availableCapacityKg: number;
  pricePerKgKobo: number;
  status: TripStatus;
  carrier?: Profile;
}

export interface PackageItem {
  id: string;
  title: string;
  quantity: number;
  itemValueKobo: number;
  isFragile: boolean;
  isPerishable: boolean;
  unsealedPhotoUrls: string[];
}

export interface Package {
  id: string;
  senderId: string;
  receiverName: string;
  receiverPhone: string;
  originName: string;
  originCoordinates: GeoPoint;
  destinationName: string;
  destinationCoordinates: GeoPoint;
  totalWeightKg: number;
  category: PackageCategory;
  declaredValueKobo: number;
  offeredBountyKobo: number;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  status: PackageStatus;
  items?: PackageItem[];
  sender?: Profile;
}

export interface DeliveryAgreement {
  id: string;
  packageId: string;
  tripId: string;
  senderId: string;
  carrierId: string;
  agreedBountyKobo: number;
  platformFeeKobo: number;
  protectionFeeKobo: number;
  totalSenderChargeKobo: number;
  pickupLocationDetail: string;
  dropoffLocationDetail: string;
  senderSignedAt?: string;
  carrierSignedAt?: string;
  status: AgreementStatus;
  package?: Package;
  trip?: Trip;
}

export interface MatchedPackageResult {
  packageId: string;
  senderId: string;
  category: PackageCategory;
  totalWeightKg: number;
  offeredBountyKobo: number;
  originDistanceMeters: number;
  destinationDistanceMeters: number;
  pickupFraction: number;
  dropoffFraction: number;
}

/**
 * Calculates financial breakdown in Nigerian Kobo:
 * Platform commission (18%) + Protection fee (~₦200 to ₦1000 depending on value)
 */
export function calculateDeliveryPricing(bountyKobo: number, declaredValueKobo: number = 0) {
  const platformFeeKobo = Math.round(bountyKobo * 0.18);
  // Protection fee: base ₦200 (20000 kobo) + 1% of declared value above ₦10,000
  const excessValue = Math.max(0, declaredValueKobo - 1000000);
  const protectionFeeKobo = 20000 + Math.round(excessValue * 0.01);
  const totalSenderChargeKobo = bountyKobo + platformFeeKobo + protectionFeeKobo;

  return {
    carrierBountyKobo: bountyKobo,
    platformFeeKobo,
    protectionFeeKobo,
    totalSenderChargeKobo,
    // Human readable Naira amounts
    carrierBountyNaira: bountyKobo / 100,
    totalSenderChargeNaira: totalSenderChargeKobo / 100,
  };
}
