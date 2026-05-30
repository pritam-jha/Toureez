/**
 * @file app/(vendor)/index.tsx
 * @description Vendor portal dashboard screen.
 *
 * Displays key performance metrics (revenue, bookings, packages, reviews),
 * a grid of metric cards, and the 5 most recent bookings.
 *
 * Redirects to /(vendor)/onboarding if the vendor has not yet created
 * their company profile.
 */

import React, { useCallback } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useVendorDashboard } from '../../hooks/useVendorDashboard';
import { useVendorCompany } from '../../hooks/useVendorCompany';
import { useAuthStore } from '../../store/authStore';
import { DashboardMetricCard, MetricGrid } from '../../components/vendor/DashboardMetricCard';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { InlineLoader } from '../../components/ui/LoadingSpinner';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';
import type { RecentBookingSummary } from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  if (amount >= 10_00_000) return `₹${(amount / 10_00_000).toFixed(1)}L`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'confirmed': return Colors.bookingConfirmed;
    case 'cancelled': return Colors.bookingCancelled;
    case 'completed': return Colors.bookingCompleted;
    default: return Colors.bookingPending;
  }
}

// ── Recent booking row ────────────────────────────────────────────────────────

interface RecentBookingRowProps {
  booking: RecentBookingSummary;
  onPress: () => void;
}

function RecentBookingRow({ booking, onPress }: RecentBookingRowProps): React.ReactElement {
  const statusColor = getStatusColor(booking.status);
  return (
    <Pressable
      style={({ pressed }) => [styles.recentRow, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.recentLeft}>
        <Text style={styles.recentRef}>{booking.booking_reference}</Text>
        <Text style={styles.recentPackage} numberOfLines={1}>{booking.package_title}</Text>
        <Text style={styles.recentMeta}>
          {formatDate(booking.travel_date)} · {booking.num_travelers}{' '}
          {booking.num_travelers === 1 ? 'traveler' : 'travelers'}
        </Text>
      </View>
      <View style={styles.recentRight}>
        <Text style={styles.recentAmount}>{formatCurrency(booking.total_amount)}</Text>
        <View style={[styles.recentStatusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.recentStatus, { color: statusColor }]}>
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </Text>
      </View>
    </Pressable>
  );
}

// ── Quick action button ───────────────────────────────────────────────────────

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  bg?: string;
}

