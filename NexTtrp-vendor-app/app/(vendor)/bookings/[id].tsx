/**
 * @file app/(vendor)/bookings/[id].tsx
 * @description Booking detail screen.
 *
 * Shows the full booking detail including traveler info, payment summary,
 * and contact details. Vendors can confirm or cancel pending bookings.
 */

import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useVendorBooking, useUpdateBookingStatus } from '../../../hooks/useVendorBookings';
import { Header } from '../../../components/ui/Header';
import { Button } from '../../../components/ui/Button';
import { BookingStatusBadge, PaymentStatusBadge } from '../../../components/ui/Badge';
import { InlineLoader } from '../../../components/ui/LoadingSpinner';
import { Colors } from '../../../constants/colors';
import { Shadows } from '../../../constants/shadows';

// ── Info row helper ───────────────────────────────────────────────────────────

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
}

function InfoRow({ icon, label, value, valueColor }: InfoRowProps): React.ReactElement {
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.iconWrapper}>
        <Ionicons name={icon} size={16} color={Colors.textSecondary} />
      </View>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, valueColor != null && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  iconWrapper: { width: 24, alignItems: 'center' },
  label: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.navy,
    textAlign: 'right',
    flex: 1,
  },
});

// ── Screen ────────────────────────────────────────────────────────────────────

