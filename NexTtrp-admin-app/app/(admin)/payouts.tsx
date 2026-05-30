/**
 * @file app/(admin)/payouts.tsx
 * @description Admin vendor payout management — list, filter by status, update status.
 */

import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { StatusFilterTabs } from '../../components/dashboard/StatusFilterTabs';
import { ConfirmActionSheet } from '../../components/dashboard/ConfirmActionSheet';
import { useAdminPayouts, useUpdatePayoutStatus } from '../../hooks/admin/useAdminPayouts';
import type { AdminPayout, PayoutStatus } from '../../types/admin';

type PayoutFilter = PayoutStatus | 'all';

const FILTER_TABS = [
  { label: 'All', value: 'all' as const },
  { label: 'Pending', value: 'pending' as PayoutStatus },
  { label: 'Processing', value: 'processing' as PayoutStatus },
  { label: 'Paid', value: 'paid' as PayoutStatus },
  { label: 'Failed', value: 'failed' as PayoutStatus },
];

const STATUS_STYLE: Record<PayoutStatus, { bg: string; text: string }> = {
  pending: { bg: `${Colors.warning}18`, text: Colors.warning },
  processing: { bg: Colors.secondaryLight, text: Colors.secondary },
  paid: { bg: `${Colors.success}18`, text: Colors.success },
  failed: { bg: `${Colors.error}18`, text: Colors.error },
};

