/**
 * @file utils/currency.ts
 * @description Indian Rupee formatting utilities.
 *
 * Uses the ECMA-402 Intl.NumberFormat API with the 'en-IN' locale so
 * numbers are formatted with the Indian lakh/crore grouping system
 * (e.g. ₹1,00,000 rather than ₹100,000).
 */

// ── Formatters (created once, reused across calls) ────────────────────────────

/**
 * Full currency formatter — includes the ₹ symbol and paise if non-zero.
 * e.g. 125000 → "₹1,25,000"
 */
const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Compact formatter for large amounts — abbreviates to K/L/Cr.
 * Used in tight UI spaces like cards and badges.
 */
const inrCompactFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Formats a number as Indian Rupees with the ₹ symbol and Indian grouping.
 *
 * @param amount - Amount in INR (integer or float).
 * @returns Formatted string, e.g. "₹1,25,000"
 *
 * @example
 * formatINR(125000)  // "₹1,25,000"
 * formatINR(999)     // "₹999"
 * formatINR(0)       // "₹0"
 */
export function formatINR(amount: number): string {
  if (!Number.isFinite(amount)) return '₹0';
  return inrFormatter.format(Math.round(amount));
}

/**
 * Formats a number as compact Indian Rupees for tight spaces.
 *
 * @param amount - Amount in INR.
 * @returns Compact string, e.g. "₹1.25L" or "₹2.5Cr"
 *
 * @example
 * formatINRCompact(125000)    // "₹1.3L"  (locale-dependent)
 * formatINRCompact(10000000)  // "₹1Cr"
 */
export function formatINRCompact(amount: number): string {
  if (!Number.isFinite(amount)) return '₹0';
  return inrCompactFormatter.format(Math.round(amount));
}

/**
 * Formats a number as a plain Indian-grouped number without the currency symbol.
 * Useful when the ₹ symbol is rendered separately.
 *
 * @param amount - Amount in INR.
 * @returns Plain number string, e.g. "1,25,000"
 */
export function formatINRPlain(amount: number): string {
  if (!Number.isFinite(amount)) return '0';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/**
 * Calculates the discount percentage between base and discounted price.
 *
 * @param basePrice - Original price.
 * @param discountedPrice - Sale price.
 * @returns Integer percentage, e.g. 15 (for 15% off). Returns 0 if invalid.
 */
export function discountPercent(
  basePrice: number,
  discountedPrice: number
): number {
  if (basePrice <= 0 || discountedPrice >= basePrice) return 0;
  return Math.round(((basePrice - discountedPrice) / basePrice) * 100);
}
