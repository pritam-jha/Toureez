/**
 * @file app/(admin)/bookings/[id].tsx
 * @description Admin booking detail with status management.
 */

import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/colors';
import { ModerationToolbar } from '../../../components/admin/ModerationToolbar';
import { ConfirmActionSheet } from '../../../components/dashboard/ConfirmActionSheet';
import { useAdminBooking, useUpdateBookingStatus } from '../../../hooks/admin/useAdminBookings';
import type { AdminBooking } from '../../../types/admin';

type Sheet = AdminBooking['status'] | null;

function LabelRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.labelKey}>{label}</Text>
      <Text style={styles.labelVal}>{value}</Text>
    </View>
  );
}

const STATUS_COLOR: Record<string, string> = {
  pending: Colors.warning,
  confirmed: Colors.secondary,
  completed: Colors.success,
  cancelled: Colors.error,
};

export default function AdminBookingDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookingId = id ?? '';
  const [sheet, setSheet] = useState<Sheet>(null);

  const { data: booking, isLoading, isError } = useAdminBooking(bookingId);
  const updateStatus = useUpdateBookingStatus();

  if (isLoading) return <SafeAreaView style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></SafeAreaView>;
  if (isError || !booking) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>Booking not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}><Text style={styles.retryText}>Go Back</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  const sc = STATUS_COLOR[booking.status] ?? Colors.textLight;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>‹ Back</Text></TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{booking.booking_reference}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.statusBanner, { backgroundColor: `${sc}12`, borderColor: sc }]}>
          <Text style={[styles.statusText, { color: sc }]}>{booking.status.toUpperCase()}</Text>
          <Text style={styles.paymentText}>Payment: {booking.payment_status}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          <LabelRow label="Reference" value={booking.booking_reference} />
          <LabelRow label="Package" value={booking.package?.title ?? '—'} />
          <LabelRow label="Company" value={booking.company?.name ?? '—'} />
          <LabelRow label="Location" value={`${booking.package?.location?.city ?? '—'}, ${booking.package?.location?.state ?? '—'}`} />
          <LabelRow label="Travel Date" value={new Date(booking.travel_date).toLocaleDateString('en-IN')} />
          <LabelRow label="Travelers" value={String(booking.num_travelers)} />
          <LabelRow label="Total" value={`₹${booking.total_amount.toLocaleString('en-IN')}`} />
          <LabelRow label="Advance" value={`₹${booking.advance_amount.toLocaleString('en-IN')}`} />
          <LabelRow label="Balance" value={`₹${booking.balance_amount.toLocaleString('en-IN')}`} />
          {booking.special_requests && <LabelRow label="Requests" value={booking.special_requests} />}
          <LabelRow label="Booked On" value={new Date(booking.created_at).toLocaleDateString('en-IN')} />
        </View>

        {booking.user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer</Text>
            <LabelRow label="Name" value={booking.user.full_name ?? '—'} />
            <LabelRow label="Email" value={booking.user.email} />
          </View>
        )}
      </ScrollView>

      <ModerationToolbar
        actions={[
          { label: 'Confirm', variant: 'success', onPress: () => setSheet('confirmed'), disabled: booking.status === 'confirmed' || booking.status === 'completed' || updateStatus.isPending },
          {
            label: 'Complete',
            variant: 'primary',
            onPress: () => setSheet('completed'),
            // Disable if already completed OR if payment is still pending
            disabled: booking.status === 'completed' || booking.payment_status === 'pending' || updateStatus.isPending,
          },
          { label: 'Cancel', variant: 'danger', onPress: () => setSheet('cancelled'), disabled: booking.status === 'cancelled' || booking.status === 'completed' || updateStatus.isPending },
        ]}
      />

      {(['confirmed', 'completed', 'cancelled'] as Array<AdminBooking['status']>).map((s) => (
        <ConfirmActionSheet
          key={s}
          visible={sheet === s}
          title={`Mark as ${s.charAt(0).toUpperCase() + s.slice(1)}?`}
          description="You can optionally add a note for the audit trail."
          confirmLabel={s.charAt(0).toUpperCase() + s.slice(1)}
          confirmVariant={s === 'cancelled' ? 'danger' : s === 'completed' ? 'primary' : 'success'}
          onConfirm={(note) => {
            setSheet(null);
            updateStatus.mutate(
              { bookingId, status: s, note },
              { onSuccess: () => Alert.alert('Updated', `Booking is now ${s}.`), onError: (e) => Alert.alert('Error', e.message) },
            );
          }}
          onCancel={() => setSheet(null)}
          loading={updateStatus.isPending}
        />
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 60 },
  backText: { color: Colors.primary, fontSize: 16 },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: Colors.text, fontFamily: 'monospace' },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  statusBanner: { borderRadius: 10, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  paymentText: { fontSize: 12, color: Colors.textSecondary },
  section: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  labelRow: { flexDirection: 'row', gap: 8 },
  labelKey: { width: 76, fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  labelVal: { flex: 1, fontSize: 13, color: Colors.text },
  errorText: { color: Colors.textSecondary, fontSize: 15 },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 9 },
  retryText: { color: Colors.textWhite, fontWeight: '600', fontSize: 14 },
});