function formatINR(amount: number): string {
  if (amount >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(1)}Cr`;
  if (amount >= 1_00_000) return `₹${(amount / 1_00_000).toFixed(1)}L`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function PayoutCard({
  payout,
  onProcess,
  onPay,
  onFail,
  loading,
}: {
  payout: AdminPayout;
  onProcess: () => void;
  onPay: () => void;
  onFail: () => void;
  loading: boolean;
}): React.ReactElement {
  const style = STATUS_STYLE[payout.status];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.vendorName}>{payout.company?.name ?? 'Unknown Vendor'}</Text>
          <Text style={styles.payoutId}>ID: {payout.id.slice(0, 8)}…</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: style.bg }]}>
          <Text style={[styles.badgeText, { color: style.text }]}>
            {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.amount}>{formatINR(payout.amount)}</Text>
        <Text style={styles.currency}>{payout.currency}</Text>
      </View>

      {(payout.period_start || payout.period_end) && (
        <Text style={styles.period}>
          Period: {formatDate(payout.period_start)} → {formatDate(payout.period_end)}
        </Text>
      )}

      {payout.processed_at && (
        <Text style={styles.paidAt}>Paid on: {formatDate(payout.processed_at)}</Text>
      )}
      {payout.failure_reason && (
        <Text style={styles.failureReason}>⚠ {payout.failure_reason}</Text>
      )}

      <Text style={styles.createdAt}>Created: {formatDate(payout.created_at)}</Text>

      {(payout.status === 'pending' || payout.status === 'processing' || payout.status === 'failed') && (
        <View style={styles.actions}>
          {payout.status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionSecondary]}
              onPress={onProcess}
              disabled={loading}
            >
              <Text style={styles.actionSecondaryText}>Mark Processing</Text>
            </TouchableOpacity>
          )}
          {(payout.status === 'pending' || payout.status === 'processing') && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionSuccess]}
              onPress={onPay}
              disabled={loading}
            >
              <Text style={styles.actionSuccessText}>Mark Paid</Text>
            </TouchableOpacity>
          )}
          {payout.status !== 'failed' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionDanger]}
              onPress={onFail}
              disabled={loading}
            >
              <Text style={styles.actionDangerText}>Mark Failed</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

type SheetState = { payoutId: string; targetStatus: PayoutStatus } | null;

export default function AdminPayoutsScreen(): React.ReactElement {
  const [filter, setFilter] = useState<PayoutFilter>('all');
  const [sheet, setSheet] = useState<SheetState>(null);

  const { data, isLoading, isError, refetch } = useAdminPayouts({
    status: filter === 'all' ? undefined : filter,
    limit: 30,
  });

  const updateStatus = useUpdatePayoutStatus();

  const openSheet = (payoutId: string, targetStatus: PayoutStatus) =>
    setSheet({ payoutId, targetStatus });

  const handleConfirm = () => {
    if (!sheet) return;
    const { payoutId, targetStatus } = sheet;
    setSheet(null);
    updateStatus.mutate(
      { payoutId, status: targetStatus },
      {
        onSuccess: () =>
          Alert.alert('Updated', `Payout marked as ${targetStatus}.`),
        onError: (e) => Alert.alert('Error', e.message),
      },
    );
  };

  const statusLabel = sheet?.targetStatus
    ? sheet.targetStatus.charAt(0).toUpperCase() + sheet.targetStatus.slice(1)
    : '';

  const confirmVariant: 'primary' | 'success' | 'danger' =
    sheet?.targetStatus === 'paid'
      ? 'success'
      : sheet?.targetStatus === 'failed'
      ? 'danger'
      : 'primary';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Payouts</Text>
        <View style={styles.backBtn} />
      </View>

      <StatusFilterTabs tabs={FILTER_TABS} selected={filter} onSelect={setFilter} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load payouts</Text>
          <TouchableOpacity onPress={() => void refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PayoutCard
              payout={item}
              loading={updateStatus.isPending}
              onProcess={() => openSheet(item.id, 'processing')}
              onPay={() => openSheet(item.id, 'paid')}
              onFail={() => openSheet(item.id, 'failed')}
            />
          )}
          windowSize={5}
          maxToRenderPerBatch={10}
          removeClippedSubviews
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No payouts found</Text>
            </View>
          }
          ListFooterComponent={
            data ? (
              <Text style={styles.countText}>{data.total} payouts total</Text>
            ) : null
          }
          contentContainerStyle={{ padding: 12, paddingBottom: 32, flexGrow: 1, gap: 10 }}
        />
      )}

      <ConfirmActionSheet
        visible={sheet !== null}
        title={`Mark Payout as ${statusLabel}?`}
        description={
          sheet?.targetStatus === 'paid'
            ? 'This will record the payout as paid and set the paid_at timestamp.'
            : sheet?.targetStatus === 'failed'
            ? 'This will mark the payout as failed. You can retry later.'
            : 'This will move the payout to processing status.'
        }
        confirmLabel={statusLabel}
        confirmVariant={confirmVariant}
        requireReason={sheet?.targetStatus === 'failed'}
        reasonPlaceholder="Reason for failure (optional note)…"
        onConfirm={handleConfirm}
        onCancel={() => setSheet(null)}
        loading={updateStatus.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 60 },
  backText: { color: Colors.primary, fontSize: 16 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardHeaderLeft: { flex: 1, gap: 2, marginRight: 8 },
  vendorName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  payoutId: { fontSize: 11, color: Colors.textLight, fontFamily: 'monospace' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginBottom: 6 },
  amount: { fontSize: 22, fontWeight: '800', color: Colors.text },
  currency: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  period: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  paidAt: { fontSize: 12, color: Colors.success, fontWeight: '500', marginBottom: 4 },
  failureReason: { fontSize: 12, color: Colors.error, marginBottom: 4 },
  createdAt: { fontSize: 11, color: Colors.textLight, marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center', minWidth: 80 },
  actionSuccess: { backgroundColor: `${Colors.success}18` },
  actionSuccessText: { color: Colors.success, fontWeight: '600', fontSize: 12 },
  actionDanger: { backgroundColor: `${Colors.error}18` },
  actionDangerText: { color: Colors.error, fontWeight: '600', fontSize: 12 },
  actionSecondary: { backgroundColor: Colors.secondaryLight },
  actionSecondaryText: { color: Colors.secondary, fontWeight: '600', fontSize: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { color: Colors.textSecondary, fontSize: 14, marginBottom: 12 },
  retryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  retryText: { color: Colors.textWhite, fontWeight: '600', fontSize: 13 },
  emptyText: { color: Colors.textLight, fontSize: 14 },
  countText: { textAlign: 'center', color: Colors.textLight, fontSize: 12, padding: 16 },
});
