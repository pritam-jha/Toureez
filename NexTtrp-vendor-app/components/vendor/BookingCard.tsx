/**
 * @file components/vendor/BookingCard.tsx
 * @description Booking list item card for the vendor bookings screen.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BookingStatusBadge, PaymentStatusBadge } from '../ui/Badge';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';
import type { VendorBookingListItem } from '../../types';

interface BookingCardProps {
  booking: VendorBookingListItem;
  onPress: () => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({ booking, onPress }) => {
  const travelDate = new Date(booking.travel_date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const createdAt = new Date(booking.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, Shadows.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Booking ${booking.booking_reference}`}
    >
      {/* Header row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.reference}>{booking.booking_reference}</Text>
          <Text style={styles.packageTitle} numberOfLines={1}>
            {booking.package.title}
          </Text>
        </View>
        <BookingStatusBadge status={booking.status} />
      </View>

      <View style={styles.divider} />

      {/* Details row */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.detailText}>{travelDate}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.detailText}>{booking.num_travelers} travelers</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.detailText}>Booked {createdAt}</Text>
        </View>
      </View>

      {/* Footer row */}
      <View style={styles.footerRow}>
        <View>
          <Text style={styles.amount}>
            ₹{booking.total_amount.toLocaleString('en-IN')}
          </Text>
          {booking.balance_amount > 0 && (
            <Text style={styles.balance}>
              ₹{booking.balance_amount.toLocaleString('en-IN')} balance due
            </Text>
          )}
        </View>
        <PaymentStatusBadge status={booking.payment_status} />
      </View>

      {/* Guest name */}
      {booking.user.full_name != null && (
        <View style={styles.guestRow}>
          <Ionicons name="person-outline" size={12} color={Colors.textLight} />
          <Text style={styles.guestName}>{booking.user.full_name}</Text>
          {booking.user.phone != null && (
            <Text style={styles.guestPhone}>{booking.user.phone}</Text>
          )}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 12,
  },
  pressed: { opacity: 0.92 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    flex: 1,
  },
  reference: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 2,
  },
  packageTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.navy,
    maxWidth: 200,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.navy,
  },
  balance: {
    fontSize: 11,
    color: Colors.warning,
    marginTop: 1,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  guestName: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  guestPhone: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 6,
  },
});
