/**
 * @file app/booking/summary.tsx
 * @description Step 2 of 4 — Review Booking. Sage green design system.
 * All hooks, stores, cancellation policy, and functionality preserved.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { BookingProgressBar } from '../../components/booking/BookingProgressBar';
import { BookingSummaryCard } from '../../components/booking/BookingSummaryCard';
import { PriceBreakdown } from '../../components/booking/PriceBreakdown';
import { PaymentOptions } from '../../components/booking/PaymentOptions';
import { usePackageDetail } from '../../hooks/usePackage';
import { useCreateBooking, usePriceCalculation } from '../../hooks/useBooking';
import { useBookingStore } from '../../store/bookingStore';
import { Colors } from '../../constants/colors';
import { formatINR } from '../../utils/currency';
import { useSlideUp } from '../../utils/animations';

// ── Helpers ───────────────────────────────────────────────────────────────────

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDisplayDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return isoDate; }
}

// ── Cancellation policy ───────────────────────────────────────────────────────

function CancellationPolicy({ travelDate }: { travelDate: string }): React.ReactElement {
  const freeCancelBefore = addDays(travelDate, -30);
  const halfRefundBefore = addDays(travelDate, -15);
  return (
    <View style={policyStyles.card}>
      <Text style={policyStyles.title}>Cancellation Policy</Text>
      <View style={policyStyles.row}>
        <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
        <Text style={policyStyles.text}><Text style={policyStyles.bold}>Free cancellation</Text> before {freeCancelBefore}</Text>
      </View>
      <View style={policyStyles.row}>
        <Ionicons name="alert-circle" size={16} color={Colors.warning} />
        <Text style={policyStyles.text}><Text style={policyStyles.bold}>50% refund</Text> between {halfRefundBefore} and {freeCancelBefore}</Text>
      </View>
      <View style={policyStyles.row}>
        <Ionicons name="close-circle" size={16} color={Colors.error} />
        <Text style={policyStyles.text}><Text style={policyStyles.bold}>No refund</Text> within 15 days of travel</Text>
      </View>
    </View>
  );
}

const policyStyles = StyleSheet.create({
  card: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primaryGlow, borderRadius: 16, borderWidth: 1, padding: 16 },
  title: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', lineHeight: 22, marginBottom: 12 },
  row: { alignItems: 'flex-start', flexDirection: 'row', gap: 8, marginBottom: 8 },
  text: { color: Colors.textSecondary, flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 20 },
  bold: { color: Colors.textPrimary, fontWeight: '700' },
});

// ── Travelers summary ─────────────────────────────────────────────────────────

function TravelersSummaryCard({ travelDate, numTravelers, travelers }: { travelDate: string; numTravelers: number; travelers: { name: string; age: number; gender: string }[]; }): React.ReactElement {
  return (
    <View style={travelerStyles.card}>
      <Text style={travelerStyles.title}>Travelers Summary</Text>
      <View style={travelerStyles.row}>
        <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
        <View style={travelerStyles.textWrap}>
          <Text style={travelerStyles.label}>Travel Date</Text>
          <Text style={travelerStyles.value}>{formatDisplayDate(travelDate)}</Text>
        </View>
      </View>
      <View style={travelerStyles.row}>
        <Ionicons name="people-outline" size={16} color={Colors.primary} />
        <View style={travelerStyles.textWrap}>
          <Text style={travelerStyles.label}>Total Travelers</Text>
          <Text style={travelerStyles.value}>{numTravelers} person{numTravelers > 1 ? 's' : ''}</Text>
        </View>
      </View>
      <View style={travelerStyles.divider} />
      {travelers.map((t, i) => (
        <View key={i} style={travelerStyles.travelerRow}>
          <View style={travelerStyles.travelerBadge}>
            <Text style={travelerStyles.travelerBadgeText}>{i + 1}</Text>
          </View>
          <Text style={travelerStyles.travelerName} numberOfLines={1}>{t.name || `Traveler ${i + 1}`}</Text>
          <Text style={travelerStyles.travelerMeta} numberOfLines={1}>{t.age > 0 ? `${t.age} yrs` : '—'} · {t.gender.charAt(0).toUpperCase() + t.gender.slice(1)}</Text>
        </View>
      ))}
    </View>
  );
}

const travelerStyles = StyleSheet.create({
  card: { backgroundColor: Colors.surfacePrimary, borderColor: Colors.surfaceBorder, borderRadius: 16, borderWidth: 1, padding: 16 },
  title: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', lineHeight: 22, marginBottom: 12 },
  row: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, marginBottom: 10 },
  textWrap: { flex: 1 },
  label: { color: Colors.textTertiary, fontSize: 11, fontWeight: '600', letterSpacing: 0.4, lineHeight: 15, textTransform: 'uppercase' },
  value: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600', lineHeight: 20, marginTop: 1 },
  divider: { backgroundColor: Colors.surfaceBorder, height: 1, marginBottom: 10, marginTop: 4 },
  travelerRow: { alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 8 },
  travelerBadge: { alignItems: 'center', backgroundColor: Colors.primaryGlow, borderRadius: 12, height: 24, justifyContent: 'center', width: 24 },
  travelerBadgeText: { color: Colors.primary, fontSize: 12, fontWeight: '700', lineHeight: 16 },
  travelerName: { color: Colors.textPrimary, flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  travelerMeta: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500', lineHeight: 18 },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function BookingSummaryScreen(): React.ReactElement {
  const form = useBookingStore((s) => s.form);
  const setForm = useBookingStore((s) => s.setForm);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentType, setPaymentType] = useState<'full' | 'advance'>(form?.paymentType ?? 'full');
  const { data: pkg, isLoading } = usePackageDetail(form?.packageId ?? '');
  const selectedTier = useMemo(() => pkg?.pricing.find((t) => t.id === form?.pricingId) ?? null, [pkg, form?.pricingId]);
  const priceCalc = usePriceCalculation(selectedTier, form?.numTravelers ?? 1, paymentType);
  const { mutate: createBooking, isPending } = useCreateBooking();
  const slideUp = useSlideUp();

  const handlePaymentTypeChange = useCallback((type: 'full' | 'advance') => {
    setPaymentType(type);
    if (form) setForm({ ...form, paymentType: type, priceCalculation: priceCalc });
  }, [form, priceCalc, setForm]);

  const handleProceed = useCallback(() => {
    if (!form || !priceCalc) return;
    if (!termsAccepted) {
      Alert.alert('Terms Required', 'Please accept the Terms & Conditions to proceed.', [{ text: 'OK' }]);
      return;
    }
    setForm({ ...form, paymentType, priceCalculation: priceCalc });
    createBooking({
      package_id: form.packageId, pricing_id: form.pricingId, travel_date: form.travelDate,
      num_travelers: form.numTravelers, special_requests: form.primaryContact.special_requests || undefined,
      traveler_details: form.travelers, payment_type: paymentType,
      primary_contact: { full_name: form.primaryContact.full_name, email: form.primaryContact.email, phone: form.primaryContact.phone, city: form.primaryContact.city, state: form.primaryContact.state },
    });
  }, [form, priceCalc, termsAccepted, paymentType, setForm, createBooking]);

  if (!form) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.textTertiary} />
          <Text style={styles.errorText}>No booking in progress.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)')} accessibilityRole="button">
            <Text style={styles.backBtnText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const amountNow = paymentType === 'full' ? priceCalc?.total_amount ?? 0 : priceCalc?.advance_amount ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Animated.View style={[styles.flex, slideUp.animatedStyle]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Booking</Text>
        <View style={styles.headerRight} />
      </View>

      <BookingProgressBar currentStep={2} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {pkg && !isLoading && <BookingSummaryCard pkg={pkg} travelDate={form.travelDate} numTravelers={form.numTravelers} />}
        <View style={styles.spacer} />
        <TravelersSummaryCard travelDate={form.travelDate} numTravelers={form.numTravelers} travelers={form.travelers} />
        <View style={styles.spacer} />
        {priceCalc && <PriceBreakdown calculation={priceCalc} showPaymentSplit />}
        <View style={styles.spacer} />
        {priceCalc && <PaymentOptions selected={paymentType} calculation={priceCalc} onSelect={handlePaymentTypeChange} />}
        <View style={styles.spacer} />
        <CancellationPolicy travelDate={form.travelDate} />
        <View style={styles.spacer} />

        {/* Terms checkbox */}
        <TouchableOpacity style={styles.termsRow} onPress={() => setTermsAccepted((v) => !v)} activeOpacity={0.8} accessibilityRole="checkbox" accessibilityState={{ checked: termsAccepted }} accessibilityLabel="Accept terms and conditions">
          <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
            {termsAccepted && <Ionicons name="checkmark" size={14} color={Colors.white} />}
          </View>
          <Text style={styles.termsText}>
            I agree to the <Text style={styles.termsLink}>Terms & Conditions</Text> and <Text style={styles.termsLink}>Cancellation Policy</Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={styles.stickyBar}>
        <View style={styles.stickyTotal}>
          <Text style={styles.stickyTotalLabel}>{paymentType === 'advance' ? 'Pay now (30%)' : 'Amount to pay'}</Text>
          <Text style={styles.stickyTotalValue}>{formatINR(amountNow)}</Text>
        </View>
        <TouchableOpacity style={[styles.proceedButton, (!termsAccepted || isPending) && styles.proceedButtonDisabled]} onPress={handleProceed} disabled={!termsAccepted || isPending} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Proceed to payment">
          {isPending ? (
            <Text style={styles.proceedButtonText}>Creating…</Text>
          ) : (
            <>
              <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
      </Animated.View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Colors.background, flex: 1 },
  flex: { flex: 1 },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 32 },
  errorText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', lineHeight: 22, marginTop: 12, textAlign: 'center' },
  backBtn: { backgroundColor: Colors.primary, borderRadius: 999, marginTop: 16, paddingHorizontal: 24, paddingVertical: 12 },
  backBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  header: { alignItems: 'center', backgroundColor: Colors.surfacePrimary, borderBottomColor: Colors.surfaceBorder, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backButton: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36, borderRadius: 18, backgroundColor: Colors.surfacePrimary },
  headerTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700', lineHeight: 22 },
  headerRight: { width: 36 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16 },
  spacer: { height: 12 },
  termsRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, padding: 4 },
  checkbox: { alignItems: 'center', borderColor: Colors.surfaceBorder, borderRadius: 6, borderWidth: 2, height: 22, justifyContent: 'center', marginTop: 1, width: 22 },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  termsText: { color: Colors.textSecondary, flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 20 },
  termsLink: { color: Colors.primary, fontWeight: '700', textDecorationLine: 'underline' },
  bottomSpacer: { height: 24 },
  stickyBar: { alignItems: 'center', backgroundColor: Colors.surfacePrimary, borderTopColor: Colors.surfaceBorder, borderTopWidth: 1, flexDirection: 'row', gap: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 16, paddingHorizontal: 16, paddingTop: 12 },
  stickyTotal: { flex: 1 },
  stickyTotalLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', lineHeight: 16 },
  stickyTotalValue: { color: Colors.primary, fontSize: 20, fontWeight: '700', lineHeight: 26 },
  proceedButton: { alignItems: 'center', backgroundColor: Colors.primary, borderRadius: 999, flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingVertical: 14 },
  proceedButtonDisabled: { backgroundColor: Colors.textTertiary },
  proceedButtonText: { color: Colors.white, fontSize: 15, fontWeight: '700', lineHeight: 20 },
});
