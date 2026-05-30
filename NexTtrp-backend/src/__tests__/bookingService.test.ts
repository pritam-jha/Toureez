/**
 * @file __tests__/bookingService.test.ts
 * @description Unit tests for the price calculation logic in bookingService.
 *
 * calculatePrice is the authoritative computation used for all booking amounts.
 * These tests ensure correctness of:
 *  - Standard full payment
 *  - Advance payment (30% of total)
 *  - Group discount (5% off for 7+ travelers)
 *  - GST at 5% applied after group discount
 *  - Discounted price taking precedence over base price
 */

// ── Environment stubs (must come before any module imports) ──────────────────
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';

// ── Module mocks ──────────────────────────────────────────────────────────────

jest.mock('../lib/supabase', () => ({
  supabaseAdmin: { from: jest.fn(), rpc: jest.fn() },
  supabasePublic: { auth: { getUser: jest.fn() } },
}));

jest.mock('../lib/cloudinary', () => ({
  cloudinary: { uploader: { destroy: jest.fn() } },
}));

jest.mock('../services/notificationService', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
  getUserNotifications: jest.fn().mockResolvedValue([]),
  markNotificationAsRead: jest.fn().mockResolvedValue(undefined),
  markAllNotificationsAsRead: jest.fn().mockResolvedValue({ updated_count: 0 }),
  getUnreadCount: jest.fn().mockResolvedValue(0),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { calculatePrice } from '../services/bookingService';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('calculatePrice', () => {
  const BASE_TIER = { base_price: 10_000, discounted_price: null };
  const DISCOUNTED_TIER = { base_price: 10_000, discounted_price: 8_000 };

  // ── Full payment, single traveler ────────────────────────────────────────

  it('computes full payment for 1 traveler at base price', () => {
    const result = calculatePrice(BASE_TIER, 1, 'full');

    expect(result.base_price).toBe(10_000);
    expect(result.num_travelers).toBe(1);
    expect(result.subtotal).toBe(10_000);
    expect(result.group_discount).toBe(0);
    expect(result.gst).toBe(500); // 5% of 10_000
    expect(result.total_amount).toBe(10_500);
    expect(result.advance_amount).toBe(10_500); // full payment = total
    expect(result.balance_amount).toBe(0);
    expect(result.payment_type).toBe('full');
  });

  it('scales linearly for multiple travelers', () => {
    const result = calculatePrice(BASE_TIER, 3, 'full');

    expect(result.subtotal).toBe(30_000);
    expect(result.group_discount).toBe(0);
    expect(result.gst).toBe(1_500);
    expect(result.total_amount).toBe(31_500);
  });

  // ── Advance payment (30%) ────────────────────────────────────────────────

  it('splits total into 30% advance and 70% balance', () => {
    const result = calculatePrice(BASE_TIER, 2, 'advance');

    // subtotal=20000, gst=1000, total=21000
    // advance = round(21000 × 0.30) = 6300
    // balance = 21000 - 6300 = 14700
    expect(result.total_amount).toBe(21_000);
    expect(result.advance_amount).toBe(6_300);
    expect(result.balance_amount).toBe(14_700);
    expect(result.payment_type).toBe('advance');
  });

  it('advance + balance always equals total_amount for various traveler counts', () => {
    for (const n of [1, 2, 3, 7, 10, 15]) {
      const result = calculatePrice(BASE_TIER, n, 'advance');
      expect(result.advance_amount + result.balance_amount).toBe(result.total_amount);
    }
  });

  it('balance is zero for full payment', () => {
    const result = calculatePrice(BASE_TIER, 5, 'full');

    expect(result.balance_amount).toBe(0);
    expect(result.advance_amount).toBe(result.total_amount);
  });

  // ── Group discount ───────────────────────────────────────────────────────

  it('applies 5% group discount at the threshold of 7 travelers', () => {
    const result = calculatePrice(BASE_TIER, 7, 'full');

    const subtotal = 70_000;
    const groupDiscount = Math.round(subtotal * 0.05); // 3_500
    const discountedSubtotal = subtotal - groupDiscount; // 66_500
    const gst = Math.round(discountedSubtotal * 0.05); // 3_325
    const total = discountedSubtotal + gst; // 69_825

    expect(result.subtotal).toBe(subtotal);
    expect(result.group_discount).toBe(groupDiscount);
    expect(result.gst).toBe(gst);
    expect(result.total_amount).toBe(total);
  });

  it('does NOT apply group discount for 6 travelers (below threshold)', () => {
    const result = calculatePrice(BASE_TIER, 6, 'full');

    expect(result.group_discount).toBe(0);
  });

  it('applies group discount for 10 travelers', () => {
    const result = calculatePrice(BASE_TIER, 10, 'full');

    expect(result.group_discount).toBeGreaterThan(0);
    expect(result.num_travelers).toBe(10);
  });

  // ── Discounted price ─────────────────────────────────────────────────────

  it('uses discounted_price over base_price when set', () => {
    const result = calculatePrice(DISCOUNTED_TIER, 1, 'full');

    expect(result.base_price).toBe(8_000); // discounted_price overrides
    expect(result.subtotal).toBe(8_000);
    expect(result.gst).toBe(400);
    expect(result.total_amount).toBe(8_400);
  });

  it('falls back to base_price when discounted_price is null', () => {
    const result = calculatePrice({ base_price: 5_000, discounted_price: null }, 1, 'full');

    expect(result.base_price).toBe(5_000);
    expect(result.total_amount).toBe(5_250); // 5000 + 5% GST
  });

  // ── Edge cases ───────────────────────────────────────────────────────────

  it('clamps num_travelers to 1 minimum for zero/fractional input', () => {
    const r0 = calculatePrice(BASE_TIER, 0, 'full');
    const r04 = calculatePrice(BASE_TIER, 0.4, 'full');

    expect(r0.num_travelers).toBe(1);
    expect(r04.num_travelers).toBe(1);
  });

  it('rounds fractional travelers to nearest integer', () => {
    expect(calculatePrice(BASE_TIER, 2.4, 'full').num_travelers).toBe(2);
    expect(calculatePrice(BASE_TIER, 2.5, 'full').num_travelers).toBe(3);
    expect(calculatePrice(BASE_TIER, 2.6, 'full').num_travelers).toBe(3);
  });
});