function QuickAction({ icon, label, onPress, color = Colors.primary, bg = Colors.primaryLight }: QuickActionProps): React.ReactElement {
  return (
    <Pressable
      style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={[styles.quickActionIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function DashboardScreen(): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const { data: dashboard, isLoading, isError, refetch, isFetching } = useVendorDashboard();
  const { data: company, isLoading: companyLoading } = useVendorCompany();

  // Redirect to onboarding if company hasn't been set up
  React.useEffect(() => {
    if (!companyLoading && company === null) {
      router.replace('/(vendor)/onboarding');
    }
  }, [company, companyLoading]);

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const firstName = user?.full_name?.split(' ')[0] ?? 'Vendor';

  if (isLoading || companyLoading) {
    return (
      <ScreenWrapper>
        <InlineLoader message="Loading dashboard…" />
      </ScreenWrapper>
    );
  }

  if (isError || dashboard == null) {
    return (
      <ScreenWrapper scrollable onRefresh={handleRefresh} refreshing={isFetching}>
        <View style={styles.errorState}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.textLight} />
          <Text style={styles.errorTitle}>Couldn't load dashboard</Text>
          <Text style={styles.errorBody}>Pull down to refresh or tap below to try again.</Text>
          <Pressable style={styles.retryBtn} onPress={() => void refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scrollable onRefresh={handleRefresh} refreshing={isFetching} disableBottomInset>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.name}>{firstName} 👋</Text>
        </View>
        <Pressable
          style={styles.notificationBtn}
          onPress={() => router.push('/(vendor)/settings')}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          <Ionicons name="settings-outline" size={22} color={Colors.navy} />
        </Pressable>
      </View>

      {/* ── Company badge ───────────────────────────────────────────────── */}
      {company != null && (
        <Pressable
          style={[styles.companyBadge, Shadows.sm]}
          onPress={() => router.push('/(vendor)/company')}
        >
          <View style={styles.companyBadgeLeft}>
            <Ionicons name="briefcase" size={16} color={Colors.primary} />
            <Text style={styles.companyBadgeName} numberOfLines={1}>{company.name}</Text>
          </View>
          <View style={[
            styles.verifiedBadge,
            { backgroundColor: company.is_verified ? Colors.successLight : Colors.warningLight },
          ]}>
            <Text style={[
              styles.verifiedText,
              { color: company.is_verified ? Colors.success : Colors.warning },
            ]}>
              {company.is_verified ? 'Verified' : 'Pending'}
            </Text>
          </View>
        </Pressable>
      )}

      {/* ── Revenue metrics ─────────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Revenue</Text>
      <MetricGrid>
        <DashboardMetricCard
          label="Total Revenue"
          value={formatCurrency(dashboard.total_revenue)}
          icon="cash-outline"
          iconColor={Colors.success}
          iconBg={Colors.successLight}
          subtitle="All time"
        />
        <DashboardMetricCard
          label="This Month"
          value={formatCurrency(dashboard.this_month_revenue)}
          icon="trending-up-outline"
          iconColor={Colors.secondary}
          iconBg={Colors.secondaryLight}
          subtitle={new Date().toLocaleString('default', { month: 'long' })}
        />
      </MetricGrid>

      {/* ── Booking metrics ─────────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Bookings</Text>
      <MetricGrid>
        <DashboardMetricCard
          label="Total Bookings"
          value={dashboard.total_bookings}
          icon="calendar-outline"
          iconColor={Colors.primary}
          iconBg={Colors.primaryLight}
          onPress={() => router.push('/(vendor)/bookings')}
        />
        <DashboardMetricCard
          label="Pending"
          value={dashboard.pending_bookings}
          icon="time-outline"
          iconColor={Colors.warning}
          iconBg={Colors.warningLight}
          subtitle="Awaiting confirmation"
          onPress={() => router.push('/(vendor)/bookings')}
        />
      </MetricGrid>
      <MetricGrid>
        <DashboardMetricCard
          label="Confirmed"
          value={dashboard.confirmed_bookings}
          icon="checkmark-circle-outline"
          iconColor={Colors.success}
          iconBg={Colors.successLight}
        />
        <DashboardMetricCard
          label="Cancelled"
          value={dashboard.cancelled_bookings}
          icon="close-circle-outline"
          iconColor={Colors.error}
          iconBg={Colors.errorLight}
        />
      </MetricGrid>

      {/* ── Package metrics ─────────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Packages</Text>
      <MetricGrid>
        <DashboardMetricCard
          label="Active"
          value={dashboard.active_packages}
          icon="checkmark-done-outline"
          iconColor={Colors.success}
          iconBg={Colors.successLight}
          onPress={() => router.push('/(vendor)/packages')}
        />
        <DashboardMetricCard
          label="Under Review"
          value={dashboard.pending_packages}
          icon="hourglass-outline"
          iconColor={Colors.warning}
          iconBg={Colors.warningLight}
        />
      </MetricGrid>

      {/* ── Reviews & Payouts ───────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Reviews & Payouts</Text>
      <MetricGrid>
        <DashboardMetricCard
          label="Avg Rating"
          value={dashboard.avg_rating > 0 ? `${dashboard.avg_rating.toFixed(1)} ★` : 'N/A'}
          icon="star-outline"
          iconColor={Colors.star}
          iconBg={Colors.accentLight}
          subtitle={`${dashboard.total_reviews} reviews`}
          onPress={() => router.push('/(vendor)/reviews')}
        />
        <DashboardMetricCard
          label="Pending Payouts"
          value={formatCurrency(dashboard.pending_payouts)}
          icon="wallet-outline"
          iconColor={Colors.secondary}
          iconBg={Colors.secondaryLight}
          onPress={() => router.push('/(vendor)/payouts')}
        />
      </MetricGrid>

      {/* ── Quick actions ───────────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <QuickAction
          icon="add-circle-outline"
          label="New Package"
          onPress={() => router.push('/(vendor)/packages/new')}
          color={Colors.primary}
          bg={Colors.primaryLight}
        />
        <QuickAction
          icon="list-outline"
          label="All Bookings"
          onPress={() => router.push('/(vendor)/bookings')}
          color={Colors.secondary}
          bg={Colors.secondaryLight}
        />
        <QuickAction
          icon="business-outline"
          label="My Company"
          onPress={() => router.push('/(vendor)/company')}
          color={Colors.navyLight}
          bg={Colors.borderLight}
        />
        <QuickAction
          icon="star-half-outline"
          label="Reviews"
          onPress={() => router.push('/(vendor)/reviews')}
          color={Colors.star}
          bg={Colors.accentLight}
        />
      </View>

      {/* ── Recent bookings ─────────────────────────────────────────────── */}
      {dashboard.recent_bookings.length > 0 && (
        <>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            <Pressable onPress={() => router.push('/(vendor)/bookings')}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          <View style={[styles.recentCard, Shadows.sm]}>
            {dashboard.recent_bookings.map((booking, index) => (
              <React.Fragment key={booking.id}>
                <RecentBookingRow
                  booking={booking}
                  onPress={() => router.push({ pathname: '/(vendor)/bookings/[id]', params: { id: booking.id } })}
                />
                {index < dashboard.recent_bookings.length - 1 && (
                  <View style={styles.divider} />
                )}
              </React.Fragment>
            ))}
          </View>
        </>
      )}

      {/* Empty state for new vendors */}
      {dashboard.total_bookings === 0 && dashboard.active_packages === 0 && (
        <View style={[styles.welcomeCard, Shadows.card]}>
          <Ionicons name="rocket-outline" size={32} color={Colors.primary} />
          <Text style={styles.welcomeTitle}>Welcome to NEXTTRP Vendor!</Text>
          <Text style={styles.welcomeBody}>
            Create your first travel package and start receiving bookings from thousands of travelers.
          </Text>
          <Pressable
            style={styles.welcomeBtn}
            onPress={() => router.push('/(vendor)/packages/new')}
          >
            <Ionicons name="add" size={18} color={Colors.textWhite} />
            <Text style={styles.welcomeBtnText}>Create First Package</Text>
          </Pressable>
        </View>
      )}
    </ScreenWrapper>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
  },
  headerText: { flex: 1 },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.navy,
    marginTop: 2,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  companyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 20,
  },
  companyBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  companyBadgeName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.navy,
    flex: 1,
  },
  verifiedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 12,
    marginTop: 20,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  quickAction: {
    alignItems: 'center',
    gap: 6,
    width: '22%',
    minWidth: 72,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  recentCard: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  recentLeft: { flex: 1, gap: 2 },
  recentRef: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  recentPackage: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.navy,
  },
  recentMeta: {
    fontSize: 12,
    color: Colors.textLight,
  },
  recentRight: {
    alignItems: 'flex-end',
    gap: 4,
    marginLeft: 12,
  },
  recentAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.navy,
  },
  recentStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  recentStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 16,
  },
  pressed: { opacity: 0.7 },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.navy,
  },
  errorBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  retryBtnText: {
    color: Colors.textWhite,
    fontWeight: '700',
    fontSize: 14,
  },
  welcomeCard: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.navy,
    textAlign: 'center',
  },
  welcomeBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  welcomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  welcomeBtnText: {
    color: Colors.textWhite,
    fontWeight: '700',
    fontSize: 15,
  },
});
