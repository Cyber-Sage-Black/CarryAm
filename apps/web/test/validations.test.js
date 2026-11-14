const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { z } = require('zod');

// Mirror schemas from validations.ts for testing
const nigerianPhone = z
  .string()
  .regex(/^\+234\d{10}$/, 'Must be a valid Nigerian phone number (+234XXXXXXXXXX)');

const koboAmount = z.number().int().positive('Amount must be positive');

const packageCategorySchema = z.enum([
  'FASHION',
  'ELECTRONICS',
  'DOCUMENTS',
  'PERISHABLE_FOOD',
  'COSMETICS',
  'GENERAL',
]);

const packageItemSchema = z.object({
  title: z.string().min(3).max(200),
  quantity: z.number().int().min(1).max(100),
  itemValueKobo: koboAmount,
  isFragile: z.boolean(),
  isPerishable: z.boolean(),
  unsealedPhotoUrls: z
    .array(z.string().url())
    .min(3, 'Minimum 3 inspection photos required')
    .max(6),
});

const verifyHandoverSchema = z.object({
  agreementId: z.string().uuid(),
  otp: z.string().length(4).regex(/^\d+$/),
  sealSerialNumber: z.string().min(5).max(30),
});

describe('CarryAm Boundary Validation (Zod)', () => {
  test('validates Nigerian phone number format strictly (+234 followed by 10 digits)', () => {
    assert.equal(nigerianPhone.safeParse('+2348031112222').success, true);
    assert.equal(nigerianPhone.safeParse('+2349012345678').success, true);

    // Invalid formats
    assert.equal(nigerianPhone.safeParse('08031112222').success, false);
    assert.equal(nigerianPhone.safeParse('+23480311122').success, false); // too short
    assert.equal(nigerianPhone.safeParse('+23480311122223').success, false); // too long
    assert.equal(nigerianPhone.safeParse('+14155552671').success, false); // non-NG
    assert.equal(nigerianPhone.safeParse('not-a-number').success, false);
  });

  test('enforces minimum 3 unsealed photos for anti-contraband inspection', () => {
    const validItem = {
      title: 'Cosmetic Creams',
      quantity: 3,
      itemValueKobo: 2500000,
      isFragile: true,
      isPerishable: false,
      unsealedPhotoUrls: [
        'https://example.com/p1.jpg',
        'https://example.com/p2.jpg',
        'https://example.com/p3.jpg',
      ],
    };

    assert.equal(packageItemSchema.safeParse(validItem).success, true);

    // Only 2 photos - must fail anti-contraband requirement
    const invalidItem = {
      ...validItem,
      unsealedPhotoUrls: [
        'https://example.com/p1.jpg',
        'https://example.com/p2.jpg',
      ],
    };
    assert.equal(packageItemSchema.safeParse(invalidItem).success, false);
  });

  test('rejects non-numeric or malformed handover OTPs', () => {
    const valid = {
      agreementId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      otp: '4819',
      sealSerialNumber: 'CAM-SEAL-2026-9921',
    };

    assert.equal(verifyHandoverSchema.safeParse(valid).success, true);

    // 3 digits
    assert.equal(verifyHandoverSchema.safeParse({ ...valid, otp: '481' }).success, false);
    // Non-numeric
    assert.equal(verifyHandoverSchema.safeParse({ ...valid, otp: '481a' }).success, false);
    // Non-uuid agreement ID
    assert.equal(verifyHandoverSchema.safeParse({ ...valid, agreementId: 'agr_001' }).success, false);
  });
});
