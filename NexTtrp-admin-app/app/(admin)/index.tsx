/**
 * @file app/(admin)/index.tsx
 * Admin dashboard with overview metrics, pending queues, and module navigation.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '../../constants/colors';
import {
  FontWeight,
  Layout,
  Radius,
  Shadows,
  Spacing,
  TouchTarget,
} from '../../constants/theme';
import { Stat } from '../../components/ui/Stat';
import { Card } from '../../components/ui/Card';
import { H3, Caption, Label, BodySm } from '../../components/ui/Typography';
import {
  useAdminDashboard,
  adminDashboardQueryKeys,
} from '../../hooks/admin/useAdminDashboard';
import { useAdminUnreadCount } from '../../hooks/admin/useAdminNotifications';
import { useAuthStore } from '../../store/authStore';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';

const INR = '\u20B9';

// \u2500\u2500 Layout constants \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
/** Minimum width of a pending-queue card in the horizontal scroll strip. */
const PENDING_CARD_MIN_WIDTH = 210;
/** Maximum width of a pending-queue card in the horizontal scroll strip. */
const PENDING_CARD_MAX_WIDTH = 260;
/** Fraction of the available content width used to size pending cards. */
const PENDING_CARD_WIDTH_RATIO = 0.72;

/** Minimum column width used when sizing stat overview cards. */
const STAT_CARD_MIN_WIDTH = 150;
/** Maximum number of stat columns on any screen size. */
const STAT_CARD_MAX_COLUMNS = 4;

/** Column width for nav-module cards on desktop. */
const NAV_CARD_WIDTH_DESKTOP = 220;
/** Column width for nav-module cards on mobile. */
const NAV_CARD_WIDTH_MOBILE = 156;
/** Maximum columns for the nav grid on desktop. */
const NAV_CARD_MAX_COLUMNS_DESKTOP = 4;
/** Maximum columns for the nav grid on mobile. */
const NAV_CARD_MAX_COLUMNS_MOBILE = 2;

function pushRoute(route: string) {
  router.push(route as Parameters<typeof router.push>[0]);
}

function formatINR(amount: number): string {
  if (amount >= 1_00_00_000) return `${INR}${(amount / 1_00_00_000).toFixed(1)}Cr`;
  if (amount >= 1_00_000) return `${INR}${(amount / 1_00_000).toFixed(1)}L`;
  if (amount >= 1_000) return `${INR}${(amount / 1_000).toFixed(1)}K`;
  return `${INR}${amount.toLocaleString('en-IN')}`;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function todayLabel(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface PendingItem {
  icon: MCIcon;
  label: string;
  count: number;
  route: string;
  accent: string;
}

function PendingCard({
  item,
  width,
}: {
  item: PendingItem;
  width: number;
}): React.ReactElement {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.pendingCard, { width }, Shadows.sm]}
      onPress={() => pushRoute(item.route)}
      accessibilityRole="button"
      accessibilityLabel={`Review ${item.label}`}
    >
      <View style={[styles.pendingAccent, { backgroundColor: item.accent }]} />
      <View style={styles.pendingBody}>
        <View style={styles.pendingTopRow}>
          <MaterialCommunityIcons name={item.icon} size={22} color={item.accent} />
          <View style={[styles.pendingBadge, { backgroundColor: `${item.accent}18` }]}>
            <Text style={[styles.pendingBadgeText, { color: item.accent }]}>
              {item.count}
            </Text>
          </View>
        </View>
        <Text style={styles.pendingLabel} numberOfLines={2}>
          {item.label}
        </Text>
        <Text style={styles.pendingLink}>Review</Text>
      </View>
    </TouchableOpacity>
  );
}

interface NavItem {
  icon: MCIcon;
  label: string;
  route: string;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: 'account-group',      label: 'Users',      route: '/(admin)/users',         description: 'Roles and access' },
  { icon: 'office-building',    label: 'Vendors',    route: '/(admin)/vendors',       description: 'Onboarding and KYC' },
  { icon: 'package-variant',    label: 'Packages',   route: '/(admin)/packages',      description: 'Approve and feature' },
  { icon: 'calendar',           label: 'Bookings',   route: '/(admin)/bookings',      description: 'Status and history' },
  { icon: 'star',               label: 'Reviews',    route: '/(admin)/reviews',       description: 'Moderation' },
  { icon: 'tag',                label: 'Categories', route: '/(admin)/categories',    description: 'Taxonomy' },
  { icon: 'map-marker',         label: 'Locations',  route: '/(admin)/locations',     description: 'Destinations' },
  { icon: 'cash',               label: 'Payouts',    route: '/(admin)/payouts',       description: 'Vendor settlements' },
  { icon: 'bell-outline',       label: 'Notifications', route: '/(admin)/notifications', description: 'System alerts' },
  { icon: 'account-circle',     label: 'Account',    route: '/(admin)/account',       description: 'Profile & sign out' },
];

