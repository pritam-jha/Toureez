/**
 * @file app/(vendor)/analytics.tsx
 * @description Vendor analytics screen with revenue chart and KPIs.
 */

import React from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Header } from '../../components/ui/Header';
import { ListLoader } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { useVendorAnalytics } from '../../hooks/useVendorAnalytics';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - 32;

// ── KPI tile ──────────────────────────────────────────────────────────────────

interface KpiTileProps {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}

function KpiTile({ label, value, sub, accent = Colors.primary }: KpiTileProps): React.ReactElement {
  return (
    <View style={[styles.kpiTile, Shadows.sm]}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color: accent }]}>{value}</Text>
      {sub != null && <Text style={styles.kpiSub}>{sub}</Text>}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AnalyticsScreen(): React.ReactElement {
  const { data, isLoading, refetch, isFetching } = useVendorAnalytics();

  const chartData = (data?.monthly_revenue ?? []).map((m) => ({
    value: m.revenue,
    label: m.month.slice(5), // MM
    frontColor: Colors.primary,
    topLabelComponent: () => (
      <Text style={styles.barLabel}>
        {m.revenue >= 1_000 ? `${Math.round(m.revenue / 1000)}K` : String(m.revenue)}
      </Text>
    ),
  }));

  return (
    <View style={styles.flex}>
      <Header title="Analytics" showBack />

      {isLoading ? (
        <ListLoader />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={() => void refetch()}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          {/* ── Revenue chart ── */}
          <View style={[styles.section, Shadows.sm]}>
            <Text style={styles.sectionTitle}>Monthly Revenue (₹)</Text>
            {chartData.length === 0 ? (
              <EmptyState
                icon="📊"
                title="No data yet"
                description="Revenue will appear here after your first booking."
              />
            ) : (
              <BarChart
                data={chartData}
                width={CHART_W - 32}
                height={180}
                barWidth={Math.max(18, Math.floor((CHART_W - 60) / Math.max(chartData.length, 1)) - 8)}
                spacing={8}
                roundedTop
                hideRules
                xAxisThickness={1}
                yAxisThickness={0}
                yAxisTextStyle={styles.axisText}
                xAxisLabelTextStyle={styles.axisText}
                noOfSections={4}
                isAnimated
              />
            )}
          </View>

          {/* ── KPI row ── */}
          <View style={styles.kpiRow}>
            <KpiTile
              label="Completion Rate"
              value={`${data?.completion_rate ?? 0}%`}
              accent={Colors.success}
            />
            <KpiTile
              label="Cancellation Rate"
              value={`${data?.cancellation_rate ?? 0}%`}
              accent={data?.cancellation_rate && data.cancellation_rate > 20 ? Colors.error : Colors.textSecondary}
            />
          </View>

          <View style={styles.kpiRow}>
            <KpiTile
              label="Revenue vs Last Month"
              value={`${(data?.this_month_vs_last.revenue_change_pct ?? 0) >= 0 ? '+' : ''}${data?.this_month_vs_last.revenue_change_pct ?? 0}%`}
              accent={(data?.this_month_vs_last.revenue_change_pct ?? 0) >= 0 ? Colors.success : Colors.error}
            />
            <KpiTile
              label="Bookings vs Last Month"
              value={`${(data?.this_month_vs_last.bookings_change_pct ?? 0) >= 0 ? '+' : ''}${data?.this_month_vs_last.bookings_change_pct ?? 0}%`}
              accent={(data?.this_month_vs_last.bookings_change_pct ?? 0) >= 0 ? Colors.success : Colors.error}
            />
          </View>

          {/* ── Top packages ── */}
          {(data?.top_packages ?? []).length > 0 && (
            <View style={[styles.section, Shadows.sm]}>
              <Text style={styles.sectionTitle}>Top Packages</Text>
              {data!.top_packages.map((pkg, i) => (
                <View key={pkg.id} style={styles.pkgRow}>
                  <Text style={styles.pkgRank}>#{i + 1}</Text>
                  <View style={styles.pkgInfo}>
                    <Text style={styles.pkgTitle} numberOfLines={1}>{pkg.title}</Text>
                    <Text style={styles.pkgMeta}>
                      {pkg.total_bookings} bookings · {pkg.avg_rating.toFixed(1)} ★
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  section: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.navy, marginBottom: 12 },
  barLabel: { fontSize: 9, color: Colors.textSecondary },
  axisText: { fontSize: 10, color: Colors.textLight },
  kpiRow: { flexDirection: 'row', gap: 12 },
  kpiTile: {
    flex: 1,
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 4,
  },
  kpiLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  kpiValue: { fontSize: 22, fontWeight: '800' },
  kpiSub: { fontSize: 11, color: Colors.textLight },
  pkgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pkgRank: { fontSize: 14, fontWeight: '800', color: Colors.primary, width: 28 },
  pkgInfo: { flex: 1 },
  pkgTitle: { fontSize: 14, fontWeight: '600', color: Colors.navy },
  pkgMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
