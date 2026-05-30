/**
 * @file components/booking/ConfirmationCard.tsx
 * @description Booking reference card shown on the confirmation screen.
 *
 * Displays the booking reference in large bold text with a copy button.
 * Also shows package title, travel date, traveler count, and amount paid.
 */

import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import { formatINR } from '../../utils/currency';
import type { Booking } from '../../types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConfirmationCardProps {
  booking: Booking;
  packageTitle: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDisplayDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ConfirmationCard({
  booking,
  packageTitle,
}: ConfirmationCardProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void Clipboard.setStringAsync(booking.booking_reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [booking.booking_reference]);

  const amountPaid =
    booking.payment_status === 'paid'
      ? booking.balance_amount === 0
        ? booking.total_amount   // full payment
        : booking.advance_amount // advance payment
      : booking.advance_amount;

  return (
    <View style={styles.card}>
      {/* Booking reference */}
      <View style={styles.referenceSection}>
        <Text style={styles.referenceLabel}>Booking Reference</Text>
        <View style={styles.referenceRow}>
          <Text style={styles.referenceValue} numberOfLines={1}>
            {booking.booking_reference}
          </Text>
          <TouchableOpacity
            style={[styles.copyButton, copied && styles.copyButtonCopied]}
            onPress={handleCopy}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Copy booking reference"
          >
            <Ionicons
              name={copied ? 'checkmark' : 'copy-outline'}
              size={16}
              color={copied ? Colors.success : Colors.primary}
            />
            <Text
              style={[styles.copyText, copied && styles.copyTextCopied]}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Booking details */}
      <View style={styles.detailsGrid}>
        <DetailRow
          icon="briefcase-outline"
          label="Package"
          value={packageTitle}
        />
        <DetailRow
          icon="calendar-outline"
          label="Travel Date"
          value={formatDisplayDate(booking.travel_date)}
        />
        <DetailRow
          icon="people-outline"
          label="Travelers"
          value={`${booking.num_travelers} person${booking.num_travelers > 1 ? 's' : ''}`}
        />
        <DetailRow
          icon="cash-outline"
          label="Amount Paid"
          value={formatINR(amountPaid)}
          valueStyle={styles.amountValue}
        />
        <DetailRow
          icon="card-outline"
          label="Payment Method"
          value="Online Payment"
        />
      </View>
    </View>
  );
}

// ── Detail row sub-component ──────────────────────────────────────────────────

interface DetailRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  valueStyle?: object;
}

function DetailRow({
  icon,
  label,
  value,
  valueStyle,
}: DetailRowProps): React.ReactElement {
  return (
    <View style={detailStyles.row}>
      <Ionicons name={icon} size={16} color={Colors.textSecondary} />
      <View style={detailStyles.textWrap}>
        <Text style={detailStyles.label} numberOfLines={1}>
          {label}
        </Text>
        <Text
          style={[detailStyles.value, valueStyle]}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 6,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    lineHeight: 15,
    textTransform: 'uppercase',
  },
  value: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 1,
  },
});

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 4,
  },
  referenceSection: {
    backgroundColor: Colors.primaryGlow,
    padding: 18,
  },
  referenceLabel: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    lineHeight: 15,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  referenceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  referenceValue: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 22,
    fontFamily: 'monospace',
    fontWeight: '800',
    letterSpacing: 1,
    lineHeight: 28,
  },
  copyButton: {
    alignItems: 'center',
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.primary,
    borderRadius: 10,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  copyButtonCopied: {
    borderColor: Colors.success,
  },
  copyText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  copyTextCopied: {
    color: Colors.success,
  },
  divider: {
    backgroundColor: Colors.surfaceBorder,
    height: 1,
  },
  detailsGrid: {
    padding: 18,
  },
  amountValue: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
});