export default function AdminDashboardScreen(): React.ReactElement {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { data: metrics, isLoading, isRefetching, error, refetch } =
    useAdminDashboard();
  const layout = useResponsiveLayout();
  const unreadNotifications = useAdminUnreadCount();

  const statColumns = layout.columnsFor(STAT_CARD_MIN_WIDTH, STAT_CARD_MAX_COLUMNS);
  const navColumns = layout.columnsFor(
    layout.isDesktop ? NAV_CARD_WIDTH_DESKTOP : NAV_CARD_WIDTH_MOBILE,
    layout.isDesktop ? NAV_CARD_MAX_COLUMNS_DESKTOP : NAV_CARD_MAX_COLUMNS_MOBILE,
  );
  const statWidth = layout.itemWidth(statColumns);
  const navWidth = layout.itemWidth(navColumns);
  const pendingWidth = Math.min(
    PENDING_CARD_MAX_WIDTH,
    Math.max(PENDING_CARD_MIN_WIDTH, Math.floor(layout.contentWidth * PENDING_CARD_WIDTH_RATIO)),
  );

  const displayName = (user?.full_name ?? 'Admin').trim() || 'Admin';

  const onRefresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: adminDashboardQueryKeys.all });
    void refetch();
  }, [queryClient, refetch]);

  const loading = isLoading;

  const pendingItems: PendingItem[] = useMemo(() => {
    const items: PendingItem[] = [
      {
        icon: 'timer-sand',
        label: 'Vendors awaiting approval',
        count: metrics?.pending_vendors ?? 0,
        route: '/(admin)/vendors',
        accent: Colors.warning,
      },
      {
        icon: 'package-variant',
        label: 'Packages pending review',
        count: metrics?.pending_packages ?? 0,
        route: '/(admin)/packages',
        accent: Colors.primary,
      },
      {
        icon: 'star',
        label: 'Reviews to moderate',
        count: metrics?.pending_reviews ?? 0,
        route: '/(admin)/reviews',
        accent: Colors.accent,
      },
      {
        icon: 'cash',
        label: 'Payouts pending',
        count: metrics?.pending_payouts ?? 0,
        route: '/(admin)/payouts',
        accent: Colors.secondary,
      },
    ];
    return items.filter((i) => i.count > 0);
  }, [metrics]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.topBar}>
        <View style={[styles.topBarInner, { paddingHorizontal: layout.horizontalPadding }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingLabel}>{greeting()}</Text>
            <Text
              style={styles.greetingName}
              numberOfLines={layout.isCompact ? 2 : 1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              {displayName}
            </Text>
            <Text style={styles.headerDate}>{todayLabel()}</Text>
          </View>
          <View style={styles.topBarActions}>
            <TouchableOpacity
              onPress={() => pushRoute('/(admin)/notifications')}
              style={styles.iconBtn}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ''}`}
            >
              <MaterialCommunityIcons name="bell-outline" size={22} color={Colors.text} />
              {unreadNotifications > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadNotifications > 9 ? '9+' : String(unreadNotifications)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => pushRoute('/(admin)/account')}
              style={styles.iconBtn}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel="Account"
            >
              <MaterialCommunityIcons name="account-circle-outline" size={22} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => pushRoute('/(admin)/audit-logs')}
              style={styles.auditBtn}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel="Open audit logs"
            >
              <Text style={styles.auditBtnText}>Audit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.contentOuter,
          { paddingHorizontal: layout.horizontalPadding },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.contentShell}>
          {error && (
            <View style={styles.errorBanner}>
              <View style={styles.errorIcon}>
                <Text style={styles.errorIconText}>!</Text>
              </View>
              <BodySm color={Colors.error} style={styles.errorBannerText}>
                Could not load dashboard. Pull down to retry.
              </BodySm>
            </View>
          )}

          <View style={styles.sectionTitleRow}>
            <Label color={Colors.textSecondary} uppercase>
              Overview
            </Label>
          </View>
          <View style={styles.grid}>
            <View style={{ width: statWidth }}>
              <Stat
                label="Total Users"
                value={metrics?.total_users ?? 0}
                sublabel={`+${metrics?.new_users_this_month ?? 0} this month`}
                accent={Colors.secondary}
                loading={loading}
                onPress={() => pushRoute('/(admin)/users')}
              />
            </View>
            <View style={{ width: statWidth }}>
              <Stat
                label="Total Revenue"
                value={metrics?.total_revenue ?? 0}
                format={(v) => formatINR(typeof v === 'number' ? v : 0)}
                sublabel={`${formatINR(metrics?.revenue_this_month ?? 0)} this month`}
                accent={Colors.success}
                loading={loading}
              />
            </View>
            <View style={{ width: statWidth }}>
              <Stat
                label="Total Bookings"
                value={metrics?.total_bookings ?? 0}
                sublabel={`${(metrics?.bookings_this_month ?? 0).toLocaleString('en-IN')} this month`}
                accent={Colors.accent}
                loading={loading}
                onPress={() => pushRoute('/(admin)/bookings')}
              />
            </View>
            <View style={{ width: statWidth }}>
              <Stat
                label="Pending Tasks"
                value={
                  (metrics?.pending_vendors ?? 0) +
                  (metrics?.pending_packages ?? 0) +
                  (metrics?.pending_reviews ?? 0) +
                  (metrics?.pending_payouts ?? 0)
                }
                sublabel="Across all queues"
                accent={Colors.primary}
                loading={loading}
              />
            </View>
          </View>

          {!loading && pendingItems.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <H3>Needs attention</H3>
                <Caption color={Colors.textLight}>
                  {pendingItems.length} {pendingItems.length === 1 ? 'queue' : 'queues'} with open items
                </Caption>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pendingRow}
              >
                {pendingItems.map((item) => (
                  <PendingCard key={item.route} item={item} width={pendingWidth} />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <H3>Manage</H3>
              <Caption color={Colors.textLight}>Jump to any module</Caption>
            </View>
            <View style={styles.grid}>
              {NAV_ITEMS.map((nav) => (
                <View key={nav.route} style={{ width: navWidth }}>
                  <Card
                    variant="default"
                    padding="md"
                    onPress={() => pushRoute(nav.route)}
                    style={styles.navCell}
                  >
                    <View style={styles.navIcon}>
                      <MaterialCommunityIcons
                        name={nav.icon}
                        size={22}
                        color={Colors.primary}
                      />
                    </View>
                    <View style={styles.navTextWrap}>
                      <Text style={styles.navLabel} numberOfLines={1}>
                        {nav.label}
                      </Text>
                      <Text style={styles.navDesc} numberOfLines={2}>
                        {nav.description}
                      </Text>
                    </View>
                    <Text style={styles.navChevron}>{'>'}</Text>
                  </Card>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.footerInfo}>
            <Caption color={Colors.textLight} align="center">
              XYZ Admin / v1
            </Caption>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  topBarInner: {
    width: '100%',
    maxWidth: Layout.maxContentWidth + Spacing.xxxl,
    alignSelf: 'center',
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  headerLeft: { flex: 1, minWidth: 0 },
  greetingLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  greetingName: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    letterSpacing: 0,
    marginTop: 2,
  },
  headerDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBtn: {
    width: TouchTarget.min,
    height: TouchTarget.min,
    borderRadius: Radius.md,
    backgroundColor: Colors.backgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  notifBadgeText: {
    color: Colors.textWhite,
    fontSize: 8,
    fontWeight: FontWeight.extrabold,
  },
  auditBtn: {
    minHeight: TouchTarget.min,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditBtnText: {
    color: Colors.textWhite,
    fontWeight: FontWeight.bold,
    fontSize: 13,
  },
  scroll: { flex: 1 },
  contentOuter: {
    flexGrow: 1,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxxl,
    alignItems: 'center',
  },
  contentShell: {
    width: '100%',
    maxWidth: Layout.maxContentWidth,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorIcon: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconText: {
    color: Colors.error,
    fontWeight: FontWeight.extrabold,
    fontSize: 15,
  },
  errorBannerText: { flex: 1 },
  sectionTitleRow: {
    marginBottom: Spacing.sm,
  },
  section: {
    marginTop: Spacing.xxxl,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
    gap: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  pendingRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingRight: Spacing.lg,
  },
  pendingCard: {
    minHeight: 128,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  pendingAccent: { width: 4 },
  pendingBody: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  pendingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // pendingIcon removed — now rendered by MaterialCommunityIcons directly
  pendingBadge: {
    paddingHorizontal: Spacing.sm,
    minHeight: 24,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: FontWeight.bold,
  },
  pendingLabel: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    lineHeight: 19,
  },
  pendingLink: {
    fontSize: 12,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    marginTop: 'auto',
  },
  navCell: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  navIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryUltraLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // navIconText removed — now rendered by MaterialCommunityIcons directly
  navTextWrap: { flex: 1, minWidth: 0 },
  navLabel: {
    fontSize: 15,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  navDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  navChevron: {
    fontSize: 17,
    color: Colors.textLight,
    fontWeight: FontWeight.bold,
  },
  footerInfo: { marginTop: Spacing.xxxl, alignItems: 'center' },
});
