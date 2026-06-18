/**
 * @file components/bookings/BookingDetailHeader.tsx
 * @description Booking detail app bar with back and share actions.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';

export interface BookingDetailHeaderProps {
  bookingReference: string;
  onBack: () => void;
  onShare: () => void;
}

export function BookingDetailHeader({
  bookingReference,
  onBack,
  onShare,
}: BookingDetailHeaderProps): React.ReactElement {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
      >
        <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
      </Pressable>

      <Text style={styles.title} numberOfLines={1}>
        {bookingReference}
      </Text>

      <Pressable
        onPress={onShare}
        style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
        accessibilityRole="button"
        accessibilityLabel="Share booking"
        hitSlop={8}
      >
        <Ionicons name="share-social-outline" size={20} color={Colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    backgroundColor: Colors.surfacePrimary,
    borderBottomColor: Colors.surfaceBorder,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 60,
    paddingHorizontal: 12,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  pressed: {
    backgroundColor: Colors.backgroundBase,
  },
  title: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 23,
    marginHorizontal: 8,
    textAlign: 'center',
  },
});
