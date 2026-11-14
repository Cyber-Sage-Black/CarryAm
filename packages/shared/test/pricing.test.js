const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { calculateDeliveryPricing } = require('../dist/index.js');

describe('CarryAm Delivery Pricing Engine', () => {
  test('calculates correct pricing for standard ₦2,500 bounty with ₦25,000 declared value', () => {
    // ₦2,500 = 250,000 kobo; ₦25,000 = 2,500,000 kobo
    const bountyKobo = 250000;
    const declaredValueKobo = 2500000;

    const result = calculateDeliveryPricing(bountyKobo, declaredValueKobo);

    // Platform commission is 18% of bounty: 250,000 * 0.18 = 45,000 kobo (₦450)
    assert.equal(result.platformFeeKobo, 45000);

    // Excess value: 2,500,000 - 1,000,000 = 1,500,000 kobo
    // Protection fee: 20,000 + 1% of 1,500,000 = 20,000 + 15,000 = 35,000 kobo (₦350)
    assert.equal(result.protectionFeeKobo, 35000);

    // Total sender charge: 250,000 + 45,000 + 35,000 = 330,000 kobo (₦3,300)
    assert.equal(result.totalSenderChargeKobo, 330000);

    // Human-readable Naira amounts
    assert.equal(result.carrierBountyNaira, 2500);
    assert.equal(result.totalSenderChargeNaira, 3300);
  });

  test('calculates zero excess protection fee when declared value is below ₦10,000', () => {
    // ₦1,000 bounty (100,000 kobo), ₦5,000 declared value (500,000 kobo)
    const bountyKobo = 100000;
    const declaredValueKobo = 500000;

    const result = calculateDeliveryPricing(bountyKobo, declaredValueKobo);

    // Base protection fee is 20,000 kobo (₦200) since value <= ₦10,000
    assert.equal(result.protectionFeeKobo, 20000);
    assert.equal(result.platformFeeKobo, 18000);
    assert.equal(result.totalSenderChargeKobo, 138000);
    assert.equal(result.totalSenderChargeNaira, 1380);
  });

  test('maintains mathematical invariant: totalCharge == bounty + platformFee + protectionFee', () => {
    const testCases = [
      { bounty: 100000, value: 0 },
      { bounty: 500000, value: 10000000 },
      { bounty: 1500000, value: 50000000 },
    ];

    for (const tc of testCases) {
      const result = calculateDeliveryPricing(tc.bounty, tc.value);
      assert.equal(
        result.totalSenderChargeKobo,
        result.carrierBountyKobo + result.platformFeeKobo + result.protectionFeeKobo,
      );
    }
  });
});
