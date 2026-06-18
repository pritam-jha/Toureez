/**
 * @file components/ui/Badge.tsx
 * @description Status badge component for package and booking statuses.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import type { PackageStatus, BookingStatus, PaymentStatus } from '../../types';

// ── Package status badge ──────────────────────────────────────────────────────

interface PackageStatusBadgeProps {
  status: PackageStatus;
}

const PACKAGE_STATUS_CONFIG: Record<PackageStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: Colors.statusDraft, bg: Colors.statusDraftBg },
  pending: { label: 'Under Review', color: Colors.statusPending, bg: Colors.statusPendingBg },
  active: { label: 'Active', color: Colors.statusActive, bg: Colors.statusActiveBg },
  rejected: { label: 'Rejected', color: Colors.statusRejected, bg: Colors.statusRejectedBg },
};

export const PackageStatusBadge: React.FC<PackageStatusBadgeProps> = ({ status }) => {
  const config = PACKAGE_STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

// ── Booking status badge ──────────────────────────────────────────────────────

interface BookingStatusBadgeProps {
  status: BookingStatus;
}

const BOOKING_STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: Colors.bookingPending, bg: Colors.warningLight },
  confirmed: { label: 'Confirmed', color: Colors.bookingConfirmed, bg: Colors.successLight },
  cancelled: { label: 'Cancelled', color: Colors.bookingCancelled, bg: Colors.errorLight },
  completed: { label: 'Completed', color: Colors.bookingCompleted, bg: Colors.infoLight },
};

export const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({ status }) => {
  const config = BOOKING_STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

// ── Payment status badge ──────────────────────────────────────────────────────

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Unpaid', color: Colors.bookingPending, bg: Colors.warningLight },
  paid: { label: 'Paid', color: Colors.bookingConfirmed, bg: Colors.successLight },
  refunded: { label: 'Refunded', color: Colors.bookingCompleted, bg: Colors.infoLight },
  failed: { label: 'Failed', color: Colors.bookingCancelled, bg: Colors.errorLight },
};

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status }) => {
  const config = PAYMENT_STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

// ── Generic text badge ────────────────────────────────────────────────────────

interface TextBadgeProps {
  label: string;
  color?: string;
  backgroundColor?: string;
}

export const TextBadge: React.FC<TextBadgeProps> = ({
  label,
  color = Colors.primary,
  backgroundColor = Colors.primaryLight,
}) => (
  <View style={[styles.badge, { backgroundColor }]}>
    <Text style={[styles.label, { color }]}>{label}</Text>
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
