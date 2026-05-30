/**
 * @file app/booking/confirmation.tsx
 * @description Step 4 of 4 — Booking Confirmed. Sage green design system.
 * Animated checkmark, booking reference, share, and navigation preserved.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { BookingProgressBar } from '../../components/booking/BookingProgressBar';
import { ConfirmationCard } from '../../components/booking/ConfirmationCard';
import { useBookingDetail } from '../../hooks/useBooking';
import { useBookingStore } from '../../store/bookingStore';
import { Colors } from '../../constants/colors';
import { formatINR } from '../../utils/currency';
import { useSlideUp } from '../../utils/animations';

// ── Animated checkmark ────────────────────────────────────────────────────────

function AnimatedCheckmark(): React.ReactElement {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  }, [opacity, scale]);

  return (
    <Animated.View
      style={[checkStyles.container, { transform: [{ scale }], opacity }]}
      accessibilityRole="image"
      accessibilityLabel="Booking confirmed checkmark"
    >
      <View style={checkStyles.circle}>
        <Ionicons name="checkmark" size={48} color={Colors.white} />
      </View>
    </Animated.View>
  );
}

const checkStyles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 20 },
  circle: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 52,
    height: 104,
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    width: 104,
  },
});

// ── What's next ───────────────────────────────────────────────────────────────

function WhatsNext({ email }: { email: string }): React.ReactElement {
  const items = [
    { icon: 'mail-outline' as const, text: `Confirmation email sent to ${email}` },
    { icon: 'call-outline' as const, text: 'Company will contact you within 24 hours' },
    { icon: 'document-text-outline' as const, text: 'Show booking reference at check-in' },
  ];
  return (
    <View style={nextStyles.card}>
      <Text style={nextStyles.title}>What's Next?</Text>
      {items.map((item, i) => (
        <View key={i} style={nextStyles.row}>
          <View style={nextStyles.iconWrap}>
            <Ionicons name={item.icon} size={16} color={Colors.primary} />
          </View>
          <Text style={nextStyles.text}>{item.text}</Text>
        </View>
      ))}
    </View>
  );
}

const nextStyles = StyleSheet.create({
  card: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primaryGlow, borderRadius: 16, borderWidth: 1, padding: 16 },
  title: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', lineHeight: 22, marginBottom: 12 },
  row: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, marginBottom: 10 },
  iconWrap: { alignItems: 'center', backgroundColor: Colors.primaryGlow, borderRadius: 8, height: 32, justifyContent: 'center', width: 32 },
  text: { color: Colors.textPrimary, flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 20 },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ConfirmationScreen(): React.ReactElement {
  const params = useLocalSearchParams();
  const rawBookingId = params.bookingId;
  const id =
    typeof rawBookingId === 'string'
      ? rawBookingId
      : Array.isArray(rawBookingId)
      ? rawBookingId[0] ?? ''
      : '';
  const form = useBookingStore((s) => s.form);
  const clearForm = useBookingStore((s) => s.clearForm);
  const { data: booking, isLoading } = useBookingDetail(id);
  const slideUp = useSlideUp();

  useEffect(() => {
    return () => { clearForm(); };
  }, [clearForm]);

  const handleShare = useCallback(async () => {
    if (!booking) return;
    const travelDate = new Date(booking.travel_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    try {
      await Share.share({
        message: `My trip is confirmed!\n\nBooking Reference: ${booking.booking_reference}\nTravel Date: ${travelDate}\nTravelers: ${booking.num_travelers}\nAmount: ${formatINR(booking.total_amount)}\n\nBooked via NEXTTRP - Travel More, Spend Less`,
        title: 'My NEXTTRP Booking',
      });
    } catch { /* User cancelled */ }
  }, [booking]);

  if (isLoading || !booking) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <AnimatedCheckmark />
          <Text style={styles.loadingText}>Confirming your booking…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const email = form?.primaryContact.email ?? '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <BookingProgressBar currentStep={4} />

      <Animated.View style={[styles.flex, slideUp.animatedStyle]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroSection}>
          <AnimatedCheckmark />
          <Text style={styles.heroTitle}>Booking Confirmed!</Text>
          <Text style={styles.heroSubtitle}>Your trip is all set</Text>
        </View>

        <ConfirmationCard booking={booking} packageTitle="Your Travel Package" />
        <View style={styles.spacer} />
        <WhatsNext email={email} />
        <View style={styles.spacer} />

        {/* Share */}
        <TouchableOpacity style={styles.shareButton} onPress={() => void handleShare()} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Share booking details">
          <Ionicons name="share-social-outline" size={18} color={Colors.primary} />
          <Text style={styles.shareButtonText}>Share Booking Details</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />

        {/* Go home */}
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/(tabs)')} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Go to home">
          <Ionicons name="home-outline" size={18} color={Colors.white} />
          <Text style={styles.primaryButtonText}>Go to Home</Text>
        </TouchableOpacity>

        <View style={styles.smallSpacer} />

        {/* View bookings */}
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/(tabs)')} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="View my bookings">
          <Ionicons name="list-outline" size={18} color={Colors.primary} />
          <Text style={styles.secondaryButtonText}>View My Bookings</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Colors.background, flex: 1 },
  flex: { flex: 1 },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 32 },
  loadingText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '500', lineHeight: 22, marginTop: 12 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16 },
  heroSection: { alignItems: 'center', paddingVertical: 24 },
  heroTitle: { color: Colors.textPrimary, fontSize: 26, fontWeight: '700', lineHeight: 32, textAlign: 'center' },
  heroSubtitle: { color: Colors.textSecondary, fontSize: 15, fontWeight: '500', lineHeight: 22, marginTop: 6, textAlign: 'center' },
  spacer: { height: 16 },
  smallSpacer: { height: 10 },
  shareButton: { alignItems: 'center', borderColor: Colors.primary, borderRadius: 999, borderWidth: 1.5, flexDirection: 'row', gap: 8, justifyContent: 'center', paddingVertical: 14 },
  shareButtonText: { color: Colors.primary, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  primaryButton: { alignItems: 'center', backgroundColor: Colors.primary, borderRadius: 999, flexDirection: 'row', gap: 8, justifyContent: 'center', paddingVertical: 16 },
  primaryButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  secondaryButton: { alignItems: 'center', backgroundColor: Colors.surfacePrimary, borderColor: Colors.surfaceBorder, borderRadius: 999, borderWidth: 1.5, flexDirection: 'row', gap: 8, justifyContent: 'center', paddingVertical: 14 },
  secondaryButtonText: { color: Colors.primary, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  bottomSpacer: { height: Platform.OS === 'ios' ? 32 : 24 },
});
