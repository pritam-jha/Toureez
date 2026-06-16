/**
 * @file app/(vendor)/index.tsx
 * Vendor Dashboard — Luxury dark-mode SaaS redesign.
 * Airbnb Host + Stripe + Linear inspired premium UI.
 */

import React, { useCallback, useMemo } from 'react';
import {
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useVendorDashboard } from '../../hooks/useVendorDashboard';
import { useVendorCompany } from '../../hooks/useVendorCompany';
import { useUnreadNotificationCount } from '../../hooks/useVendorNotifications';
import { useAuthStore } from '../../store/authStore';
import type { RecentBookingSummary } from '../../types';

const { width: SW } = Dimensions.get('window');
const H_PAD = 16;
const GAP = 12;
const CARD_W = (SW - H_PAD * 2 - GAP) / 2;

const INR = '₹';

// ── Design tokens ─────────────────────────────────────────────────────────────

const D = {
  bg:          '#0B1426',
  card:        '#111827',
  cardBorder:  '#1E2D40',
  cardHigh:    '#1A2535',
  primary:     '#E8631A',
  primaryDim:  'rgba(232,99,26,0.12)',
  primaryGlow: 'rgba(232,99,26,0.20)',
  success:     '#10B981',
  successDim:  'rgba(16,185,129,0.12)',
  info:        '#3B82F6',
  infoDim:     'rgba(59,130,246,0.12)',
  purple:      '#8B5CF6',
  purpleDim:   'rgba(139,92,246,0.12)',
  warning:     '#F59E0B',
  warningDim:  'rgba(245,158,11,0.12)',
  danger:      '#EF4444',
  dangerDim:   'rgba(239,68,68,0.12)',
  text:        '#FFFFFF',
  textSec:     '#94A3B8',
  textMuted:   '#475569',
  divider:     '#1E2D40',
  star:        '#F59E0B',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_00_00_000) return `${INR}${(n / 1_00_00_000).toFixed(1)}Cr`;
  if (n >= 1_00_000)    return `${INR}${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000)       return `${INR}${(n / 1_000).toFixed(1)}K`;
  return `${INR}${n.toLocaleString('en-IN')}`;
}

function greet(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning,';
  if (h < 17) return 'Good Afternoon,';
  return 'Good Evening,';
}

function dateStr(): string {
  return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusColor(s: string): string {
  if (s === 'confirmed') return D.success;
  if (s === 'cancelled') return D.danger;
  if (s === 'completed') return D.purple;
  return D.warning;
}

function statusLabel(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  onPress?: () => void;
}

function StatCard({ icon, iconBg, iconColor, label, value, onPress }: StatCardProps): React.ReactElement {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.82} style={[styles.statCard, { width: CARD_W }]}>
      <View style={styles.statTop}>
        <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
      </View>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Quick action row ──────────────────────────────────────────────────────────

function QAction({ icon, label, sub, bg, color, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string; sub: string; bg: string; color: string; onPress: () => void;
}): React.ReactElement {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.qaRow}>
      <View style={[styles.qaIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.qaLabel}>{label}</Text>
        <Text style={styles.qaSub}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={D.textMuted} />
    </TouchableOpacity>
  );
}

// ── Recent booking row ────────────────────────────────────────────────────────

function BookingRow({ booking }: { booking: RecentBookingSummary }): React.ReactElement {
  const sc = statusColor(booking.status);
  return (
    <TouchableOpacity
      style={styles.bRow}
      onPress={() => router.push({ pathname: '/(vendor)/bookings/[id]', params: { id: booking.id } })}
      activeOpacity={0.8}
    >
      <View style={[styles.bThumb, { backgroundColor: D.cardBorder }]}>
        <Ionicons name="briefcase-outline" size={18} color={D.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.bTitle} numberOfLines={1}>{booking.package_title}</Text>
        <Text style={styles.bMeta}>{booking.num_travelers} Travelers</Text>
        <View style={styles.bDateRow}>
          <Ionicons name="calendar-outline" size={11} color={D.textMuted} />
          <Text style={styles.bDate}>{new Date(booking.travel_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Text style={styles.bAmount}>{fmt(booking.total_amount)}</Text>
        <View style={[styles.bBadge, { backgroundColor: sc + '22' }]}>
          <Text style={[styles.bBadgeTxt, { color: sc }]}>{statusLabel(booking.status)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function DashboardScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { data: dashboard, isLoading, isError, refetch, isFetching } = useVendorDashboard();
  const { data: company, isLoading: companyLoading } = useVendorCompany();
  const unread = useUnreadNotificationCount();

  React.useEffect(() => {
    if (!companyLoading && company === null) {
      router.replace('/(vendor)/onboarding');
    }
  }, [company, companyLoading]);

  const onRefresh = useCallback(() => { void refetch(); }, [refetch]);

  const companyName = company?.name ?? 'Your Company';
  const greeting = useMemo(greet, []);

  const avgRating = dashboard?.avg_rating ?? 0;
  const totalRevenue = dashboard?.total_revenue ?? 0;
  const thisMonthRevenue = dashboard?.this_month_revenue ?? 0;
  const totalBookings = dashboard?.total_bookings ?? 0;
  const activePackages = dashboard?.active_packages ?? 0;
  const recentBookings = dashboard?.recent_bookings ?? [];

  return (
    <ScrollView
      style={[styles.scroll, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isFetching && !isLoading} onRefresh={onRefresh} tintColor={D.primary} colors={[D.primary]} />
      }
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Ionicons name="airplane" size={14} color={D.primary} />
          </View>
          <View>
            <Text style={styles.logoText}>NEXTTRP</Text>
            <Text style={styles.logoSub}>VENDOR</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.hBtn} onPress={() => router.push({ pathname: '/(vendor)/notifications', params: { from: 'dashboard' } })} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={18} color={D.textSec} />
            {unread > 0 && <View style={styles.notifDot}><Text style={styles.notifDotTxt}>{unread > 9 ? '9+' : String(unread)}</Text></View>}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.companyBtn}
            onPress={() => router.push({ pathname: '/(vendor)/company', params: { from: 'dashboard' } })}
            activeOpacity={0.8}
          >
            <View style={styles.companyAvatar}>
              <Text style={styles.companyAvatarTxt}>{companyName.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.companyBtnTxt} numberOfLines={1}>{companyName}</Text>
            <Ionicons name="chevron-down" size={13} color={D.textSec} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Hero / welcome ─────────────────────────────────────── */}
      <View style={styles.hero}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroGreeting}>{greeting}</Text>
          <Text style={styles.heroName}>{companyName} 👋</Text>
          <Text style={styles.heroSub}>Manage your packages, bookings and earnings.</Text>
        </View>
        <TouchableOpacity style={styles.datePill} onPress={() => router.push({ pathname: '/(vendor)/analytics', params: { from: 'dashboard' } })} activeOpacity={0.8}>
          <Ionicons name="calendar-outline" size={12} color={D.textSec} />
          <Text style={styles.dateTxt}>{dateStr()}</Text>
        </TouchableOpacity>
      </View>

      {/* ── 4 Stat cards (2×2) ────────────────────────────────── */}
      <View style={styles.statGrid}>
        <StatCard
          icon="cube-outline"
          iconBg={D.primaryDim}
          iconColor={D.primary}
          label="Active Packages"
          value={String(activePackages)}
          onPress={() => router.push('/(vendor)/packages')}
        />
        <StatCard
          icon="calendar"
          iconBg={D.infoDim}
          iconColor={D.info}
          label="Bookings This Month"
          value={String(totalBookings)}
          onPress={() => router.push({ pathname: '/(vendor)/bookings', params: { from: 'dashboard' } })}
        />
        <StatCard
          icon="cash-outline"
          iconBg={D.successDim}
          iconColor={D.success}
          label="Earnings"
          value={fmt(totalRevenue)}
          onPress={() => router.push({ pathname: '/(vendor)/analytics', params: { from: 'dashboard' } })}
        />
        <StatCard
          icon="star"
          iconBg={D.purpleDim}
          iconColor={D.purple}
          label="Average Rating"
          value={avgRating > 0 ? `${avgRating.toFixed(1)}/5` : 'N/A'}
          onPress={() => router.push({ pathname: '/(vendor)/reviews', params: { from: 'dashboard' } })}
        />
      </View>

      {/* ── Earnings overview ──────────────────────────────────── */}
      <View style={styles.earnCard}>
        <View style={styles.earnHeader}>
          <View>
            <Text style={styles.secTitle}>Earnings Overview</Text>
            <Text style={styles.earnTotal}>Total Earnings</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <Text style={styles.earnAmount}>{fmt(totalRevenue)}</Text>
            </View>
          </View>
          <View style={styles.periodPill}>
            <Text style={styles.periodTxt}>This Month</Text>
            <Ionicons name="chevron-down" size={12} color={D.textSec} />
          </View>
        </View>
      </View>

      {/* ── Quick actions ──────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.secTitle}>Quick Actions</Text>
        <View style={styles.qaCard}>
          <QAction
            icon="add-circle"
            label="Add New Package"
            sub="Create a new travel package"
            bg={D.primaryDim}
            color={D.primary}
            onPress={() => router.push({ pathname: '/(vendor)/packages/new', params: { from: 'dashboard' } })}
          />
          <View style={styles.qaDivider} />
          <QAction
            icon="images-outline"
            label="Upload Images"
            sub="Add photos to your packages"
            bg={D.infoDim}
            color={D.info}
            onPress={() => router.push('/(vendor)/packages')}
          />
          <View style={styles.qaDivider} />
          <QAction
            icon="megaphone-outline"
            label="Promote Package"
            sub="Increase visibility & bookings"
            bg={D.purpleDim}
            color={D.purple}
            onPress={() => router.push('/(vendor)/packages')}
          />
          <View style={styles.qaDivider} />
          <QAction
            icon="chatbubble-outline"
            label="Customer Inquiries"
            sub="Respond to customer queries"
            bg={D.successDim}
            color={D.success}
            onPress={() => router.push({ pathname: '/(vendor)/bookings', params: { from: 'dashboard' } })}
          />
        </View>
      </View>

      {/* ── Recent bookings ────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.secRow}>
          <Text style={styles.secTitle}>Recent Bookings</Text>
          <TouchableOpacity onPress={() => router.push({ pathname: '/(vendor)/bookings', params: { from: 'dashboard' } })} activeOpacity={0.8}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentBookings.length > 0 ? (
          <View style={styles.listCard}>
            {recentBookings.slice(0, 4).map((b, i) => (
              <React.Fragment key={b.id}>
                <BookingRow booking={b} />
                {i < Math.min(recentBookings.length, 4) - 1 && <View style={styles.rowDiv} />}
              </React.Fragment>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={32} color={D.textMuted} />
            <Text style={styles.emptyTxt}>No bookings yet</Text>
            <Text style={styles.emptySubTxt}>Bookings will appear here once travelers start booking your packages.</Text>
          </View>
        )}
      </View>

      {/* ── Performance overview ───────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.secTitle}>Performance</Text>
        <View style={styles.perfGrid}>
          {[
            { label: 'Total Bookings', value: String(totalBookings), icon: 'calendar-outline' as const, color: D.info, bg: D.infoDim },
            { label: 'Pending', value: String(dashboard?.pending_bookings ?? 0), icon: 'time-outline' as const, color: D.warning, bg: D.warningDim },
            { label: 'Confirmed', value: String(dashboard?.confirmed_bookings ?? 0), icon: 'checkmark-circle-outline' as const, color: D.success, bg: D.successDim },
            { label: 'Cancelled', value: String(dashboard?.cancelled_bookings ?? 0), icon: 'close-circle-outline' as const, color: D.danger, bg: D.dangerDim },
          ].map((item) => (
            <View key={item.label} style={styles.perfCard}>
              <View style={[styles.perfIcon, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={16} color={item.color} />
              </View>
              <Text style={styles.perfValue}>{item.value}</Text>
              <Text style={styles.perfLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Reviews summary ────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.secRow}>
          <Text style={styles.secTitle}>Customer Reviews</Text>
          <TouchableOpacity onPress={() => router.push({ pathname: '/(vendor)/reviews', params: { from: 'dashboard' } })} activeOpacity={0.8}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.reviewCard}>
          {/* Rating summary */}
          <View style={styles.reviewSummary}>
            <View style={styles.reviewBig}>
              <Ionicons name="star" size={24} color={D.star} />
              <Text style={styles.reviewScore}>{avgRating > 0 ? avgRating.toFixed(1) : '—'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewAvgLabel}>Average Rating</Text>
              <Text style={styles.reviewCount}>Based on {dashboard?.total_reviews ?? 0} reviews</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Grow your business ─────────────────────────────────── */}
      <View style={styles.growCard}>
        <View style={styles.growOverlay} />
        <View style={{ flex: 1 }}>
          <Text style={styles.growTitle}>Grow Your Business</Text>
          <Text style={styles.growSub}>Promote your top packages and reach more travelers across India.</Text>
          <TouchableOpacity
            style={styles.growBtn}
            onPress={() => router.push('/(vendor)/packages')}
            activeOpacity={0.85}
          >
            <Text style={styles.growBtnTxt}>Promote Now</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
        <Ionicons name="rocket-outline" size={56} color={D.primary} style={{ opacity: 0.3 }} />
      </View>

      {/* ── Need help ──────────────────────────────────────────── */}
      <View style={styles.helpCard}>
        <View style={styles.helpLeft}>
          <View style={[styles.perfIcon, { backgroundColor: D.infoDim }]}>
            <Ionicons name="help-circle-outline" size={18} color={D.info} />
          </View>
          <View>
            <Text style={styles.helpTitle}>Need Help?</Text>
            <Text style={styles.helpSub}>Contact our support team</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.helpBtn}
          onPress={() => router.push({ pathname: '/(vendor)/settings', params: { from: 'dashboard' } })}
          activeOpacity={0.8}
        >
          <Text style={styles.helpBtnTxt}>Contact Support</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const PERF_W = (SW - H_PAD * 2 - GAP * 3) / 4;

const styles = StyleSheet.create({
  scroll:   { flex: 1, backgroundColor: D.bg },
  content:  { paddingHorizontal: H_PAD, paddingTop: 12 },

  // Header
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  logoRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon:       { width: 28, height: 28, borderRadius: 8, backgroundColor: D.primaryDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: D.primary + '44' },
  logoText:       { fontSize: 14, fontWeight: '800', color: D.text, letterSpacing: 1.5 },
  logoSub:        { fontSize: 9, fontWeight: '700', color: D.primary, letterSpacing: 2 },
  headerRight:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hBtn:           { width: 34, height: 34, borderRadius: 9, backgroundColor: D.card, borderWidth: 1, borderColor: D.cardBorder, alignItems: 'center', justifyContent: 'center' },
  notifDot:       { position: 'absolute', top: 5, right: 5, minWidth: 13, height: 13, borderRadius: 7, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2, borderWidth: 1.5, borderColor: D.bg },
  notifDotTxt:    { color: '#fff', fontSize: 7, fontWeight: '800' },
  companyBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: D.card, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: D.cardBorder, maxWidth: 160 },
  companyAvatar:  { width: 22, height: 22, borderRadius: 11, backgroundColor: D.primary, alignItems: 'center', justifyContent: 'center' },
  companyAvatarTxt: { fontSize: 10, fontWeight: '800', color: '#fff' },
  companyBtnTxt:  { fontSize: 12, fontWeight: '600', color: D.text, flex: 1 },

  // Hero
  hero:         { marginBottom: 20, gap: 10 },
  heroGreeting: { fontSize: 14, color: D.textSec, fontWeight: '500' },
  heroName:     { fontSize: 22, fontWeight: '800', color: D.text, letterSpacing: -0.3, marginTop: 2 },
  heroSub:      { fontSize: 13, color: D.textSec, marginTop: 4, lineHeight: 18 },
  datePill:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: D.card, borderWidth: 1, borderColor: D.cardBorder, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7, alignSelf: 'flex-start' },
  dateTxt:      { fontSize: 11, color: D.textSec, fontWeight: '500' },

  // Stat grid
  statGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginBottom: 16 },
  statCard:    { backgroundColor: D.card, borderRadius: 16, padding: 13, borderWidth: 1, borderColor: D.cardBorder, gap: 5 },
  statTop:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statIcon:    { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  statValue:   { fontSize: 20, fontWeight: '800', color: D.text, letterSpacing: -0.5 },
  statLabel:   { fontSize: 10, color: D.textSec, fontWeight: '500' },

  // Earnings
  earnCard:    { backgroundColor: D.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: D.cardBorder, marginBottom: 16 },
  earnHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  earnTotal:   { fontSize: 11, color: D.textSec, fontWeight: '500', marginTop: 2 },
  earnAmount:  { fontSize: 22, fontWeight: '800', color: D.text, letterSpacing: -0.4 },
  periodPill:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: D.cardBorder, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  periodTxt:   { fontSize: 12, color: D.textSec, fontWeight: '600' },

  // Section
  section:  { marginBottom: 20 },
  secRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  secTitle: { fontSize: 16, fontWeight: '700', color: D.text, marginBottom: 12 },
  viewAll:  { fontSize: 13, color: D.primary, fontWeight: '600' },

  // Quick actions
  qaCard:    { backgroundColor: D.card, borderRadius: 16, borderWidth: 1, borderColor: D.cardBorder, overflow: 'hidden' },
  qaRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  qaIcon:    { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  qaLabel:   { fontSize: 14, fontWeight: '600', color: D.text },
  qaSub:     { fontSize: 11, color: D.textSec, marginTop: 1 },
  qaDivider: { height: 1, backgroundColor: D.divider, marginHorizontal: 14 },

  // Bookings list
  listCard: { backgroundColor: D.card, borderRadius: 16, borderWidth: 1, borderColor: D.cardBorder, overflow: 'hidden' },
  bRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  bThumb:   { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bTitle:   { fontSize: 13, fontWeight: '600', color: D.text },
  bMeta:    { fontSize: 11, color: D.textSec, marginTop: 1 },
  bDateRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  bDate:    { fontSize: 11, color: D.textMuted },
  bAmount:  { fontSize: 13, fontWeight: '700', color: D.text },
  bBadge:   { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  bBadgeTxt:{ fontSize: 10, fontWeight: '700' },
  rowDiv:   { height: 1, backgroundColor: D.divider, marginHorizontal: 14 },
  emptyCard:{ backgroundColor: D.card, borderRadius: 16, borderWidth: 1, borderColor: D.cardBorder, padding: 32, alignItems: 'center', gap: 8 },
  emptyTxt: { fontSize: 15, fontWeight: '700', color: D.text },
  emptySubTxt: { fontSize: 12, color: D.textSec, textAlign: 'center', lineHeight: 18 },

  // Performance grid
  perfGrid: { flexDirection: 'row', gap: GAP },
  perfCard: { width: PERF_W, backgroundColor: D.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: D.cardBorder, alignItems: 'center', gap: 6 },
  perfIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  perfValue:{ fontSize: 18, fontWeight: '800', color: D.text },
  perfLabel:{ fontSize: 9, color: D.textSec, textAlign: 'center' },

  // Reviews
  reviewCard:    { backgroundColor: D.card, borderRadius: 16, borderWidth: 1, borderColor: D.cardBorder, padding: 16 },
  reviewSummary: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  reviewBig:     { alignItems: 'center', gap: 4, width: 64 },
  reviewScore:   { fontSize: 32, fontWeight: '800', color: D.text },
  reviewAvgLabel:{ fontSize: 13, fontWeight: '700', color: D.text },
  reviewCount:   { fontSize: 11, color: D.textSec, marginBottom: 8 },

  // Grow card
  growCard:    { backgroundColor: D.card, borderRadius: 16, borderWidth: 1, borderColor: D.cardBorder, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, overflow: 'hidden' },
  growOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(232,99,26,0.04)' },
  growTitle:   { fontSize: 16, fontWeight: '800', color: D.text, marginBottom: 4 },
  growSub:     { fontSize: 12, color: D.textSec, lineHeight: 17, marginBottom: 12 },
  growBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: D.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, alignSelf: 'flex-start' },
  growBtnTxt:  { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Help card
  helpCard:  { backgroundColor: D.card, borderRadius: 16, borderWidth: 1, borderColor: D.cardBorder, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  helpLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  helpTitle: { fontSize: 14, fontWeight: '700', color: D.text },
  helpSub:   { fontSize: 11, color: D.textSec },
  helpBtn:   { backgroundColor: D.infoDim, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: D.info + '44' },
  helpBtnTxt:{ fontSize: 12, fontWeight: '700', color: D.info },
});
