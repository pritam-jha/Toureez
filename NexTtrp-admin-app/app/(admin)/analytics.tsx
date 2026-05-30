/**
 * @file app/(admin)/analytics.tsx
 * @description Admin platform analytics — revenue, growth, booking funnel.
 */

import { router } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { FontWeight, Radius, Spacing } from '../../constants/theme';
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { useAdminAnalytics } from '../../hooks/admin/useAdminAnalytics';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatINR(n: number): string {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)}Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n}`;
}

// ── Simple bar (no chart lib needed for admin) ────────────────────────────────

interface SimpleBar {
  label: string;
  value: number;
  max: number;
  color: string;
}

function BarRow({ label, value, max, color }: SimpleBar): React.ReactElement {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <View style={bar.row}>
      <Text style={bar.label}>{label}</Text>
      <View style={bar.track}>
        <View style={[bar.fill, { width: `${pct}%` as unknown as number, backgroundColor: color }]} />
      </View>
      <Text style={bar.value}>{formatINR(value)}</Text>
    </View>
  );
}

const bar = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: 4 },
  label: { width: 36, fontSize: 11, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: Colors.borderLight, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  value: { width: 54, fontSize: 11, color: Colors.textSecondary, textAlign: 'right' },
});

// ── Funnel step ───────────────────────────────────────────────────────────────

function FunnelStep({ label, count, color }: { label: string; count: number; color: string }): React.ReactElement {
  return (
    <View style={funnel.step}>
      <View style={[funnel.dot, { backgroundColor: color }]} />
      <Text style={funnel.label}>{label}</Text>
      <Text style={[funnel.count, { color }]}>{count.toLocaleString('en-IN')}</Text>
    </View>
  );
}

const funnel = StyleSheet.create({
  step: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: FontWeight.medium },
  count: { fontSize: 18, fontWeight: FontWeight.extrabold },
});

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AdminAnalyticsScreen(): React.ReactElement {
  const { data, isLoading, isError, error, refetch, isFetching } = useAdminAnalytics();

  const revenueData = data?.monthly_revenue ?? [];
  const maxRevenue = Math.max(...revenueData.map((m) => m.revenue), 1);
  const funnel = data?.booking_funnel ?? { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };

  // Revenue = confirmed + completed bookings only (last 6 months)
  const windowRevenue = revenueData.reduce((s, m) => s + m.revenue, 0);
  // Bookings = all statuses received in the window (pending, confirmed, completed, cancelled)
  const windowBookings = revenueData.reduce((s, m) => s + m.bookings, 0);
  // Confirmed + completed only (paid bookings)
  const paidBookings = (data?.booking_funnel.confirmed ?? 0) + (data?.booking_funnel.completed ?? 0);

  return (
    <ScreenLayout
      title="Analytics"
      subtitle="Last 6 months"
      onBack={() => router.back()}
      loading={isLoading}
      error={isError ? (error?.message ?? 'Failed to load analytics') : undefined}
      onRetry={() => void refetch()}
      refreshing={isFetching && !isLoading}
      onRefresh={() => void refetch()}
    >
      {/* ── Summary tiles ── */}
      <View style={styles.tileRow}>
        <View style={styles.tile}>
          <Text style={styles.tileLabel}>Revenue (6 mo)</Text>
          <Text style={styles.tileValue}>{formatINR(windowRevenue)}</Text>
        </View>
        <View style={styles.tile}>
          <Text style={styles.tileLabel}>Paid Bookings</Text>
          <Text style={styles.tileValue}>{paidBookings.toLocaleString('en-IN')}</Text>
        </View>
      </View>
      <View style={styles.tileRow}>
        <View style={styles.tile}>
          <Text style={styles.tileLabel}>Total Received (6 mo)</Text>
          <Text style={styles.tileValue}>{windowBookings.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.tile}>
          <Text style={styles.tileLabel}>Cancelled (6 mo)</Text>
          <Text style={[styles.tileValue, { color: Colors.error }]}>
            {(data?.booking_funnel.cancelled ?? 0).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* ── Revenue chart ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Revenue</Text>
        {revenueData.length === 0 ? (
          <Text style={styles.empty}>No data yet</Text>
        ) : (
          revenueData.map((m) => (
            <BarRow
              key={m.month}
              label={m.month.slice(5)}
              value={m.revenue}
              max={maxRevenue}
              color={Colors.primary}
            />
          ))
        )}
      </View>

      {/* ── Booking funnel ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booking Funnel</Text>
        <FunnelStep label="Pending" count={funnel.pending} color={Colors.warning} />
        <FunnelStep label="Confirmed" count={funnel.confirmed} color={Colors.secondary} />
        <FunnelStep label="Completed" count={funnel.completed} color={Colors.success} />
        <FunnelStep label="Cancelled" count={funnel.cancelled} color={Colors.error} />
      </View>

      {/* ── Vendor stats ── */}
      {data?.vendor_stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendor Status</Text>
          <View style={styles.vendorRow}>
            {(
              [
                { label: 'Approved', key: 'approved', color: Colors.success },
                { label: 'Pending', key: 'pending', color: Colors.warning },
                { label: 'Rejected', key: 'rejected', color: Colors.error },
              ] as { label: string; key: keyof typeof data.vendor_stats; color: string }[]
            ).map(({ label, key, color }) => (
              <View key={key} style={[styles.vendorTile, { borderColor: color }]}>
                <Text style={[styles.vendorCount, { color }]}>{data.vendor_stats[key]}</Text>
                <Text style={styles.vendorLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  tileRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  tile: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tileLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  tileValue: { fontSize: 22, fontWeight: FontWeight.extrabold, color: Colors.primary, marginTop: 4 },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  empty: { fontSize: 13, color: Colors.textLight, textAlign: 'center', paddingVertical: 20 },
  vendorRow: { flexDirection: 'row', gap: Spacing.md },
  vendorTile: {
    flex: 1,
    borderRadius: Radius.sm,
    borderWidth: 2,
    padding: Spacing.md,
    alignItems: 'center',
  },
  vendorCount: { fontSize: 22, fontWeight: FontWeight.extrabold },
  vendorLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: FontWeight.semibold, marginTop: 2 },
});
