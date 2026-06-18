/**
 * @file components/bookings/BookingTimeline.tsx
 * @description Booking lifecycle timeline with current-step animation.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../constants/colors';
import type { Booking } from '../../types';

type TimelineState = 'done' | 'current' | 'future';

interface TimelineStep {
  key: string;
  label: string;
  date?: string | null;
  state: TimelineState;
}

export interface BookingTimelineProps {
  booking: Booking;
}

function formatTimelineDate(value?: string | null): string {
  if (!value) return 'Pending';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Pending';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function hasPaidEvent(booking: Booking): boolean {
  return (
    booking.payment_status === 'paid' ||
    booking.payment_status === 'refunded' ||
    (booking.payment?.amount_paid ?? 0) > 0
  );
}

function getSteps(booking: Booking): TimelineStep[] {
  const paid = hasPaidEvent(booking);

  if (booking.status === 'cancelled') {
    return [
      {
        key: 'created',
        label: 'Booking Created',
        date: booking.created_at,
        state: 'done',
      },
      {
        key: 'payment',
        label: 'Payment Received',
        date: booking.payment?.paid_at,
        state: paid ? 'done' : 'future',
      },
      {
        key: 'cancelled',
        label: 'Booking Cancelled',
        date: booking.updated_at,
        state: 'current',
      },
    ];
  }

  const confirmed = booking.status === 'confirmed' || booking.status === 'completed';
  const completed = booking.status === 'completed';

  return [
    {
      key: 'created',
      label: 'Booking Created',
      date: booking.created_at,
      state: 'done',
    },
    {
      key: 'payment',
      label: 'Payment Received',
      date: booking.payment?.paid_at,
      state: paid ? 'done' : 'current',
    },
    {
      key: 'confirmed',
      label: 'Trip Confirmed',
      date: confirmed ? booking.updated_at : null,
      state: completed ? 'done' : confirmed ? 'current' : 'future',
    },
    {
      key: 'completed',
      label: 'Trip Completed',
      date: completed ? booking.updated_at : null,
      state: completed ? 'current' : 'future',
    },
  ];
}

function TimelineMarker({ state }: { state: TimelineState }): React.ReactElement {
  const pulse = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (state !== 'current') return undefined;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.25,
          duration: 760,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.7,
          duration: 760,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulse, state]);

  return (
    <View style={styles.markerWrap}>
      {state === 'current' ? (
        <Animated.View
          style={[styles.pulse, { transform: [{ scale: pulse }] }]}
        />
      ) : null}
      <View
        style={[
          styles.marker,
          state === 'done' ? styles.doneMarker : null,
          state === 'current' ? styles.currentMarker : null,
          state === 'future' ? styles.futureMarker : null,
        ]}
      />
    </View>
  );
}

export function BookingTimeline({
  booking,
}: BookingTimelineProps): React.ReactElement {
  const steps = useMemo(() => getSteps(booking), [booking]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Booking Timeline</Text>
      {steps.map((step, index) => (
        <View key={step.key} style={styles.step}>
          <View style={styles.track}>
            <TimelineMarker state={step.state} />
            {index < steps.length - 1 ? (
              <View
                style={[
                  styles.line,
                  step.state === 'done' ? styles.doneLine : null,
                ]}
              />
            ) : null}
          </View>

          <View style={styles.stepContent}>
            <Text
              style={[
                styles.stepLabel,
                step.state === 'future' ? styles.futureLabel : null,
              ]}
            >
              {step.label}
            </Text>
            <Text style={styles.stepDate}>{formatTimelineDate(step.date)}</Text>
          </View>
        </View>
      ))}
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
  title: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
    marginBottom: 14,
  },
  step: {
    flexDirection: 'row',
    minHeight: 58,
  },
  track: {
    alignItems: 'center',
    marginRight: 12,
    width: 24,
  },
  markerWrap: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  marker: {
    borderRadius: 8,
    borderWidth: 2,
    height: 16,
    width: 16,
  },
  doneMarker: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  currentMarker: {
    backgroundColor: Colors.warning,
    borderColor: Colors.warning,
  },
  futureMarker: {
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.textTertiary,
  },
  pulse: {
    backgroundColor: Colors.warningLight,
    borderRadius: 12,
    height: 24,
    position: 'absolute',
    width: 24,
  },
  line: {
    backgroundColor: Colors.surfaceBorder,
    flex: 1,
    marginTop: 3,
    width: 2,
  },
  doneLine: {
    backgroundColor: Colors.success,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 14,
    paddingTop: 1,
  },
  stepLabel: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 20,
  },
  futureLabel: {
    color: Colors.textSecondary,
  },
  stepDate: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 2,
  },
});