export default function BookingDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: booking, isLoading, refetch, isFetching } = useVendorBooking(id ?? '');
  const updateStatus = useUpdateBookingStatus();
  const [noteText, setNoteText] = useState('');

  const travelDate = booking
    ? new Date(booking.travel_date).toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

  const bookedDate = booking
    ? new Date(booking.created_at).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

  const handleConfirm = (): void => {
    Alert.alert(
      'Confirm Booking',
      'Confirm this booking? The traveler will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            void updateStatus.mutateAsync({
              bookingId: id ?? '',
              status: 'confirmed',
              note: noteText.trim() || undefined,
            }).catch((err) => {
              Alert.alert('Failed', err instanceof Error ? err.message : 'Could not confirm booking.');
            });
          },
        },
      ],
    );
  };

  const handleCancel = (): void => {
    Alert.alert(
      'Cancel Booking',
      'Cancel this booking? This action cannot be undone.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: () => {
            void updateStatus.mutateAsync({
              bookingId: id ?? '',
              status: 'cancelled',
              note: noteText.trim() || undefined,
            }).catch((err) => {
              Alert.alert('Failed', err instanceof Error ? err.message : 'Could not cancel booking.');
            });
          },
        },
      ],
    );
  };

  if (isLoading || booking == null) {
    return (
      <View style={styles.flex}>
        <Header title="Booking Details" showBack />
        <InlineLoader message="Loading booking…" />
      </View>
    );
  }

  const isPending = booking.status === 'pending';

  return (
    <View style={styles.flex}>
      <Header title="Booking Details" showBack />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshing={isFetching}
        onScrollEndDrag={() => void refetch()}
      >
        {/* Status header */}
        <View style={[styles.statusCard, Shadows.card]}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.reference}>{booking.booking_reference}</Text>
              <Text style={styles.packageTitle} numberOfLines={2}>
                {booking.package.title}
              </Text>
            </View>
            <BookingStatusBadge status={booking.status} />
          </View>
          <View style={styles.statusFooter}>
            <Text style={styles.amount}>₹{booking.total_amount.toLocaleString('en-IN')}</Text>
            <PaymentStatusBadge status={booking.payment_status} />
          </View>
        </View>

        {/* Booking info */}
        <View style={[styles.section, Shadows.sm]}>
          <Text style={styles.sectionTitle}>Booking Info</Text>
          <InfoRow icon="calendar-outline" label="Travel Date" value={travelDate} />
          <InfoRow icon="people-outline" label="Travelers" value={`${booking.num_travelers} person${booking.num_travelers > 1 ? 's' : ''}`} />
          <InfoRow icon="time-outline" label="Booked On" value={bookedDate} />
          {booking.special_requests != null && (
            <InfoRow icon="chatbubble-ellipses-outline" label="Special Requests" value={booking.special_requests} />
          )}
        </View>

        {/* Guest info */}
        <View style={[styles.section, Shadows.sm]}>
          <Text style={styles.sectionTitle}>Guest Details</Text>
          <InfoRow icon="person-outline" label="Name" value={booking.user.full_name ?? '—'} />
          <InfoRow icon="mail-outline" label="Email" value={booking.user.email} />
          {booking.user.phone != null && (
            <InfoRow icon="call-outline" label="Phone" value={booking.user.phone} />
          )}
        </View>

        {/* Payment info */}
        <View style={[styles.section, Shadows.sm]}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <InfoRow icon="cash-outline" label="Total Amount" value={`₹${booking.total_amount.toLocaleString('en-IN')}`} />
          <InfoRow icon="checkmark-circle-outline" label="Advance Paid" value={`₹${booking.advance_amount.toLocaleString('en-IN')}`} />
          {booking.balance_amount > 0 && (
            <InfoRow
              icon="alert-circle-outline"
              label="Balance Due"
              value={`₹${booking.balance_amount.toLocaleString('en-IN')}`}
              valueColor={Colors.warning}
            />
          )}
          {booking.payment != null && (
            <>
              {booking.payment.payment_method != null && (
                <InfoRow icon="card-outline" label="Payment Method" value={booking.payment.payment_method} />
              )}
              {booking.payment.paid_at != null && (
                <InfoRow
                  icon="time-outline"
                  label="Paid At"
                  value={new Date(booking.payment.paid_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                />
              )}
            </>
          )}
        </View>

        {/* Traveler details */}
        {booking.traveler_details != null && booking.traveler_details.length > 0 && (
          <View style={[styles.section, Shadows.sm]}>
            <Text style={styles.sectionTitle}>Traveler Details</Text>
            {booking.traveler_details.map((t, index) => (
              <View key={index} style={[styles.travelerCard, index < booking.traveler_details.length - 1 && styles.travelerDivider]}>
                <View style={styles.travelerHeader}>
                  <Text style={styles.travelerName}>
                    {t.name}
                    {t.is_primary ? ' (Primary)' : ''}
                  </Text>
                  <Text style={styles.travelerAge}>{t.age} yrs • {t.gender}</Text>
                </View>
                <Text style={styles.travelerDoc}>
                  {t.id_type.replace(/_/g, ' ')} : {t.id_number}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions for pending bookings */}
        {isPending && (
          <View style={[styles.section, Shadows.sm]}>
            <Text style={styles.sectionTitle}>Add a Note (Optional)</Text>
            <TextInput
              style={styles.noteInput}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="e.g. Confirmation details, pickup point…"
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={3}
            />
            <View style={styles.actionRow}>
              <View style={styles.actionBtn}>
                <Button
                  label="Confirm"
                  onPress={handleConfirm}
                  loading={updateStatus.isPending}
                  fullWidth
                  variant="success"
                />
              </View>
              <View style={styles.actionBtn}>
                <Button
                  label="Cancel"
                  onPress={handleCancel}
                  loading={updateStatus.isPending}
                  fullWidth
                  variant="danger"
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  statusCard: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 14,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  reference: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  packageTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.navy,
    maxWidth: 200,
    lineHeight: 22,
  },
  statusFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  amount: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.navy,
  },
  section: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 8,
  },
  travelerCard: {
    paddingVertical: 10,
    gap: 3,
  },
  travelerDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  travelerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  travelerName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.navy,
  },
  travelerAge: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  travelerDoc: {
    fontSize: 12,
    color: Colors.textLight,
    textTransform: 'capitalize',
  },
  noteInput: {
    backgroundColor: Colors.backgroundSoft,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: { flex: 1 },
});
