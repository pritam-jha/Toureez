/**
 * @file components/BookingTimeline.tsx
 * @description Visual status timeline for a booking (pending → confirmed → completed).
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface Step {
  key: BookingStatus | 'paid';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const STEPS: Step[] = [
  { key: 'pending',   label: 'Booking Placed',  icon: 'document-text-outline' },
  { key: 'paid',      label: 'Payment Done',     icon: 'card-outline' },
  { key: 'confirmed', label: 'Confirmed',        icon: 'checkmark-circle-outline' },
  { key: 'completed', label: 'Trip Completed',   icon: 'airplane-outline' },
];

function getActiveStep(status: BookingStatus, paymentStatus: string): number {
  if (status === 'cancelled') return -1;
  if (status === 'completed') return 4;
  if (status === 'confirmed') return 3;
  if (paymentStatus === 'paid') return 2;
  return 1;
}

interface Props {
  status: BookingStatus;
  paymentStatus: string;
}

export function BookingTimeline({ status, paymentStatus }: Props): React.ReactElement {
  const isCancelled = status === 'cancelled';
  const activeStep = getActiveStep(status, paymentStatus);

  if (isCancelled) {
    return (
      <View style={styles.cancelledRow}>
        <Ionicons name="close-circle" size={18} color={Colors.error} />
        <Text style={styles.cancelledText}>Booking Cancelled</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const done = activeStep >= stepNumber;
        const active = activeStep === stepNumber;

        return (
          <View key={step.key} style={styles.stepRow}>
            <View style={styles.stepLeft}>
              <View style={[styles.circle, done && styles.circleDone, active && styles.circleActive]}>
                <Ionicons
                  name={done ? 'checkmark' : step.icon}
                  size={14}
                  color={done ? '#fff' : Colors.textLight}
                />
              </View>
              {index < STEPS.length - 1 && (
                <View style={[styles.line, done && styles.lineDone]} />
              )}
            </View>
            <Text style={[styles.stepLabel, done && styles.stepLabelDone, active && styles.stepLabelActive]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, minHeight: 48 },
  stepLeft: { alignItems: 'center', width: 28 },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  circleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  line: { width: 2, flex: 1, minHeight: 20, backgroundColor: Colors.border, marginVertical: 2 },
  lineDone: { backgroundColor: Colors.success },
  stepLabel: { fontSize: 13, color: Colors.textLight, paddingTop: 6 },
  stepLabelDone: { color: Colors.textSecondary },
  stepLabelActive: { color: Colors.primary, fontWeight: '700' },
  cancelledRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cancelledText: { fontSize: 14, color: Colors.error, fontWeight: '600' },
});
