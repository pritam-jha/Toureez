/**
 * @file components/booking/PriceBreakdown.tsx
 * @description Itemised price breakdown card.
 *
 * Shows: base price × travelers, group discount (7+ pax), GST (5%), total.
 * Mirrors the backend calculatePrice() function exactly — no phantom discounts.
 *
 * Calculation (authoritative — matches bookingService.ts):
 *   subtotal          = base_price × num_travelers
 *   group_discount    = subtotal × 5%  (only when num_travelers >= 7)
 *   discounted_sub    = subtotal − group_discount
 *   gst               = round(discounted_sub × 5%)
 *   total_amount      = discounted_sub + gst
 *   advance_amount    = round(total × 30%)   [advance only]
 *   balance_amount    = total − advance       [advance only]
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../constants/colors';
import { formatINR } from '../../utils/currency';
import type { PriceCalculation } from '../../types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PriceBreakdownProps {
  calculation: PriceCalculation;
  /** Show the advance/balance split when payment_type is 'advance' */
  showPaymentSplit?: boolean;
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface LineItemProps {
  label: string;
  value: string;
  isDiscount?: boolean;
  isBold?: boolean;
  isTotal?: boolean;
  hint?: string;
}

function LineItem({
  label,
  value,
  isDiscount,
  isBold,
  isTotal,
  hint,
}: LineItemProps): React.ReactElement {
  return (
    <View style={[lineStyles.row, isTotal && lineStyles.totalRow]}>
      <View style={lineStyles.labelWrap}>
        <Text
          style={[
            lineStyles.label,
            isBold && lineStyles.labelBold,
            isTotal && lineStyles.labelTotal,
            isDiscount && lineStyles.labelDiscount,
          ]}
          numberOfLines={2}
        >
          {label}
        </Text>
        {hint ? (
          <Text style={lineStyles.hint} numberOfLines={1}>
            {hint}
          </Text>
        ) : null}
      </View>
      <Text
        style={[
          lineStyles.value,
          isBold && lineStyles.valueBold,
          isTotal && lineStyles.valueTotal,
          isDiscount && lineStyles.valueDiscount,
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const lineStyles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  totalRow: {
    borderTopColor: Colors.surfaceBorder,
    borderTopWidth: 1,
    marginTop: 4,
    paddingTop: 12,
  },
  labelWrap: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  labelBold: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  labelTotal: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  labelDiscount: {
    color: Colors.success,
  },
  hint: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    marginTop: 1,
  },
  value: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'right',
  },
  valueBold: {
    color: Colors.textPrimary,
  },
  valueTotal: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  valueDiscount: {
    color: Colors.success,
  },
});

// ── Main component ────────────────────────────────────────────────────────────

export function PriceBreakdown({
  calculation,
  showPaymentSplit = false,
}: PriceBreakdownProps): React.ReactElement {
  const {
    base_price,
    num_travelers,
    subtotal,
    group_discount,
    gst,
    total_amount,
    advance_amount,
    balance_amount,
    payment_type,
  } = calculation;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Price Breakdown</Text>

      {/* Base price × travelers */}
      <LineItem
        label={`Base price × ${num_travelers} traveler${num_travelers > 1 ? 's' : ''}`}
        value={formatINR(subtotal)}
        hint={`${formatINR(base_price)} per person`}
      />

      {/* Group discount — only shown when applied (7+ travelers) */}
      {group_discount > 0 ? (
        <LineItem
          label="Group discount (5%)"
          value={`− ${formatINR(group_discount)}`}
          isDiscount
          hint="Applied for 7+ travelers"
        />
      ) : null}

      {/* GST — applied on subtotal after group discount */}
      <LineItem
        label="GST (5%)"
        value={formatINR(gst)}
        hint="As per Indian travel package regulations"
      />

      {/* Divider + Total */}
      <LineItem
        label="Total Amount"
        value={formatINR(total_amount)}
        isTotal
        isBold
      />

      {/* Advance/balance split — only shown for advance payment */}
      {showPaymentSplit && payment_type === 'advance' ? (
        <View style={styles.splitContainer}>
          <View style={styles.splitRow}>
            <View style={styles.splitDot} />
            <Text style={styles.splitLabel}>Pay now (30%)</Text>
            <Text style={styles.splitValue}>{formatINR(advance_amount)}</Text>
          </View>
          <View style={styles.splitRow}>
            <View style={[styles.splitDot, styles.splitDotBalance]} />
            <Text style={styles.splitLabel}>Pay before travel (70%)</Text>
            <Text style={styles.splitValue}>{formatINR(balance_amount)}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  splitContainer: {
    backgroundColor: Colors.backgroundLayer2,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
    padding: 12,
  },
  splitRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  splitDot: {
    backgroundColor: Colors.primary,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  splitDotBalance: {
    backgroundColor: Colors.textTertiary,
  },
  splitLabel: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  splitValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
});
