/**
 * @file app/(admin)/index.tsx
 * Admin Dashboard — Luxury SaaS dark-mode redesign.
 * Glassmorphism cards, neon accents, premium typography.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import {
  useAdminDashboard,
  useAdminEarningsForMonth,
  adminDashboardQueryKeys,
} from '../../hooks/admin/useAdminDashboard';
import { useAdminUnreadCount } from '../../hooks/admin/useAdminNotifications';
import { useAdminAuditLogs } from '../../hooks/admin/useAdminAuditLogs';
import {
  ENTITY_META,
  formatTimestamp,
  getActionColor,
  getActionLabel,
} from '../../components/admin/AuditLogItem';
import { useAuthStore } from '../../store/authStore';
import type { AdminAuditLog } from '../../types/admin';

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
  primary:     '#E8631A',
  primaryDim:  'rgba(232,99,26,0.12)',
  primaryGlow: 'rgba(232,99,26,0.25)',
  success:     '#10B981',
  successDim:  'rgba(16,185,129,0.12)',
  warning:     '#F59E0B',
  warningDim:  'rgba(245,158,11,0.12)',
  danger:      '#EF4444',
  info:        '#3B82F6',
  infoDim:     'rgba(59,130,246,0.12)',
  purple:      '#8B5CF6',
  purpleDim:   'rgba(139,92,246,0.12)',
  text:        '#FFFFFF',
  textSec:     '#94A3B8',
  textMuted:   '#475569',
  divider:     '#1E2D40',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function push(route: string) {
  router.push(route as Parameters<typeof router.push>[0]);
}

function formatINR(n: number): string {
  if (n >= 1_00_00_000) return `${INR}${(n / 1_00_00_000).toFixed(1)}Cr`;
  if (n >= 1_00_000)    return `${INR}${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000)       return `${INR}${(n / 1_000).toFixed(1)}K`;
  return `${INR}${n.toLocaleString('en-IN')}`;
}

function todayStr(): string {
  return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const ALL_TIME = 'all' as const;
type EarningsPeriod = string | typeof ALL_TIME;

interface MonthOption { key: EarningsPeriod; label: string }

function buildMonthOptions(): MonthOption[] {
  const options: MonthOption[] = [{ key: ALL_TIME, label: 'All Time' }];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    options.push({ key, label: i === 0 ? `${label} (This Month)` : label });
  }
  return options;
}

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  onPress?: () => void;
  loading?: boolean;
}

function StatCard(p: StatCardProps): React.ReactElement {
  return (
    <TouchableOpacity onPress={p.onPress} activeOpacity={0.82} style={[styles.statCard, { width: CARD_W }]}>
      <View style={styles.statTop}>
        <View style={[styles.statIcon, { backgroundColor: p.iconBg }]}>
          <MaterialCommunityIcons name={p.icon} size={16} color={p.iconColor} />
        </View>
      </View>
      {p.loading
        ? <View style={styles.statSkeleton} />
        : <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{p.value}</Text>
      }
      <Text style={styles.statLabel}>{p.label}</Text>
    </TouchableOpacity>
  );
}

// ── Quick action ──────────────────────────────────────────────────────────────

function QAction({ icon, label, bg, color, onPress }: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string; bg: string; color: string; onPress: () => void;
}): React.ReactElement {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.qaRow}>
      <View style={[styles.qaIcon, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.qaLabel}>{label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={16} color={D.textMuted} />
    </TouchableOpacity>
  );
}

// ── Activity item ─────────────────────────────────────────────────────────────

function ActivityItem({ log }: { log: AdminAuditLog }): React.ReactElement {
  const color = getActionColor(log.action);
  const entityMeta = ENTITY_META[log.entity_type] ?? { icon: 'information-outline' as const, label: log.entity_type };
  const adminName = log.admin?.full_name?.trim() || log.admin?.email || 'Admin';

  return (
    <View style={styles.actRow}>
      <View style={[styles.actAvatar, { backgroundColor: `${color}22` }]}>
        <MaterialCommunityIcons name={entityMeta.icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.actTitle} numberOfLines={1}>{getActionLabel(log.action)}</Text>
        <Text style={styles.actSub} numberOfLines={1}>{entityMeta.label} · By {adminName}</Text>
      </View>
      <Text style={styles.actTime}>{formatTimestamp(log.created_at)}</Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AdminDashboardScreen(): React.ReactElement {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { data: metrics, isLoading, isRefetching, error, refetch } = useAdminDashboard();
  const { data: activity, isLoading: activityLoading } = useAdminAuditLogs({ page: 1, limit: 3 });
  const unread = useAdminUnreadCount();

  const [earningsPeriod, setEarningsPeriod] = useState<EarningsPeriod>(ALL_TIME);
  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const monthOptions = useMemo(buildMonthOptions, []);

  const isAllTime = earningsPeriod === ALL_TIME;
  const {
    data: monthEarnings,
    isLoading: monthEarningsLoading,
    isFetching: monthEarningsFetching,
  } = useAdminEarningsForMonth(isAllTime ? '' : earningsPeriod);

  const firstName = (user?.full_name ?? 'Admin').split(' ')[0] ?? 'Admin';

  const onRefresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: adminDashboardQueryKeys.all });
    void refetch();
  }, [queryClient, refetch]);

  const pendingItems = [
    { icon: 'timer-sand' as const,     label: 'Vendors',  count: metrics?.pending_vendors  ?? 0, color: D.warning, route: '/(admin)/vendors?status=pending' },
    { icon: 'package-variant' as const,label: 'Packages', count: metrics?.pending_packages ?? 0, color: D.primary, route: '/(admin)/packages?status=pending' },
    { icon: 'star' as const,           label: 'Reviews',  count: metrics?.pending_reviews  ?? 0, color: D.purple,  route: '/(admin)/reviews' },
    { icon: 'cash' as const,           label: 'Payouts',  count: metrics?.pending_payouts  ?? 0, color: D.success, route: '/(admin)/payouts' },
  ].filter((i) => i.count > 0);

  const totalPending = pendingItems.reduce((a, b) => a + b.count, 0);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
            onRefresh={onRefresh}
            tintColor={D.primary}
            colors={[D.primary]}
          />
        }
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <MaterialCommunityIcons name="airplane" size={16} color={D.primary} />
            </View>
            <Text style={styles.logoText}>Toureez</Text>
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeTxt}>Admin</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.hBtn} onPress={() => push('/(admin)/notifications')} activeOpacity={0.8}>
              <MaterialCommunityIcons name="bell-outline" size={18} color={D.textSec} />
              {unread > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeTxt}>{unread > 9 ? '9+' : String(unread)}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBtn} onPress={() => push('/(admin)/account')} activeOpacity={0.8}>
              <Text style={styles.avatarTxt}>{(user?.full_name ?? 'A').charAt(0).toUpperCase()}</Text>
              <View style={styles.onlineDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Welcome ────────────────────────────────────────────── */}
        <View style={styles.welcome}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeTitle}>Welcome Back, {firstName} 👋</Text>
            <Text style={styles.welcomeSub}>Here's what's happening on your platform today.</Text>
          </View>
          <TouchableOpacity
            style={styles.datePill}
            onPress={() => push('/(admin)/analytics')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="calendar-month-outline" size={13} color={D.textSec} />
            <Text style={styles.dateTxt}>{todayStr()}</Text>
          </TouchableOpacity>
        </View>

        {/* Error banner */}
        {error != null && (
          <View style={styles.errBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={D.danger} />
            <Text style={styles.errTxt}>Could not load metrics. Pull down to retry.</Text>
          </View>
        )}

        {/* ── Stat cards ─────────────────────────────────────────── */}
        <View style={styles.statGrid}>
          <StatCard icon="account-group" iconBg={D.infoDim} iconColor={D.info}
            label="Total Users" value={(metrics?.total_users ?? 0).toLocaleString('en-IN')}
            loading={isLoading}
            onPress={() => push('/(admin)/users')} />
          <StatCard icon="calendar-check" iconBg={D.purpleDim} iconColor={D.purple}
            label="Total Bookings" value={(metrics?.total_bookings ?? 0).toLocaleString('en-IN')}
            loading={isLoading}
            onPress={() => push('/(admin)/bookings')} />
          <StatCard icon="currency-inr" iconBg={D.successDim} iconColor={D.success}
            label="Revenue" value={formatINR(metrics?.total_revenue ?? 0)}
            loading={isLoading}
            onPress={() => push('/(admin)/payouts')} />
          <StatCard icon="store" iconBg={D.warningDim} iconColor={D.warning}
            label="Active Vendors" value={(metrics?.total_vendors ?? 0).toLocaleString('en-IN')}
            loading={isLoading}
            onPress={() => push('/(admin)/vendors')} />
        </View>

        {/* ── Revenue overview ───────────────────────────────────── */}
        <View style={styles.revCard}>
          <View style={styles.revHeader}>
            <View>
              <Text style={styles.secTitle}>Revenue Overview</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <Text style={styles.revAmount}>
                  {isAllTime
                    ? formatINR(metrics?.total_revenue ?? 0)
                    : monthEarningsLoading || monthEarningsFetching
                      ? '—'
                      : formatINR(monthEarnings?.revenue ?? 0)}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.periodPill} onPress={() => setMonthModalVisible(true)} activeOpacity={0.8}>
              <Text style={styles.periodTxt} numberOfLines={1}>
                {monthOptions.find((m) => m.key === earningsPeriod)?.label ?? 'All Time'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={13} color={D.textSec} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Month picker modal ─────────────────────────────────── */}
        <Modal
          visible={monthModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setMonthModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setMonthModalVisible(false)}>
            <Pressable style={styles.monthSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.monthSheetHeader}>
                <Text style={styles.monthSheetTitle}>Select Period</Text>
                <Pressable onPress={() => setMonthModalVisible(false)} hitSlop={8}>
                  <MaterialCommunityIcons name="close" size={22} color={D.text} />
                </Pressable>
              </View>
              <FlatList
                data={monthOptions}
                keyExtractor={(item) => item.key}
                renderItem={({ item }) => {
                  const selected = item.key === earningsPeriod;
                  return (
                    <Pressable
                      style={[styles.monthRow, selected && styles.monthRowSelected]}
                      onPress={() => {
                        setEarningsPeriod(item.key);
                        setMonthModalVisible(false);
                      }}
                    >
                      <Text style={[styles.monthRowText, selected && styles.monthRowTextSelected]}>{item.label}</Text>
                      {selected && <MaterialCommunityIcons name="check-circle" size={18} color={D.primary} />}
                    </Pressable>
                  );
                }}
                style={{ maxHeight: 360 }}
              />
            </Pressable>
          </Pressable>
        </Modal>

        {/* ── Quick actions ──────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.secTitle}>Quick Actions</Text>
          <View style={styles.qaCard}>
            <QAction icon="plus-circle" label="Add Package" bg={D.primaryDim} color={D.primary} onPress={() => push('/(admin)/packages')} />
            <View style={styles.qaDivider} />
            <QAction icon="store-plus" label="Add Vendor" bg={D.infoDim} color={D.info} onPress={() => push('/(admin)/vendors')} />
            <View style={styles.qaDivider} />
            <QAction icon="account-multiple" label="Manage Users" bg={D.successDim} color={D.success} onPress={() => push('/(admin)/users')} />
            <View style={styles.qaDivider} />
            <QAction icon="chart-bar" label="View Reports" bg={D.purpleDim} color={D.purple} onPress={() => push('/(admin)/analytics')} />
          </View>
        </View>

        {/* ── Needs attention ────────────────────────────────────── */}
        {!isLoading && totalPending > 0 && (
          <View style={styles.section}>
            <View style={styles.secRow}>
              <Text style={styles.secTitle}>Needs Attention</Text>
              <View style={[styles.trendPill, { backgroundColor: D.warningDim }]}>
                <Text style={[styles.trendTxt, { color: D.warning }]}>{totalPending} open</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -H_PAD }}>
              <View style={{ flexDirection: 'row', gap: GAP, paddingHorizontal: H_PAD }}>
                {pendingItems.map((item) => (
                  <TouchableOpacity key={item.route} style={styles.pendCard} onPress={() => push(item.route)} activeOpacity={0.82}>
                    <View style={[styles.pendAccent, { backgroundColor: item.color }]} />
                    <View style={styles.pendBody}>
                      <View style={styles.pendTop}>
                        <MaterialCommunityIcons name={item.icon} size={20} color={item.color} />
                        <View style={[styles.pendBadge, { backgroundColor: item.color + '22' }]}>
                          <Text style={[styles.pendBadgeTxt, { color: item.color }]}>{item.count}</Text>
                        </View>
                      </View>
                      <Text style={styles.pendLabel}>{item.label}</Text>
                      <Text style={[styles.pendReview, { color: item.color }]}>Review →</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ── Recent activity ────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.secRow}>
            <Text style={styles.secTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => push('/(admin)/audit-logs')} activeOpacity={0.8}>
              <Text style={styles.viewAll}>View All →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.actCard}>
            {activityLoading ? (
              <Text style={styles.actEmpty}>Loading…</Text>
            ) : activity && activity.items.length > 0 ? (
              activity.items.map((log, i) => (
                <React.Fragment key={log.id}>
                  {i > 0 && <View style={styles.actDivider} />}
                  <ActivityItem log={log} />
                </React.Fragment>
              ))
            ) : (
              <Text style={styles.actEmpty}>No recent activity</Text>
            )}
          </View>
        </View>

        {/* ── Manage modules ─────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.secTitle}>Manage</Text>
          <View style={styles.mgGrid}>
            {([
              { icon: 'account-group',   label: 'Users',      desc: 'Roles & access',      color: D.info,    bg: D.infoDim,    route: '/(admin)/users' },
              { icon: 'store',           label: 'Vendors',    desc: 'KYC & onboarding',    color: D.warning, bg: D.warningDim, route: '/(admin)/vendors' },
              { icon: 'package-variant', label: 'Packages',   desc: 'Approve & feature',   color: D.primary, bg: D.primaryDim, route: '/(admin)/packages' },
              { icon: 'calendar',        label: 'Bookings',   desc: 'Status & history',    color: D.purple,  bg: D.purpleDim,  route: '/(admin)/bookings' },
              { icon: 'star',            label: 'Reviews',    desc: 'Moderation',           color: D.success, bg: D.successDim, route: '/(admin)/reviews' },
              { icon: 'cash',            label: 'Payouts',    desc: 'Settlements',          color: D.success, bg: D.successDim, route: '/(admin)/payouts' },
              { icon: 'tag',             label: 'Categories', desc: 'Taxonomy',             color: D.info,    bg: D.infoDim,    route: '/(admin)/categories' },
              { icon: 'map-marker',      label: 'Locations',  desc: 'Destinations',         color: D.warning, bg: D.warningDim, route: '/(admin)/locations' },
              { icon: 'heart-pulse',     label: 'System Health', desc: 'Service status',    color: D.success, bg: D.successDim, route: '/(admin)/system-health' },
            ] as const).map((m) => (
              <TouchableOpacity key={m.route} style={styles.mgCard} onPress={() => push(m.route)} activeOpacity={0.8}>
                <View style={[styles.mgIcon, { backgroundColor: m.bg }]}>
                  <MaterialCommunityIcons name={m.icon} size={20} color={m.color} />
                </View>
                <Text style={styles.mgLabel}>{m.label}</Text>
                <Text style={styles.mgDesc} numberOfLines={1}>{m.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => push('/(admin)/audit-logs')} activeOpacity={0.8}>
            <Text style={styles.footerLink}>Audit Logs</Text>
          </TouchableOpacity>
          <Text style={styles.footerDot}>·</Text>
          <TouchableOpacity onPress={() => push('/(admin)/account')} activeOpacity={0.8}>
            <Text style={styles.footerLink}>Account</Text>
          </TouchableOpacity>
          <Text style={styles.footerDot}>·</Text>
          <Text style={styles.footerVersion}>Toureez Admin v1</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const MG_CARD_W = (SW - H_PAD * 2 - GAP * 3) / 4;

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: D.bg },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: H_PAD, paddingTop: 12, paddingBottom: 40 },

  // Header
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  logoRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon:      { width: 30, height: 30, borderRadius: 9, backgroundColor: D.primaryDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: D.primary + '44' },
  logoText:      { fontSize: 16, fontWeight: '800', color: D.text, letterSpacing: 1.5 },
  adminBadge:    { backgroundColor: D.primaryDim, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: D.primary + '55' },
  adminBadgeTxt: { fontSize: 10, fontWeight: '700', color: D.primary, letterSpacing: 0.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hBtn:          { width: 36, height: 36, borderRadius: 10, backgroundColor: D.card, borderWidth: 1, borderColor: D.cardBorder, alignItems: 'center', justifyContent: 'center' },
  notifBadge:    { position: 'absolute', top: 6, right: 6, minWidth: 14, height: 14, borderRadius: 7, backgroundColor: D.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: D.bg },
  notifBadgeTxt: { color: '#fff', fontSize: 7, fontWeight: '800' },
  avatarBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: D.primary, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:     { fontSize: 14, fontWeight: '800', color: '#fff' },
  onlineDot:     { position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: 5, backgroundColor: D.success, borderWidth: 1.5, borderColor: D.bg },

  // Welcome
  welcome:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20 },
  welcomeTitle: { fontSize: 21, fontWeight: '800', color: D.text, letterSpacing: -0.3 },
  welcomeSub:   { fontSize: 13, color: D.textSec, marginTop: 4, lineHeight: 18 },
  datePill:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: D.card, borderWidth: 1, borderColor: D.cardBorder, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, alignSelf: 'flex-start', marginTop: 2 },
  dateTxt:      { fontSize: 11, color: D.textSec, fontWeight: '500' },

  // Error
  errBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  errTxt:    { fontSize: 13, color: D.danger, flex: 1 },

  // Stat cards
  statGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginBottom: 16 },
  statCard:     { backgroundColor: D.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: D.cardBorder, gap: 6 },
  statTop:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statIcon:     { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  trendPill:    { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 },
  trendTxt:     { fontSize: 10, fontWeight: '700' },
  statValue:    { fontSize: 22, fontWeight: '800', color: D.text, letterSpacing: -0.5 },
  statLabel:    { fontSize: 11, color: D.textSec, fontWeight: '500' },
  statSkeleton: { height: 22, backgroundColor: D.cardBorder, borderRadius: 6 },

  // Revenue chart card
  revCard:   { backgroundColor: D.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: D.cardBorder, marginBottom: 16 },
  revHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  revAmount: { fontSize: 26, fontWeight: '800', color: D.text, letterSpacing: -0.5 },
  periodPill:{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: D.cardBorder, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, maxWidth: 150 },
  periodTxt: { fontSize: 12, color: D.textSec, fontWeight: '600' },

  // Month picker modal
  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  monthSheet:         { backgroundColor: D.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: D.cardBorder, paddingBottom: 24 },
  monthSheetHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderBottomColor: D.divider },
  monthSheetTitle:    { fontSize: 16, fontWeight: '700', color: D.text },
  monthRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14 },
  monthRowSelected:   { backgroundColor: D.primaryDim },
  monthRowText:       { fontSize: 14, color: D.textSec, fontWeight: '500' },
  monthRowTextSelected: { color: D.primary, fontWeight: '700' },

  // Section
  section:  { marginBottom: 20 },
  secRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  secTitle: { fontSize: 16, fontWeight: '700', color: D.text, marginBottom: 12 },
  viewAll:  { fontSize: 13, color: D.primary, fontWeight: '600' },

  // Quick actions
  qaCard:    { backgroundColor: D.card, borderRadius: 16, borderWidth: 1, borderColor: D.cardBorder, overflow: 'hidden' },
  qaRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  qaIcon:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  qaLabel:   { flex: 1, fontSize: 14, fontWeight: '600', color: D.text },
  qaDivider: { height: 1, backgroundColor: D.divider, marginHorizontal: 14 },

  // Pending cards
  pendCard:    { width: 152, backgroundColor: D.card, borderRadius: 14, borderWidth: 1, borderColor: D.cardBorder, overflow: 'hidden', flexDirection: 'row' },
  pendAccent:  { width: 3 },
  pendBody:    { flex: 1, padding: 12, gap: 5 },
  pendTop:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pendBadge:   { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  pendBadgeTxt:{ fontSize: 12, fontWeight: '700' },
  pendLabel:   { fontSize: 13, fontWeight: '600', color: D.text },
  pendReview:  { fontSize: 11, fontWeight: '700' },

  // Activity
  actCard:    { backgroundColor: D.card, borderRadius: 16, borderWidth: 1, borderColor: D.cardBorder, overflow: 'hidden' },
  actRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  actAvatar:  { width: 40, height: 40, borderRadius: 20, backgroundColor: D.cardBorder, alignItems: 'center', justifyContent: 'center' },
  actTitle:   { fontSize: 13, fontWeight: '600', color: D.text },
  actSub:     { fontSize: 12, color: D.textSec, marginTop: 1 },
  actTime:    { fontSize: 11, color: D.textMuted },
  actEmpty:   { fontSize: 13, color: D.textSec, padding: 14, textAlign: 'center' },
  actDivider: { height: 1, backgroundColor: D.divider, marginHorizontal: 14 },

  // Manage grid
  mgGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  mgCard: { width: MG_CARD_W, backgroundColor: D.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: D.cardBorder, alignItems: 'center', gap: 5 },
  mgIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  mgLabel:{ fontSize: 12, fontWeight: '700', color: D.text, textAlign: 'center' },
  mgDesc: { fontSize: 10, color: D.textSec, textAlign: 'center' },

  // Footer
  footer:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  footerLink:   { fontSize: 12, color: D.textMuted, fontWeight: '500' },
  footerDot:    { fontSize: 12, color: D.textMuted },
  footerVersion:{ fontSize: 12, color: D.textMuted },
});
