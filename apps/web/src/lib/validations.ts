import { z } from 'zod';

// ====================================================================
// SHARED VALIDATION SCHEMAS (Zod)
// Used by both client-side forms and server-side API routes.
// ====================================================================

/** Nigerian phone number: +234XXXXXXXXXX */
const nigerianPhone = z
  .string()
  .regex(/^\+234\d{10}$/, 'Must be a valid Nigerian phone number (+234XXXXXXXXXX)');

/** Naira amount in kobo (integer, positive) */
const koboAmount = z.number().int().positive('Amount must be positive');

/** GPS coordinates */
const geoPoint = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// -------------------------------------------------------------------
// Auth
// -------------------------------------------------------------------

export const phoneLoginSchema = z.object({
  phone: nigerianPhone,
});

export const otpVerifySchema = z.object({
  phone: nigerianPhone,
  token: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
});

// -------------------------------------------------------------------
// Package / Consignment
// -------------------------------------------------------------------

export const packageCategorySchema = z.enum([
  'FASHION',
  'ELECTRONICS',
  'DOCUMENTS',
  'PERISHABLE_FOOD',
  'COSMETICS',
  'GENERAL',
]);

export const packageItemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  quantity: z.number().int().min(1).max(100),
  itemValueKobo: koboAmount,
  isFragile: z.boolean(),
  isPerishable: z.boolean(),
  unsealedPhotoUrls: z
    .array(z.string().url('Must be a valid photo URL'))
    .min(3, 'Minimum 3 inspection photos required')
    .max(6),
});

export const createPackageSchema = z.object({
  receiverName: z.string().min(2, 'Receiver name is required').max(100),
  receiverPhone: nigerianPhone,
  originName: z.string().min(3).max(200),
  originCoordinates: geoPoint,
  destinationName: z.string().min(3).max(200),
  destinationCoordinates: geoPoint,
  totalWeightKg: z.number().min(0.1).max(30, 'Maximum weight is 30kg'),
  category: packageCategorySchema,
  declaredValueKobo: koboAmount.max(50_000_000, 'Maximum declared value is ₦500,000'),
  offeredBountyKobo: koboAmount.min(100_000, 'Minimum bounty is ₦1,000'),
  pickupWindowStart: z.string().min(1),
  pickupWindowEnd: z.string().min(1),
  items: z.array(packageItemSchema).min(1).max(10),
});

// -------------------------------------------------------------------
// Trip
// -------------------------------------------------------------------

export const travelModeSchema = z.enum([
  'PRIVATE_CAR',
  'COMMERCIAL_BUS',
  'TRAIN',
  'AIR',
  'MOTORCYCLE',
]);

export const createTripSchema = z.object({
  originName: z.string().min(3).max(200),
  originCoordinates: geoPoint,
  destinationName: z.string().min(3).max(200),
  destinationCoordinates: geoPoint,
  departureTime: z.string().min(1),
  estimatedArrivalTime: z.string().min(1),
  travelMode: travelModeSchema,
  vehicleRegistration: z.string().min(3).max(100).optional(),
  maxCapacityKg: z.number().min(1).max(100),
  pricePerKgKobo: koboAmount,
});

// -------------------------------------------------------------------
// Agreement
// -------------------------------------------------------------------

export const createAgreementSchema = z.object({
  packageId: z.string().uuid('Invalid package ID'),
  tripId: z.string().uuid('Invalid trip ID'),
  agreedBountyKobo: koboAmount,
  pickupLocationDetail: z.string().min(3).max(300),
  dropoffLocationDetail: z.string().min(3).max(300),
});

// -------------------------------------------------------------------
// Escrow
// -------------------------------------------------------------------

export const fundEscrowSchema = z.object({
  agreementId: z.string().uuid('Invalid agreement ID'),
  paystackReference: z.string().min(1, 'Paystack reference is required'),
});

// -------------------------------------------------------------------
// Handover OTP Verification
// -------------------------------------------------------------------

export const verifyHandoverSchema = z.object({
  agreementId: z.string().uuid(),
  otp: z.string().length(4, 'OTP must be 4 digits').regex(/^\d+$/, 'OTP must be numeric'),
  sealSerialNumber: z.string().min(5).max(30),
});

export const verifyDeliverySchema = z.object({
  agreementId: z.string().uuid(),
  otp: z.string().length(4, 'OTP must be 4 digits').regex(/^\d+$/, 'OTP must be numeric'),
});

// -------------------------------------------------------------------
// Wallet / Withdrawal
// -------------------------------------------------------------------

export const withdrawalSchema = z.object({
  amountKobo: koboAmount.min(50_000, 'Minimum withdrawal is ₦500'),
  bankCode: z.string().min(3).max(10),
  accountNumber: z
    .string()
    .length(10, 'Account number must be 10 digits')
    .regex(/^\d+$/, 'Account number must be numeric'),
});

// -------------------------------------------------------------------
// Type exports for use in components
// -------------------------------------------------------------------

export type PhoneLoginInput = z.infer<typeof phoneLoginSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type CreateTripInput = z.infer<typeof createTripSchema>;
export type CreateAgreementInput = z.infer<typeof createAgreementSchema>;
export type FundEscrowInput = z.infer<typeof fundEscrowSchema>;
export type VerifyHandoverInput = z.infer<typeof verifyHandoverSchema>;
export type VerifyDeliveryInput = z.infer<typeof verifyDeliverySchema>;
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
