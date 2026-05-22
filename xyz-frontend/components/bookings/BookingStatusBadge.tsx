/**
 * @file components/bookings/BookingStatusBadge.tsx
 * @description Semantic booking status pill shared by list and detail screens.
 */

import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Colors } from '../../constants/colors';
import type { Booking } from '../../types';

type BookingStatus = Booking['status'];

export interface BookingStatusBadgeProps {
  status: BookingStatus;
  size?: 'default' | 'large';
  style?: ViewStyle;
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

export function BookingStatusBadge({
  status,
  size = 'default',
  style,
}: BookingStatusBadgeProps): React.ReactElement {
  return (
    <View
      style={[
        styles.badge,
        styles[`${status}Badge`],
        size === 'large' ? styles.largeBadge : null,
        style,
      ]}
      accessibilityLabel={`Booking status ${STATUS_LABEL[status]}`}
    >
      <View
        style={[
          styles.dot,
          styles[`${status}Dot`],
          size === 'large' ? styles.largeDot : null,
        ]}
      />
      <Text
        style={[
          styles.label,
          styles[`${status}Label`],
          size === 'large' ? styles.largeLabel : null,
        ]}
        numberOfLines={1}
      >
        {STATUS_LABEL[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    flexDirection: 'row',
    minHeight: 24,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  largeBadge: {
    minHeight: 34,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  dot: {
    borderRadius: 4,
    height: 8,
    marginRight: 6,
    width: 8,
  },
  largeDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  largeLabel: {
    fontSize: 14,
    lineHeight: 19,
  },
  confirmedBadge: {
    backgroundColor: Colors.successLight,
  },
  confirmedDot: {
    backgroundColor: Colors.success,
  },
  confirmedLabel: {
    color: Colors.success,
  },
  pendingBadge: {
    backgroundColor: Colors.warningLight,
  },
  pendingDot: {
    backgroundColor: Colors.warning,
  },
  pendingLabel: {
    color: Colors.warning,
  },
  cancelledBadge: {
    backgroundColor: Colors.errorLight,
  },
  cancelledDot: {
    backgroundColor: Colors.error,
  },
  cancelledLabel: {
    color: Colors.error,
  },
  completedBadge: {
    backgroundColor: Colors.infoLight,
  },
  completedDot: {
    backgroundColor: Colors.info,
  },
  completedLabel: {
    color: Colors.info,
  },
});
