/**
 * @file app/review/success.tsx
 * @description Review submitted success screen.
 *
 * - Animated green checkmark on mount (spring scale + fade)
 * - "Review Submitted!" heading
 * - Verification notice
 * - "View My Bookings" and "Explore More Packages" CTAs
 * - gestureEnabled: false in _layout.tsx prevents back navigation
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors } from '../../constants/colors';

// ── Animated checkmark ────────────────────────────────────────────────────────

function AnimatedCheckmark(): React.ReactElement {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        // Main circle pop
        Animated.spring(scale, {
          toValue: 1,
          tension: 55,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        // Ripple ring
        Animated.sequence([
          Animated.delay(200),
          Animated.parallel([
            Animated.timing(ringScale, {
              toValue: 1.6,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(ringOpacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]),
    ]).start();
  }, [opacity, ringOpacity, ringScale, scale]);

  return (
    <View
      style={checkStyles.wrapper}
      accessibilityRole="image"
      accessibilityLabel="Review submitted successfully"
    >
      {/* Ripple ring */}
      <Animated.View
        style={[
          checkStyles.ring,
          { transform: [{ scale: ringScale }], opacity: ringOpacity },
        ]}
        accessibilityElementsHidden
      />
      {/* Main circle */}
      <Animated.View
        style={[
          checkStyles.circle,
          { transform: [{ scale }], opacity },
        ]}
      >
        <Ionicons name="checkmark" size={52} color={Colors.white} />
      </Animated.View>
    </View>
  );
}

const checkStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    height: 120,
    justifyContent: 'center',
    marginBottom: 28,
    width: 120,
  },
  ring: {
    backgroundColor: Colors.successLight,
    borderRadius: 60,
    height: 120,
    position: 'absolute',
    width: 120,
  },
  circle: {
    alignItems: 'center',
    backgroundColor: Colors.success,
    borderRadius: 56,
    elevation: 10,
    height: 112,
    justifyContent: 'center',
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    width: 112,
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ReviewSuccessScreen(): React.ReactElement {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Hero */}
        <View style={styles.hero}>
          <AnimatedCheckmark />

          <Text style={styles.title}>Review Submitted!</Text>
          <Text style={styles.subtitle}>
            Thank you for sharing your experience
          </Text>

          {/* Verification notice */}
          <View style={styles.noticeCard}>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={Colors.success}
            />
            <Text style={styles.noticeText}>
              Your review will be published after verification
            </Text>
          </View>
        </View>

        {/* CTAs */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace('/(tabs)/bookings' as never)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="View my bookings"
          >
            <Ionicons name="list-outline" size={18} color={Colors.white} />
            <Text style={styles.primaryButtonText}>View My Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace('/(tabs)' as never)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Explore more packages"
          >
            <Ionicons name="compass-outline" size={18} color={Colors.primary} />
            <Text style={styles.secondaryButtonText}>Explore More Packages</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.backgroundBase,
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  hero: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  noticeCard: {
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    borderColor: Colors.success + '40',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  noticeText: {
    color: Colors.success,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  actions: {
    gap: 12,
    paddingBottom: 8,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.surfacePrimary,
    borderColor: Colors.surfaceBorder,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: Platform.OS === 'ios' ? 32 : 24,
  },
});
