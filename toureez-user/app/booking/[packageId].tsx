/**
 * @file app/booking/[packageId].tsx
 * @description Step 1 of 4 — Traveler Details. Sage green design system.
 * All hooks, validation, stores, and functionality fully preserved.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { BookingProgressBar } from '../../components/booking/BookingProgressBar';
import { TravelerForm } from '../../components/booking/TravelerForm';
import { PriceBreakdown } from '../../components/booking/PriceBreakdown';
import { usePackageDetail } from '../../hooks/usePackage';
import { usePriceCalculation } from '../../hooks/useBooking';
import { useBookingStore } from '../../store/bookingStore';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/colors';
import { formatINR } from '../../utils/currency';
import { useSlideUp } from '../../utils/animations';
import type { PrimaryContact, TravelerDetail } from '../../types';

// ── Constants ─────────────────────────────────────────────────────────────────

const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
const TOMORROW = new Date();
TOMORROW.setDate(TOMORROW.getDate() + 1);
TOMORROW.setHours(0, 0, 0, 0);
const MAX_DATE = new Date();
MAX_DATE.setFullYear(MAX_DATE.getFullYear() + 1);

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

function formatDisplayDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return isoDate; }
}

function buildDefaultTraveler(index: number): TravelerDetail {
  return { name: '', age: 0, gender: 'male', id_type: 'aadhaar', id_number: '', is_primary: index === 0 };
}

interface ContactErrors { full_name?: string; email?: string; phone?: string; city?: string; state?: string; }
interface TravelerErrors { [index: number]: Partial<Record<keyof TravelerDetail, string>>; }

function validateContact(contact: PrimaryContact): ContactErrors {
  const errors: ContactErrors = {};
  if (!contact.full_name.trim() || contact.full_name.trim().length < 2) errors.full_name = 'Full name must be at least 2 characters';
  if (!contact.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) errors.email = 'Enter a valid email address';
  if (!INDIAN_PHONE_REGEX.test(contact.phone.replace(/\s/g, ''))) errors.phone = 'Enter a valid 10-digit Indian mobile number';
  if (!contact.city.trim()) errors.city = 'City is required';
  if (!contact.state.trim()) errors.state = 'State is required';
  return errors;
}

function validateTravelers(travelers: TravelerDetail[]): TravelerErrors {
  const errors: TravelerErrors = {};
  travelers.forEach((t, i) => {
    const tErrors: Partial<Record<keyof TravelerDetail, string>> = {};
    if (!t.name.trim() || t.name.trim().length < 2) tErrors.name = 'Name must be at least 2 characters';
    if (!t.age || t.age < 1 || t.age > 100) tErrors.age = 'Age must be between 1 and 100';
    if (!t.id_number.trim()) tErrors.id_number = 'ID number is required';
    if (Object.keys(tErrors).length > 0) errors[i] = tErrors;
  });
  return errors;
}

// ── Field component ───────────────────────────────────────────────────────────

interface FieldProps { label: string; required?: boolean; error?: string; children: React.ReactNode; }

function Field({ label, required, error, children }: FieldProps): React.ReactElement {
  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>
        {label}{required && <Text style={fieldStyles.required}> *</Text>}
      </Text>
      {children}
      {error ? <Text style={fieldStyles.error}>{error}</Text> : null}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', letterSpacing: 0.4, lineHeight: 16, marginBottom: 6, textTransform: 'uppercase' },
  required: { color: Colors.primary },
  error: { color: Colors.error, fontSize: 12, fontWeight: '600', lineHeight: 16, marginTop: 4 },
});

// ── Calendar date picker ──────────────────────────────────────────────────────
// Uses the native platform calendar (DateTimePickerAndroid on Android,
// inline DateTimePicker modal on iOS) instead of a text input.

interface DatePickerModalProps {
  visible: boolean;
  currentDate: string;
  onConfirm: (date: string) => void;
  onDismiss: () => void;
}

function DatePickerModal({ visible, currentDate, onConfirm, onDismiss }: DatePickerModalProps): React.ReactElement {
  const [selected, setSelected] = useState<Date>(
    currentDate ? new Date(currentDate) : new Date(TOMORROW),
  );

  // Android: show system calendar dialog imperatively
  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;
    DateTimePickerAndroid.open({
      value: selected,
      minimumDate: TOMORROW,
      maximumDate: MAX_DATE,
      mode: 'date',
      onChange: (_event, date) => {
        if (date) {
          setSelected(date);
          onConfirm(toISODate(date));
        } else {
          onDismiss();
        }
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // iOS: show inline picker inside a modal sheet
  if (Platform.OS !== 'ios') return <></>;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={dpStyles.overlay} onPress={onDismiss}>
        <Pressable style={dpStyles.sheet} onPress={() => {}}>
          <View style={dpStyles.sheetHandle} />
          <Text style={dpStyles.sheetTitle}>Select Travel Date</Text>
          <DateTimePicker
            value={selected}
            mode="date"
            display="inline"
            minimumDate={TOMORROW}
            maximumDate={MAX_DATE}
            onChange={(_e, date) => { if (date) setSelected(date); }}
            accentColor={Colors.primary}
          />
          <View style={dpStyles.buttons}>
            <TouchableOpacity style={dpStyles.cancelBtn} onPress={onDismiss}>
              <Text style={dpStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dpStyles.confirmBtn} onPress={() => onConfirm(toISODate(selected))}>
              <Text style={dpStyles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const dpStyles = StyleSheet.create({
  overlay: { backgroundColor: Colors.overlay, flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surfacePrimary ?? '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32, paddingHorizontal: 20, paddingTop: 12 },
  sheetHandle: { alignSelf: 'center', backgroundColor: Colors.surfaceBorder ?? '#e0e0e0', borderRadius: 3, height: 4, marginBottom: 12, width: 40 },
  sheetTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { borderColor: Colors.surfaceBorder ?? '#e0e0e0', borderRadius: 999, borderWidth: 1.5, flex: 1, paddingVertical: 12, alignItems: 'center' },
  cancelText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },
  confirmBtn: { backgroundColor: Colors.primary, borderRadius: 999, flex: 1, paddingVertical: 12, alignItems: 'center' },
  confirmText: { color: Colors.white ?? '#fff', fontSize: 15, fontWeight: '700' },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function TravelerDetailsScreen(): React.ReactElement {
  const params = useLocalSearchParams();
  const rawPackageId = params.packageId;
  const id =
    typeof rawPackageId === 'string'
      ? rawPackageId
      : Array.isArray(rawPackageId)
      ? rawPackageId[0] ?? ''
      : '';
  const { user } = useAuth();
  const slideUp = useSlideUp();
  const setBookingForm = useBookingStore((s) => s.setForm);
  const { data: pkg, isLoading, isError } = usePackageDetail(id);

  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [travelDate, setTravelDate] = useState<string>(toISODate(TOMORROW));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [numTravelers, setNumTravelers] = useState(1);
  const [autoFillPrimary, setAutoFillPrimary] = useState(true);
  const [paymentType] = useState<'full' | 'advance'>('full');
  const [contact, setContact] = useState<PrimaryContact>({
    full_name: user?.full_name ?? '', email: '', phone: user?.phone ?? '',
    city: user?.city ?? '', state: user?.state ?? '', special_requests: '',
  });
  const [travelers, setTravelers] = useState<TravelerDetail[]>([buildDefaultTraveler(0)]);
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});
  const [travelerErrors, setTravelerErrors] = useState<TravelerErrors>({});
  const [dateError, setDateError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const selectedTier = useMemo(
    () => pkg?.pricing.find((t) => t.id === selectedTierId) ?? pkg?.pricing[0] ?? null,
    [pkg, selectedTierId]
  );
  const priceCalc = usePriceCalculation(selectedTier, numTravelers, paymentType);

  useEffect(() => {
    const firstTier = pkg?.pricing[0];
    if (firstTier && !selectedTierId) setSelectedTierId(firstTier.id);
  }, [pkg, selectedTierId]);

  useEffect(() => {
    setTravelers((prev) => {
      if (prev.length === numTravelers) return prev;
      if (prev.length < numTravelers) {
        const additions = Array.from({ length: numTravelers - prev.length }, (_, i) => buildDefaultTraveler(prev.length + i));
        return [...prev, ...additions];
      }
      return prev.slice(0, numTravelers);
    });
  }, [numTravelers]);

  useEffect(() => {
    if (!autoFillPrimary) return;
    setTravelers((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const firstTraveler = updated[0];
      if (!firstTraveler) return updated;
      updated[0] = { ...firstTraveler, name: contact.full_name, is_primary: true };
      return updated;
    });
  }, [autoFillPrimary, contact.full_name]);

  const handleContactChange = useCallback((field: keyof PrimaryContact, value: string) => {
    setContact((prev) => ({ ...prev, [field]: value }));
    setContactErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleTravelerChange = useCallback((index: number, updated: TravelerDetail) => {
    setTravelers((prev) => { const next = [...prev]; next[index] = updated; return next; });
    setTravelerErrors((prev) => { const next = { ...prev }; delete next[index]; return next; });
  }, []);

  const handleContinue = useCallback(() => {
    if (!pkg || !selectedTier || !priceCalc) return;
    const cErrors = validateContact(contact);
    const tErrors = validateTravelers(travelers);
    let hasError = false;
    if (Object.keys(cErrors).length > 0) { setContactErrors(cErrors); hasError = true; }
    if (Object.keys(tErrors).length > 0) { setTravelerErrors(tErrors); hasError = true; }
    if (!travelDate) { setDateError('Please select a travel date'); hasError = true; }
    if (hasError) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      Alert.alert('Missing Information', 'Please fill in all required fields before continuing.', [{ text: 'OK' }]);
      return;
    }
    setBookingForm({ packageId: id, pricingId: selectedTier.id, travelDate, numTravelers, primaryContact: contact, travelers, paymentType, priceCalculation: priceCalc });
    router.push({ pathname: '/booking/summary' as never, params: { packageId: id } });
  }, [pkg, selectedTier, priceCalc, contact, travelers, travelDate, id, numTravelers, paymentType, setBookingForm]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centered}><Text style={styles.loadingText}>Loading package details…</Text></View>
      </SafeAreaView>
    );
  }

  if (isError || !pkg) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={40} color={Colors.textTertiary} />
          <Text style={styles.errorText}>Failed to load package.</Text>
          <Pressable style={styles.retryButton} onPress={() => router.back()} accessibilityRole="button">
            <Text style={styles.retryText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Animated.View style={[styles.flex, slideUp.animatedStyle]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Traveler Details</Text>
          <View style={styles.headerRight} />
        </View>

        <BookingProgressBar currentStep={1} />

        <ScrollView ref={scrollRef} style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Pricing tier selector */}
          {pkg.pricing.length > 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Pricing Tier</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tierRow}>
                {pkg.pricing.map((tier) => {
                  const isSelected = tier.id === (selectedTierId ?? pkg.pricing[0]?.id);
                  return (
                    <TouchableOpacity key={tier.id} style={[styles.tierCard, isSelected && styles.tierCardSelected]} onPress={() => setSelectedTierId(tier.id)} activeOpacity={0.8} accessibilityRole="radio" accessibilityState={{ checked: isSelected }}>
                      <Text style={[styles.tierLabel, isSelected && styles.tierLabelSelected]}>{tier.label}</Text>
                      <Text style={[styles.tierPrice, isSelected && styles.tierPriceSelected]}>{formatINR(tier.discounted_price ?? tier.base_price)}</Text>
                      <Text style={styles.tierPeople}>{tier.min_people}–{tier.max_people} pax</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Primary Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Primary Contact</Text>
            <Field label="Full Name" required error={contactErrors.full_name}>
              <TextInput style={[styles.input, contactErrors.full_name ? styles.inputError : null]} value={contact.full_name} onChangeText={(v: string) => handleContactChange('full_name', v)} placeholder="Your full name" placeholderTextColor={Colors.textTertiary} autoCapitalize="words" autoCorrect={false} returnKeyType="next" accessibilityLabel="Full name" />
            </Field>
            <Field label="Email" required error={contactErrors.email}>
              <TextInput style={[styles.input, contactErrors.email ? styles.inputError : null]} value={contact.email} onChangeText={(v: string) => handleContactChange('email', v)} placeholder="your@email.com" placeholderTextColor={Colors.textTertiary} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} returnKeyType="next" accessibilityLabel="Email address" />
            </Field>
            <Field label="Phone" required error={contactErrors.phone}>
              <TextInput style={[styles.input, contactErrors.phone ? styles.inputError : null]} value={contact.phone} onChangeText={(v: string) => handleContactChange('phone', v.replace(/\D/g, ''))} placeholder="10-digit mobile number" placeholderTextColor={Colors.textTertiary} keyboardType="phone-pad" maxLength={10} returnKeyType="next" accessibilityLabel="Phone number" />
            </Field>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Field label="City" required error={contactErrors.city}>
                  <TextInput style={[styles.input, contactErrors.city ? styles.inputError : null]} value={contact.city} onChangeText={(v: string) => handleContactChange('city', v)} placeholder="Your city" placeholderTextColor={Colors.textTertiary} autoCapitalize="words" returnKeyType="next" accessibilityLabel="City" />
                </Field>
              </View>
              <View style={styles.halfField}>
                <Field label="State" required error={contactErrors.state}>
                  <TextInput style={[styles.input, contactErrors.state ? styles.inputError : null]} value={contact.state} onChangeText={(v: string) => handleContactChange('state', v)} placeholder="Your state" placeholderTextColor={Colors.textTertiary} autoCapitalize="words" returnKeyType="next" accessibilityLabel="State" />
                </Field>
              </View>
            </View>
            <Field label="Special Requests (optional)">
              <TextInput style={[styles.input, styles.textArea]} value={contact.special_requests} onChangeText={(v: string) => handleContactChange('special_requests', v)} placeholder="Any dietary requirements, accessibility needs, etc." placeholderTextColor={Colors.textTertiary} multiline numberOfLines={3} textAlignVertical="top" accessibilityLabel="Special requests" />
            </Field>
          </View>

          {/* Travel Date */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Travel Date</Text>
            <TouchableOpacity style={[styles.dateButton, dateError ? styles.inputError : null]} onPress={() => setShowDatePicker(true)} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Select travel date">
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
              <Text style={styles.dateText}>{formatDisplayDate(travelDate)}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
            {dateError && <Text style={fieldStyles.error}>{dateError}</Text>}
            <DatePickerModal visible={showDatePicker} currentDate={travelDate} onConfirm={(date) => { setTravelDate(date); setDateError(null); setShowDatePicker(false); }} onDismiss={() => setShowDatePicker(false)} />
          </View>

          {/* Traveler Form */}
          <View style={styles.section}>
            <TravelerForm numTravelers={numTravelers} maxGroupSize={pkg.max_group_size} travelers={travelers} autoFillPrimary={autoFillPrimary} primaryContact={contact} onNumTravelersChange={setNumTravelers} onTravelerChange={handleTravelerChange} onAutoFillToggle={setAutoFillPrimary} travelerErrors={travelerErrors} />
          </View>

          {/* Price preview */}
          {priceCalc && (
            <View style={styles.section}>
              <PriceBreakdown calculation={priceCalc} />
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Sticky bottom bar */}
        <View style={styles.stickyBar}>
          <View style={styles.stickyTotal}>
            <Text style={styles.stickyTotalLabel}>Total</Text>
            <Text style={styles.stickyTotalValue}>{priceCalc ? formatINR(priceCalc.total_amount) : '—'}</Text>
          </View>
          <TouchableOpacity style={[styles.continueButton, !priceCalc && styles.continueButtonDisabled]} onPress={handleContinue} disabled={!priceCalc} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Continue to summary">
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      </Animated.View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Colors.background, flex: 1 },
  flex: { flex: 1 },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 32 },
  loadingText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '500', lineHeight: 22 },
  errorText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', lineHeight: 22, marginTop: 12, textAlign: 'center' },
  retryButton: { backgroundColor: Colors.primary, borderRadius: 999, marginTop: 16, paddingHorizontal: 24, paddingVertical: 12 },
  retryText: { color: Colors.white, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  header: { alignItems: 'center', backgroundColor: Colors.surfacePrimary, borderBottomColor: Colors.surfaceBorder, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backButton: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36, borderRadius: 18, backgroundColor: Colors.surfacePrimary },
  headerTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700', lineHeight: 22 },
  headerRight: { width: 36 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16 },
  section: { backgroundColor: Colors.surfacePrimary, borderColor: Colors.surfaceBorder, borderRadius: 16, borderWidth: 1, marginBottom: 16, padding: 16 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', lineHeight: 22, marginBottom: 14 },
  input: { backgroundColor: Colors.surfacePrimary, borderColor: Colors.surfaceBorder, borderRadius: 12, borderWidth: 1.5, color: Colors.textPrimary, fontSize: 15, fontWeight: '500', height: 48, paddingHorizontal: 14 },
  inputError: { borderColor: Colors.error },
  textArea: { height: 88, paddingTop: 12 },
  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  tierRow: { gap: 10, paddingBottom: 4 },
  tierCard: { borderColor: Colors.surfaceBorder, borderRadius: 12, borderWidth: 1.5, minWidth: 120, padding: 12 },
  tierCardSelected: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  tierLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  tierLabelSelected: { color: Colors.primary },
  tierPrice: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', lineHeight: 22, marginTop: 2 },
  tierPriceSelected: { color: Colors.primary },
  tierPeople: { color: Colors.textTertiary, fontSize: 11, fontWeight: '500', lineHeight: 15, marginTop: 2 },
  dateButton: { alignItems: 'center', backgroundColor: Colors.surfacePrimary, borderColor: Colors.surfaceBorder, borderRadius: 12, borderWidth: 1.5, flexDirection: 'row', gap: 10, height: 48, paddingHorizontal: 14 },
  dateText: { color: Colors.textPrimary, flex: 1, fontSize: 15, fontWeight: '500', lineHeight: 20 },
  bottomSpacer: { height: 24 },
  stickyBar: { alignItems: 'center', backgroundColor: Colors.surfacePrimary, borderTopColor: Colors.surfaceBorder, borderTopWidth: 1, flexDirection: 'row', gap: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 16, paddingHorizontal: 16, paddingTop: 12 },
  stickyTotal: { flex: 1 },
  stickyTotalLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', lineHeight: 16 },
  stickyTotalValue: { color: Colors.primary, fontSize: 20, fontWeight: '700', lineHeight: 26 },
  continueButton: { alignItems: 'center', backgroundColor: Colors.primary, borderRadius: 999, flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingVertical: 14 },
  continueButtonDisabled: { backgroundColor: Colors.textTertiary },
  continueButtonText: { color: Colors.white, fontSize: 15, fontWeight: '700', lineHeight: 20 },
});
