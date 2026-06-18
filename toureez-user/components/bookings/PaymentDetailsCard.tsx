/**
 * @file components/bookings/PaymentDetailsCard.tsx
 * @description Payment summary card for booking detail.
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../ui/Button';
import { Colors } from '../../constants/colors';
import { formatINR } from '../../utils/currency';
import type { Booking } from '../../types';

export interface PaymentDetailsCardProps {
  booking: Booking;
  onDownloadReceipt?: () => void;
}

function displayDate(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function dueDateForTravelDate(travelDate: string): Date {
  const date = new Date(`${travelDate.slice(0, 10)}T12:00:00`);
  date.setDate(date.getDate() - 1);
  return date;
}

function readablePaymentMethod(method: string | null | undefined): string {
  if (!method) return 'Online payment';
  return method
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join(' ');
}

interface PaymentRowProps {
  label: string;
  value: string;
  emphasised?: boolean;
}

function PaymentRow({
  label,
  value,
  emphasised = false,
}: PaymentRowProps): React.ReactElement {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[styles.value, emphasised ? styles.valueEmphasised : null]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

export function PaymentDetailsCard({
  booking,
  onDownloadReceipt,
}: PaymentDetailsCardProps): React.ReactElement {
  const paymentType =
    booking.payment?.payment_type ??
    (booking.balance_amount > 0 ? 'advance' : 'full');
  const amountPaid =
    booking.payment?.amount_paid ??
    (booking.payment_status === 'paid' || booking.payment_status === 'refunded'
      ? booking.advance_amount
      : 0);
  const balanceDue = Math.max(booking.balance_amount, 0);
  const canDownloadReceipt = amountPaid > 0 && onDownloadReceipt !== undefined;

  const rows = useMemo(
    () => [
      {
        label: 'Payment type',
        value: paymentType === 'advance' ? 'Advance' : 'Full',
      },
      {
        label: 'Amount paid',
        value: formatINR(amountPaid),
        emphasised: true,
      },
      ...(balanceDue > 0
        ? [
            {
              label: 'Balance due',
              value: formatINR(balanceDue),
              emphasised: true,
            },
            {
              label: 'Due date',
              value: `Before ${displayDate(dueDateForTravelDate(booking.travel_date))}`,
            },
          ]
        : []),
      {
        label: 'Payment method',
        value: readablePaymentMethod(booking.payment?.payment_method),
      },
    ],
    [
      amountPaid,
      balanceDue,
      booking.payment?.payment_method,
      booking.travel_date,
      paymentType,
    ]
  );

  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.icon}>
          <Ionicons name="wallet-outline" size={18} color={Colors.secondaryDark} />
        </View>
        <Text style={styles.title}>Payment Details</Text>
      </View>

      <View style={styles.rows}>
        {rows.map((row) => (
          <PaymentRow
            key={row.label}
            label={row.label}
            value={row.value}
            emphasised={row.emphasised}
          />
        ))}
      </View>

      <Button
        label="Download Receipt"
        variant="outline"
        onPress={onDownloadReceipt}
        disabled={!canDownloadReceipt}
        leftIcon={
          <Ionicons
            name="download-outline"
            size={17}
            color={canDownloadReceipt ? Colors.primary : Colors.textTertiary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
  headingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 14,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: Colors.secondaryLight,
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    marginRight: 10,
    width: 34,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
  },
  rows: {
    borderColor: Colors.surfaceBorder,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  row: {
    alignItems: 'flex-start',
    borderBottomColor: Colors.surfaceBorder,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  label: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginRight: 10,
  },
  value: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    textAlign: 'right',
  },
  valueEmphasised: {
    fontSize: 14,
    fontWeight: '900',
  },
});
