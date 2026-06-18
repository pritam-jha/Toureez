/**
 * @file app/(admin)/system-health.tsx
 * System health monitor — pings the backend's /health endpoint to surface
 * service uptime, database connectivity, and request latency. Auto-refreshes
 * every 30 seconds.
 */

import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontWeight, Radius, Spacing } from '../../constants/theme';
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Body, Caption, H2, Label } from '../../components/ui/Typography';
import { useSystemHealth } from '../../hooks/admin/useSystemHealth';

function formatUptime(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

interface CheckRowProps {
  label: string;
  description: string;
  status: 'ok' | 'error' | 'degraded';
}

function CheckRow({ label, description, status }: CheckRowProps): React.ReactElement {
  const badgeStatus = status === 'ok' ? 'active' : status === 'degraded' ? 'pending' : 'error';
  const badgeLabel = status === 'ok' ? 'Operational' : status === 'degraded' ? 'Degraded' : 'Down';

  return (
    <View style={styles.checkRow}>
      <View style={styles.checkInfo}>
        <Body>{label}</Body>
        <Caption>{description}</Caption>
      </View>
      <Badge status={badgeStatus} label={badgeLabel} />
    </View>
  );
}

interface StatTileProps {
  label: string;
  value: string;
}

function StatTile({ label, value }: StatTileProps): React.ReactElement {
  return (
    <View style={styles.statTile}>
      <Label>{label}</Label>
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

export default function SystemHealthScreen(): React.ReactElement {
  const { data, isLoading, isError, error, refetch, isFetching } = useSystemHealth();

  const refresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const overall = data?.status ?? 'degraded';
  const overallLabel = overall === 'ok' ? 'All Systems Operational' : 'Degraded Performance';
  const overallColor = overall === 'ok' ? Colors.success : Colors.warning;
  const overallBg = overall === 'ok' ? Colors.successLight : Colors.warningLight;

  const lastChecked = data
    ? new Date(data.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  return (
    <ScreenLayout
      title="System Health"
      subtitle="Live backend status"
      onBack={() => router.back()}
      loading={isLoading}
      error={isError ? (error?.message ?? 'Failed to load system health') : undefined}
      onRetry={refresh}
      refreshing={isFetching && !isLoading}
      onRefresh={refresh}
    >
      {/* Overall status banner */}
      <Card variant="flat" style={[styles.banner, { backgroundColor: overallBg }]}>
        <View style={[styles.statusDot, { backgroundColor: overallColor }]} />
        <View style={styles.bannerText}>
          <H2 color={overallColor}>{overallLabel}</H2>
          <Caption>Last checked at {lastChecked}</Caption>
        </View>
      </Card>

      {/* Service checks */}
      <Card variant="flat" style={styles.section}>
        <Label style={styles.sectionTitle}>Checks</Label>
        <CheckRow
          label="API Server"
          description={data?.service ?? 'toureez-backend'}
          status={data ? 'ok' : 'error'}
        />
        <View style={styles.divider} />
        <CheckRow
          label="Database"
          description="Supabase Postgres connection"
          status={data?.checks.database ?? 'error'}
        />
      </Card>

      {/* Stats */}
      <Card variant="flat" style={styles.section}>
        <Label style={styles.sectionTitle}>Stats</Label>
        <View style={styles.statsGrid}>
          <StatTile label="Uptime" value={data ? formatUptime(data.uptime_seconds) : '—'} />
          <StatTile label="Response Time" value={data ? `${data.latency_ms} ms` : '—'} />
        </View>
      </Card>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: Radius.full,
  },
  bannerText: {
    flex: 1,
    gap: 2,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    fontWeight: FontWeight.semibold,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  checkInfo: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statTile: {
    flex: 1,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
});
