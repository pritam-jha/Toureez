/**
 * @file components/bookings/CancellationCard.tsx
 * @description Cancellation policy and confirmation sheet for eligible bookings.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import { formatINR } from '../../utils/currency';
import type { Booking } from '../../types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface CancellationCardProps {
  booking: Booking;
  isCancelling: boolean;
  errorMessage?: string | null;
  onCancelBooking: () => void;
}

function travelDay(value: string): Date {
  return new Date(`${value.slice(0, 10)}T12:00:00`);
}

function formatDate(date: Date): string {
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function daysUntilTravel(value: string): number {
  const date = travelDay(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / MS_PER_DAY);
}

function shiftedDate(value: string, days: number): Date {
  const date = travelDay(value);
  date.setDate(date.getDate() + days);
  return date;
}

function refundAmountForBooking(booking: Booking): number {
  const paidAmount =
    booking.payment?.amount_paid ??
    (booking.payment_status === 'paid' ? booking.advance_amount : 0);
  const days = daysUntilTravel(booking.travel_date);
  const fraction = days > 30 ? 1 : days >= 15 ? 0.5 : 0;
  return Math.round(Math.max(paidAmount, 0) * fraction);
}

export function CancellationCard({
  booking,
  isCancelling,
  errorMessage,
  onCancelBooking,
}: CancellationCardProps): React.ReactElement | null {
  const [sheetVisible, setSheetVisible] = useState(false);

  const policy = useMemo(
    () => ({
      freeUntil: shiftedDate(booking.travel_date, -31),
      partialUntil: shiftedDate(booking.travel_date, -15),
      refundAmount: refundAmountForBooking(booking),
    }),
    [booking]
  );

  const showSheet = useCallback(() => {
    setSheetVisible(true);
  }, []);

  const hideSheet = useCallback(() => {
    if (!isCancelling) setSheetVisible(false);
  }, [isCancelling]);

  if (booking.status !== 'confirmed' && booking.status !== 'pending') {
    return null;
  }

  return (
    <>
      <View style={styles.card}>
        <View style={styles.headingRow}>
          <View style={styles.icon}>
            <Ionicons name="close-circle-outline" size={18} color={Colors.error} />
          </View>
          <Text style={styles.title}>Cancellation</Text>
        </View>

        <View style={styles.policy}>
          <Text style={styles.policyLine}>
            Free cancellation until {formatDate(policy.freeUntil)}
          </Text>
          <Text style={styles.policyLine}>
            Partial refund until {formatDate(policy.partialUntil)}
          </Text>
          <Text style={styles.policyLine}>
            No refund after {formatDate(policy.partialUntil)}
          </Text>
        </View>

        <Pressable
          onPress={showSheet}
          style={({ pressed }) => [
            styles.cancelOutlineButton,
            pressed ? styles.buttonPressed : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Cancel booking"
        >
          <Ionicons name="trash-outline" size={17} color={Colors.error} />
          <Text style={styles.cancelOutlineLabel}>Cancel Booking</Text>
        </Pressable>
      </View>

      <Modal
        transparent
        visible={sheetVisible}
        animationType="fade"
        onRequestClose={hideSheet}
        statusBarTranslucent
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={hideSheet} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.warningIcon}>
              <Ionicons name="alert" size={22} color={Colors.warning} />
            </View>
            <Text style={styles.sheetTitle}>Are you sure?</Text>
            <Text style={styles.sheetCopy}>
              This cannot be undone. Your refund is calculated from the travel
              date and amount paid.
            </Text>

            <View style={styles.refundRow}>
              <Text style={styles.refundLabel}>Refund amount</Text>
              <Text style={styles.refundValue}>{formatINR(policy.refundAmount)}</Text>
            </View>

            {errorMessage ? (
              <Text
                style={styles.error}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                {errorMessage}
              </Text>
            ) : null}

            <Pressable
              onPress={onCancelBooking}
              disabled={isCancelling}
              style={({ pressed }) => [
                styles.confirmButton,
                isCancelling ? styles.buttonDisabled : null,
                pressed ? styles.buttonPressed : null,
              ]}
              accessibilityRole="button"
              accessibilityState={{ disabled: isCancelling, busy: isCancelling }}
              accessibilityLabel="Yes cancel booking"
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="close" size={18} color={Colors.white} />
                  <Text style={styles.confirmLabel}>Yes, Cancel Booking</Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={hideSheet}
              disabled={isCancelling}
              style={({ pressed }) => [
                styles.goBackButton,
                pressed ? styles.buttonPressed : null,
              ]}
              accessibilityRole="button"
              accessibilityState={{ disabled: isCancelling }}
              accessibilityLabel="Go back"
            >
              <Text style={styles.goBackLabel}>Go Back</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
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
    backgroundColor: Colors.errorLight,
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
  policy: {
    backgroundColor: Colors.backgroundBase,
    borderColor: Colors.surfaceBorder,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
    padding: 12,
  },
  policyLine: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  cancelOutlineButton: {
    alignItems: 'center',
    borderColor: Colors.error,
    borderRadius: 8,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
  },
  cancelOutlineLabel: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 20,
    marginLeft: 7,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: Colors.overlay,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheet: {
    backgroundColor: Colors.surfacePrimary,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 26,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: Colors.surfaceBorder,
    borderRadius: 3,
    height: 4,
    marginBottom: 18,
    width: 42,
  },
  warningIcon: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: Colors.warningLight,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginBottom: 12,
    width: 48,
  },
  sheetTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    marginBottom: 6,
    textAlign: 'center',
  },
  sheetCopy: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  refundRow: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundBase,
    borderColor: Colors.surfaceBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 14,
  },
  refundLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  refundValue: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 23,
  },
  error: {
    backgroundColor: Colors.errorLight,
    borderRadius: 8,
    color: Colors.error,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 12,
    padding: 10,
  },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: Colors.error,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 50,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  confirmLabel: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
    marginLeft: 6,
  },
  goBackButton: {
    alignItems: 'center',
    borderColor: Colors.surfaceBorder,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  goBackLabel: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.78,
  },
});
