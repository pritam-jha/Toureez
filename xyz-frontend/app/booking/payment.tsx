/**
 * @file app/booking/payment.tsx
 * @description Step 3 of 4 — Payment. Sage green design system.
 * All payment methods, mock flow, and Razorpay placeholder preserved.
 */

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { BookingProgressBar } from '../../components/booking/BookingProgressBar';
import { useConfirmMockPayment } from '../../hooks/useBooking';
import { useBookingStore } from '../../store/bookingStore';
import { Colors } from '../../constants/colors';
import { formatINR } from '../../utils/currency';

// ── Types ─────────────────────────────────────────────────────────────────────

type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'emi';

// ── UPI app button ────────────────────────────────────────────────────────────

function UpiAppButton({ name, color, onPress }: { name: string; color: string; onPress: () => void }): React.ReactElement {
  return (
    <TouchableOpacity style={[upiStyles.button, { borderColor: color + '40' }]} onPress={onPress} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={`Pay with ${name}`}>
      <View style={[upiStyles.icon, { backgroundColor: color + '20' }]}>
        <Text style={[upiStyles.iconText, { color }]}>{name.charAt(0)}</Text>
      </View>
      <Text style={upiStyles.name}>{name}</Text>
    </TouchableOpacity>
  );
}

const upiStyles = StyleSheet.create({
  button: { alignItems: 'center', borderRadius: 12, borderWidth: 1.5, flex: 1, gap: 6, paddingVertical: 12 },
  icon: { alignItems: 'center', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  iconText: { fontSize: 18, fontWeight: '700', lineHeight: 24 },
  name: { color: Colors.textPrimary, fontSize: 12, fontWeight: '600', lineHeight: 16 },
});

// ── Payment method option ─────────────────────────────────────────────────────

function PaymentMethodOption({ method, label, subtitle, icon, selected, disabled, onSelect }: {
  method: PaymentMethod; label: string; subtitle?: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  selected: boolean; disabled?: boolean; onSelect: (m: PaymentMethod) => void;
}): React.ReactElement {
  return (
    <TouchableOpacity
      style={[methodStyles.option, selected && methodStyles.optionSelected, disabled && methodStyles.optionDisabled]}
      onPress={() => !disabled && onSelect(method)}
      activeOpacity={disabled ? 1 : 0.8}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={label}
    >
      <View style={[methodStyles.radioOuter, selected && methodStyles.radioOuterSelected]}>
        {selected && <View style={methodStyles.radioInner} />}
      </View>
      <Ionicons name={icon} size={20} color={disabled ? Colors.textTertiary : selected ? Colors.primary : Colors.textSecondary} />
      <View style={methodStyles.textWrap}>
        <Text style={[methodStyles.label, selected && methodStyles.labelSelected, disabled && methodStyles.labelDisabled]}>{label}</Text>
        {subtitle && <Text style={methodStyles.subtitle}>{subtitle}</Text>}
      </View>
      {disabled && (
        <View style={methodStyles.comingSoonBadge}>
          <Text style={methodStyles.comingSoonText}>Coming soon</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const methodStyles = StyleSheet.create({
  option: { alignItems: 'center', borderColor: Colors.surfaceBorder, borderRadius: 12, borderWidth: 1.5, flexDirection: 'row', gap: 12, marginBottom: 10, padding: 14 },
  optionSelected: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  optionDisabled: { opacity: 0.5 },
  radioOuter: { alignItems: 'center', borderColor: Colors.surfaceBorder, borderRadius: 10, borderWidth: 2, height: 20, justifyContent: 'center', width: 20 },
  radioOuterSelected: { borderColor: Colors.primary },
  radioInner: { backgroundColor: Colors.primary, borderRadius: 5, height: 10, width: 10 },
  textWrap: { flex: 1 },
  label: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600', lineHeight: 20 },
  labelSelected: { color: Colors.primary },
  labelDisabled: { color: Colors.textTertiary },
  subtitle: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500', lineHeight: 16, marginTop: 1 },
  comingSoonBadge: { backgroundColor: Colors.warningLight, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  comingSoonText: { color: Colors.warning, fontSize: 11, fontWeight: '700', lineHeight: 14 },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function PaymentScreen(): React.ReactElement {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const id = Array.isArray(bookingId) ? bookingId[0] : (bookingId ?? '');
  const form = useBookingStore((s) => s.form);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');
  const [upiId, setUpiId] = useState('');
  const { mutate: confirmPayment, isPending } = useConfirmMockPayment();

  const amountToPay = form?.paymentType === 'advance'
    ? form.priceCalculation?.advance_amount ?? 0
    : form?.priceCalculation?.total_amount ?? 0;

  const handleMockAppPress = useCallback((appName: string) => {
    Alert.alert('Mock Mode', `${appName} integration is in mock mode. Tap "Pay" to simulate a successful payment.`, [{ text: 'OK' }]);
  }, []);

  const handlePay = useCallback(() => {
    if (!id || !form) {
      Alert.alert('Error', 'Booking information is missing. Please start over.');
      return;
    }
    confirmPayment({ booking_id: id, payment_type: form.paymentType });
  }, [id, form, confirmPayment]);

  if (!form) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.textTertiary} />
          <Text style={styles.errorText}>No booking in progress.</Text>
          <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)')} accessibilityRole="button">
            <Text style={styles.homeBtnText}>Go Home</Text>
          </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Payment</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <BookingProgressBar currentStep={3} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Amount card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>{form.paymentType === 'advance' ? 'Advance Payment (30%)' : 'Total Amount'}</Text>
          <Text style={styles.amountValue}>{formatINR(amountToPay)}</Text>
          <View style={styles.securedRow}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
            <Text style={styles.securedText}>Secured by XYZ</Text>
          </View>
          {form.paymentType === 'advance' && form.priceCalculation && (
            <Text style={styles.balanceNote}>Balance {formatINR(form.priceCalculation.balance_amount)} due before travel</Text>
          )}
        </View>

        {/* Payment method selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          <PaymentMethodOption method="upi" label="UPI" subtitle="Google Pay, PhonePe, Paytm & more" icon="phone-portrait-outline" selected={selectedMethod === 'upi'} onSelect={setSelectedMethod} />
          <PaymentMethodOption method="card" label="Credit / Debit Card" subtitle="Visa, Mastercard, RuPay" icon="card-outline" selected={selectedMethod === 'card'} onSelect={setSelectedMethod} />
          <PaymentMethodOption method="netbanking" label="Net Banking" subtitle="All major Indian banks" icon="business-outline" selected={selectedMethod === 'netbanking'} onSelect={setSelectedMethod} />
          <PaymentMethodOption method="emi" label="EMI" subtitle="No-cost EMI on select cards" icon="calculator-outline" selected={selectedMethod === 'emi'} disabled onSelect={setSelectedMethod} />
        </View>

        {/* UPI section */}
        {selectedMethod === 'upi' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pay via UPI</Text>
            <Text style={styles.fieldLabel}>Enter UPI ID</Text>
            <TextInput style={styles.upiInput} value={upiId} onChangeText={setUpiId} placeholder="yourname@upi" placeholderTextColor={Colors.textTertiary} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} returnKeyType="done" accessibilityLabel="UPI ID input" />
            <View style={styles.orDivider}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>
            <Text style={styles.fieldLabel}>Pay with app</Text>
            <View style={styles.upiAppsRow}>
              <UpiAppButton name="GPay" color="#4285F4" onPress={() => handleMockAppPress('Google Pay')} />
              <UpiAppButton name="PhonePe" color="#5F259F" onPress={() => handleMockAppPress('PhonePe')} />
              <UpiAppButton name="Paytm" color="#00BAF2" onPress={() => handleMockAppPress('Paytm')} />
            </View>
            <View style={styles.mockBanner}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.primary} />
              <Text style={styles.mockBannerText}>Mock mode — no real payment will be processed</Text>
            </View>
          </View>
        )}

        {(selectedMethod === 'card' || selectedMethod === 'netbanking') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{selectedMethod === 'card' ? 'Card Details' : 'Net Banking'}</Text>
            <View style={styles.mockBanner}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.primary} />
              <Text style={styles.mockBannerText}>Mock mode — will be replaced by Razorpay checkout</Text>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Pay button */}
      <View style={styles.stickyBar}>
        <TouchableOpacity style={[styles.payButton, isPending && styles.payButtonLoading]} onPress={handlePay} disabled={isPending} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={`Pay ${formatINR(amountToPay)}`}>
          {isPending ? (
            <View style={styles.payButtonInner}>
              <ActivityIndicator color={Colors.white} size="small" />
              <Text style={styles.payButtonText}>Processing…</Text>
            </View>
          ) : (
            <View style={styles.payButtonInner}>
              <Ionicons name="lock-closed" size={16} color={Colors.white} />
              <Text style={styles.payButtonText}>Pay {formatINR(amountToPay)}</Text>
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
  homeBtn: { backgroundColor: Colors.primary, borderRadius: 999, marginTop: 16, paddingHorizontal: 24, paddingVertical: 12 },
  homeBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700', lineHeight: 20 },
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
  sectionTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', lineHeight: 22, marginBottom: 14 },
  fieldLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', letterSpacing: 0.4, lineHeight: 16, marginBottom: 8, textTransform: 'uppercase' },
  upiInput: { backgroundColor: Colors.surfacePrimary, borderColor: Colors.surfaceBorder, borderRadius: 12, borderWidth: 1.5, color: Colors.textPrimary, fontSize: 15, fontWeight: '500', height: 48, paddingHorizontal: 14 },
  orDivider: { alignItems: 'center', flexDirection: 'row', gap: 10, marginVertical: 14 },
  orLine: { backgroundColor: Colors.surfaceBorder, flex: 1, height: 1 },
  orText: { color: Colors.textTertiary, fontSize: 12, fontWeight: '600', lineHeight: 16 },
  upiAppsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  mockBanner: { alignItems: 'center', backgroundColor: Colors.primaryGlow, borderRadius: 10, flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  mockBannerText: { color: Colors.primary, flex: 1, fontSize: 12, fontWeight: '500', lineHeight: 16 },
  bottomSpacer: { height: 24 },
  stickyBar: { backgroundColor: Colors.surfacePrimary, borderTopColor: Colors.surfaceBorder, borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 24 : 16, paddingHorizontal: 16, paddingTop: 12 },
  payButton: { alignItems: 'center', backgroundColor: Colors.primary, borderRadius: 999, justifyContent: 'center', paddingVertical: 16 },
  payButtonLoading: { backgroundColor: Colors.primaryGlow },
  payButtonInner: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  payButtonText: { color: Colors.white, fontSize: 17, fontWeight: '700', lineHeight: 22 },
});
