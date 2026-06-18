/**
 * @file app/booking/pay-balance/[id].tsx
 * @description Pay the outstanding balance for a confirmed booking.
 * Mirrors app/booking/payment.tsx — same header, amount card, and
 * sticky pay button patterns, adapted for a single Razorpay balance order.
 */

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useAuthStore } from '../../../store/authStore';
import { useBookingDetail } from '../../../hooks/useBookings';
import { createBalanceOrder, verifyBalancePayment } from '../../../lib/api/bookings';
import { Colors } from '../../../constants/colors';
import { formatINR } from '../../../utils/currency';
import type { AuthState } from '../../../types';

const isExpoGo = Constants.appOwnership === 'expo';

function formatDate(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default function PayBalanceScreen(): React.ReactElement {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] ?? '' : params.id ?? '';

  const user = useAuthStore((s: AuthState) => s.user);
  const userEmail = useAuthStore((s: AuthState) => s.session?.user?.email ?? '');
  const bookingQuery = useBookingDetail(id);
  const booking = bookingQuery.data;

  const [isPaying, setIsPaying] = useState(false);

  const handlePay = useCallback(async () => {
    if (!id) return;

    if (isExpoGo) {
      Alert.alert(
        'Development Build Required',
        'Razorpay requires a development build. Balance payments cannot be tested in Expo Go.',
        [{ text: 'OK' }],
      );
      return;
    }

    setIsPaying(true);
    try {
      const orderRes = await createBalanceOrder(id);
      if (orderRes.error || !orderRes.data) {
        Alert.alert('Payment Error', orderRes.error ?? 'Could not initiate balance payment. Please try again.');
        return;
      }

      const { order_id, amount, currency, key_id } = orderRes.data;

      const RazorpayCheckout = (await import('react-native-razorpay')).default;

      const options = {
        description:  'Toureez Balance Payment',
        currency,
        key:          key_id,
        amount:       String(amount),
        order_id,
        name:         'Toureez',
        prefill: {
          email:    userEmail,
          contact:  user?.phone ?? '',
          name:     user?.full_name ?? '',
        },
        theme: { color: Colors.primary },
      };

      const paymentData = await RazorpayCheckout.open(options);

      const verifyRes = await verifyBalancePayment({
        booking_id:          id,
        razorpay_order_id:   paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature:  paymentData.razorpay_signature,
      });

      if (verifyRes.error || !verifyRes.data) {
        Alert.alert('Verification Failed', verifyRes.error ?? 'Payment received but verification failed. Please contact support.');
        return;
      }

      router.replace({ pathname: '/booking/detail/[id]', params: { id } });
      Alert.alert('Payment Successful', "Your balance has been paid. You're all set!");

    } catch (err: unknown) {
      const code = (err as { code?: number })?.code;
      if (code === 0) {
        // User cancelled — silent
        return;
      }
      const msg = (err as { description?: string })?.description ?? 'Payment was not completed. Please try again.';
      Alert.alert('Payment Failed', msg);
    } finally {
      setIsPaying(false);
    }
  }, [id, user, userEmail]);

  if (bookingQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <LoadingSpinner color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (bookingQuery.isError || !booking) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.textTertiary} />
          <Text style={styles.errorText}>Could not load booking details</Text>
          <Button label="Go Back" variant="outline" onPress={() => router.back()} style={styles.goBackBtn} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="lock-closed" size={14} color={Colors.success} />
          <Text style={styles.headerTitle}>Pay Balance</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Amount card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Balance Due</Text>
          <Text style={styles.amountValue}>{formatINR(booking.balance_amount)}</Text>
          <View style={styles.securedRow}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
            <Text style={styles.securedText}>Secured by Toureez</Text>
          </View>
          <Text style={styles.balanceNote}>Total trip cost: {formatINR(booking.total_amount)}</Text>
          <Text style={styles.balanceNote}>Already paid: {formatINR(booking.advance_amount)}</Text>
        </View>

        {/* Package summary card */}
        <View style={styles.section}>
          <Text style={styles.packageTitle}>{booking.package?.title ?? 'Travel package'}</Text>
          <View style={styles.summaryRow}>
            <Ionicons name="calendar-outline" size={15} color={Colors.textSecondary} />
            <Text style={styles.summaryText}>{formatDate(booking.travel_date)}</Text>
          </View>
          {booking.package ? (
            <View style={styles.summaryRow}>
              <Ionicons name="location-outline" size={15} color={Colors.textSecondary} />
              <Text style={styles.summaryText}>
                {booking.package.location.city}, {booking.package.location.state}
              </Text>
            </View>
          ) : null}
          <View style={styles.summaryRow}>
            <Ionicons name="receipt-outline" size={15} color={Colors.textSecondary} />
            <Text style={styles.summaryReference}>{booking.booking_reference}</Text>
          </View>
        </View>

        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={14} color={Colors.primary} />
          <Text style={styles.infoBannerText}>
            Your payment is secured by Razorpay and covered by the Toureez buyer guarantee.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Pay button */}
      <View style={styles.stickyBar}>
        <TouchableOpacity
          style={[styles.payButton, isPaying && styles.payButtonLoading]}
          onPress={() => void handlePay()}
          disabled={isPaying}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Pay ${formatINR(booking.balance_amount)} now`}
        >
          {isPaying ? (
            <View style={styles.payButtonInner}>
              <ActivityIndicator color={Colors.white} size="small" />
              <Text style={styles.payButtonText}>Processing…</Text>
            </View>
          ) : (
            <View style={styles.payButtonInner}>
              <Ionicons name="lock-closed" size={16} color={Colors.white} />
              <Text style={styles.payButtonText}>Pay {formatINR(booking.balance_amount)} Now</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Colors.backgroundBase, flex: 1 },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 32 },
  errorText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', lineHeight: 22, marginTop: 12, textAlign: 'center' },
  goBackBtn: { marginTop: 16, minWidth: 160 },
  header: { alignItems: 'center', backgroundColor: Colors.surfacePrimary, borderBottomColor: Colors.surfaceBorder, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backButton: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36, borderRadius: 18, backgroundColor: Colors.surfacePrimary },
  headerCenter: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  headerTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700', lineHeight: 22 },
  headerRight: { width: 36 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16 },
  amountCard: { alignItems: 'center', backgroundColor: Colors.primaryGlow, borderColor: Colors.primaryGlow, borderRadius: 20, borderWidth: 1, marginBottom: 16, padding: 24 },
  amountLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', letterSpacing: 0.4, lineHeight: 18, textTransform: 'uppercase' },
  amountValue: { color: Colors.textPrimary, fontSize: 36, fontWeight: '700', lineHeight: 44, marginTop: 4 },
  securedRow: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 6 },
  securedText: { color: Colors.success, fontSize: 12, fontWeight: '600', lineHeight: 16 },
  balanceNote: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500', lineHeight: 16, marginTop: 6, textAlign: 'center' },
  section: { backgroundColor: Colors.surfacePrimary, borderColor: Colors.surfaceBorder, borderRadius: 16, borderWidth: 1, marginBottom: 16, padding: 16 },
  packageTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', lineHeight: 22, marginBottom: 10 },
  summaryRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 8 },
  summaryText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500', lineHeight: 18 },
  summaryReference: { color: Colors.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13, fontWeight: '500', lineHeight: 18 },
  infoBanner: { alignItems: 'center', backgroundColor: Colors.primaryGlow, borderRadius: 10, flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 10 },
  infoBannerText: { color: Colors.primary, flex: 1, fontSize: 12, fontWeight: '500', lineHeight: 16 },
  bottomSpacer: { height: 24 },
  stickyBar: { backgroundColor: Colors.surfacePrimary, borderTopColor: Colors.surfaceBorder, borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 24 : 16, paddingHorizontal: 16, paddingTop: 12 },
  payButton: { alignItems: 'center', backgroundColor: Colors.primary, borderRadius: 999, justifyContent: 'center', paddingVertical: 16 },
  payButtonLoading: { backgroundColor: Colors.primaryGlow },
  payButtonInner: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  payButtonText: { color: Colors.white, fontSize: 17, fontWeight: '700', lineHeight: 22 },
});
