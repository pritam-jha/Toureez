/**
 * @file components/bookings/BookingCard.tsx
 * @description Premium Light 3D booking summary card for the My Bookings list.
 */

import React, { useCallback } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors } from '../../constants/colors';
import { formatINR } from '../../utils/currency';
import type { BookingSummary } from '../../types';
import { BookingStatusBadge } from './BookingStatusBadge';

export interface BookingCardProps {
  booking: BookingSummary;
}

function formatTravelDate(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function BookingCard({
  booking,
}: BookingCardProps): React.ReactElement {
  const handlePress = useCallback(() => {
    router.push({
      pathname: '/booking/detail/[id]' as never,
      params: { id: booking.id },
    });
  }, [booking.id]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
      accessibilityRole="button"
      accessibilityLabel={`Open booking ${booking.booking_reference}`}
    >
      <View style={styles.media}>
        {booking.package.cover_image ? (
          <Image
            source={{ uri: booking.package.cover_image }}
            style={styles.image}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={styles.imageFallback}>
            <Ionicons name="image-outline" size={24} color={Colors.textTertiary} />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.reference} numberOfLines={1}>
          {booking.booking_reference}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {booking.package.title}
        </Text>
        <Text style={styles.company} numberOfLines={1}>
          {booking.company.name}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={12} color={Colors.textTertiary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {formatTravelDate(booking.travel_date)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={12} color={Colors.textTertiary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {booking.num_travelers}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.amount} numberOfLines={1}>
            {formatINR(booking.total_amount)}
          </Text>
          <BookingStatusBadge status={booking.status} />
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={16}
        color={Colors.textTertiary}
        style={styles.chevron}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 12,
    minHeight: 120,
    padding: 14,
    // 3D shadow
    shadowColor: '#0F1535',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 5,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  media: {
    borderRadius: 12,
    height: 76,
    marginRight: 14,
    overflow: 'hidden',
    width: 76,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  imageFallback: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundLayer2,
    borderRadius: 12,
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  reference: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  company: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 8,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 10,
  },
  metaItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  amount: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginRight: 8,
    letterSpacing: -0.3,
  },
  chevron: {
    marginLeft: 6,
  },
});
