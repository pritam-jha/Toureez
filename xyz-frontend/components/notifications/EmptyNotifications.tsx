/**
 * @file components/notifications/EmptyNotifications.tsx
 * @description Empty inbox state for the notifications screen.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';

/**
 * Shows the blank-slate message for users with no notifications yet.
 */
export function EmptyNotifications(): React.ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.illustration}>
        <View style={styles.bellSurface}>
          <Ionicons
            name="notifications-outline"
            size={42}
            color={Colors.primary}
          />
        </View>
        <View style={styles.bellDot} />
      </View>

      <Text style={styles.title}>No notifications yet</Text>
      <Text style={styles.body}>
        We&apos;ll notify you about bookings, price drops, and more
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 360,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  illustration: {
    height: 92,
    justifyContent: 'center',
    marginBottom: 18,
    position: 'relative',
    width: 92,
  },
  bellSurface: {
    alignItems: 'center',
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.surfaceBorder,
    borderRadius: 24,
    borderWidth: 1,
    height: 84,
    justifyContent: 'center',
    width: 84,
  },
  bellDot: {
    backgroundColor: Colors.primary,
    borderColor: Colors.backgroundBase,
    borderRadius: 10,
    borderWidth: 3,
    height: 20,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 20,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 25,
    marginBottom: 7,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  body: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    maxWidth: 300,
    textAlign: 'center',
  },
});
