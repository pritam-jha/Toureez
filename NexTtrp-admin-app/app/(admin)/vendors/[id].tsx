/**
 * @file app/(admin)/vendors/[id].tsx
 * @description Admin vendor detail — approve, reject, verify.
 */

import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import {
  FontWeight,
  Radius,
  Shadows,
  Spacing,
} from '../../../constants/theme';
import { ScreenLayout } from '../../../components/ui/ScreenLayout';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { H3, H4, Body, Label } from '../../../components/ui/Typography';
import { ModerationToolbar } from '../../../components/admin/ModerationToolbar';
import { ConfirmActionSheet } from '../../../components/dashboard/ConfirmActionSheet';
import {
  useAdminVendor,
  useApproveVendor,
  useRejectVendor,
  useVerifyVendor,
} from '../../../hooks/admin/useAdminVendors';

type ActionSheet = 'approve' | 'reject' | null;

function LabelRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}): React.ReactElement {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.labelKey}>{label}</Text>
      <Text style={styles.labelVal} selectable>
        {value}
      </Text>
    </View>
  );
}

function DetailSkeleton(): React.ReactElement {
  return (
    <View style={{ gap: Spacing.lg }}>
      <Skeleton width={'40%'} height={28} radius={Radius.full} />
      <Skeleton width={'100%'} height={160} radius={Radius.md} />
      <Skeleton width={'100%'} height={220} radius={Radius.md} />
    </View>
  );
}

export default function AdminVendorDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vendorId = id ?? '';
  const [sheet, setSheet] = useState<ActionSheet>(null);

  const { data: vendor, isLoading, isError, error } = useAdminVendor(vendorId);
  const approve = useApproveVendor();
  const reject = useRejectVendor();
  const verify = useVerifyVendor();

  const isMutating =
    approve.isPending || reject.isPending || verify.isPending;

  if (isLoading) {
    return (
      <ScreenLayout
        title="Vendor"
        onBack={() => router.back()}
        scrollable
      >
        <DetailSkeleton />
      </ScreenLayout>
    );
  }

  if (isError || !vendor) {
    return (
      <ScreenLayout
        title="Vendor"
        onBack={() => router.back()}
        error={error?.message ?? 'Vendor not found'}
        onRetry={() => router.back()}
      >
        <View />
      </ScreenLayout>
    );
  }

  const handleVerify = () => {
    verify.mutate(vendorId, {
      onSuccess: () =>
        Alert.alert('Verified', `${vendor.name} is now verified.`),
      onError: (e) => Alert.alert('Error', e.message),
    });
  };

  return (
    <ScreenLayout
      title={vendor.name}
      subtitle={vendor.slug}
      onBack={() => router.back()}
      scrollable
      footer={
        <ModerationToolbar
          actions={[
            {
              label: 'Reject',
              variant: 'danger',
              onPress: () => setSheet('reject'),
              disabled: vendor.status === 'rejected' || isMutating,
              loading: reject.isPending,
            },
            {
              label: vendor.is_verified ? '✓ Verified' : 'Verify',
              variant: 'primary',
              onPress: handleVerify,
              disabled: vendor.is_verified || isMutating,
              loading: verify.isPending,
            },
            {
              label: vendor.status === 'approved' ? '✓ Approved' : 'Approve',
              variant: 'success',
              onPress: () => setSheet('approve'),
              disabled: vendor.status === 'approved' || isMutating,
              loading: approve.isPending,
            },
          ]}
        />
      }
    >
      {/* Hero */}
      <View style={[styles.hero, Shadows.sm]}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroIconText}>
              {vendor.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.heroMeta}>
            <H3 numberOfLines={1}>{vendor.name}</H3>
            <Body color={Colors.textSecondary} numberOfLines={1}>
              {vendor.owner?.full_name ?? vendor.owner?.email ?? '—'}
            </Body>
            <View style={styles.heroBadgeRow}>
              <Badge status={vendor.status} size="md" />
              {vendor.is_verified && <Badge status="verified" size="md" />}
            </View>
          </View>
        </View>

        <View style={styles.heroStatsRow}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{vendor.total_packages}</Text>
            <Text style={styles.heroStatLabel}>Packages</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>
              {vendor.avg_rating.toFixed(1)}
            </Text>
            <Text style={styles.heroStatLabel}>Avg Rating</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{vendor.total_reviews}</Text>
            <Text style={styles.heroStatLabel}>Reviews</Text>
          </View>
        </View>
      </View>

      {/* Company info */}
      <Label style={styles.sectionLabel}>Company information</Label>
      <Card variant="default" padding="md" style={styles.section}>
        <LabelRow label="Name" value={vendor.name} />
        <LabelRow label="Slug" value={vendor.slug} />
        <LabelRow label="About" value={vendor.about ?? '—'} />
        <LabelRow label="GST" value={vendor.gst_number ?? '—'} />
        <LabelRow
          label="Joined"
          value={new Date(vendor.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        />
      </Card>

      {/* Owner */}
      {vendor.owner && (
        <>
          <Label style={styles.sectionLabel}>Owner</Label>
          <Card variant="default" padding="md" style={styles.section}>
            <LabelRow label="Name" value={vendor.owner.full_name ?? '—'} />
            <LabelRow label="Email" value={vendor.owner.email} />
            <LabelRow label="Phone" value={vendor.owner.phone ?? '—'} />
          </Card>
        </>
      )}

      {/* Trade license */}
      {vendor.trade_license_url && (
        <>
          <Label style={styles.sectionLabel}>Documents</Label>
          <Card variant="default" padding="md" style={styles.section}>
            <H4 numberOfLines={1}>Trade License</H4>
            <Body color={Colors.textSecondary} numberOfLines={2} style={{ marginTop: 4 }}>
              {vendor.trade_license_url}
            </Body>
          </Card>
        </>
      )}

      {/* Sheets */}
      <ConfirmActionSheet
        visible={sheet === 'approve'}
        title="Approve vendor?"
        description={`${vendor.name} will be notified and can start listing packages.`}
        confirmLabel="Approve"
        confirmVariant="success"
        onConfirm={() => {
          setSheet(null);
          approve.mutate(
            { vendorId },
            {
              onSuccess: () =>
                Alert.alert('Approved', `${vendor.name} is now approved.`),
              onError: (e) => Alert.alert('Error', e.message),
            },
          );
        }}
        onCancel={() => setSheet(null)}
        loading={approve.isPending}
      />

      <ConfirmActionSheet
        visible={sheet === 'reject'}
        title="Reject vendor"
        description="A rejection reason is required. The vendor will be notified."
        confirmLabel="Reject"
        confirmVariant="danger"
        requireReason
        reasonPlaceholder="Reason for rejection (min 5 characters)…"
        onConfirm={(reason) => {
          setSheet(null);
          reject.mutate(
            { vendorId, reason: reason! },
            {
              onSuccess: () =>
                Alert.alert('Rejected', `${vendor.name} has been rejected.`),
              onError: (e) => Alert.alert('Error', e.message),
            },
          );
        }}
        onCancel={() => setSheet(null)}
        loading={reject.isPending}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  heroTopRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconText: {
    fontSize: 26,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
  },
  heroMeta: { flex: 1, gap: 4 },
  heroBadgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  heroStat: { flex: 1, alignItems: 'center', gap: 2 },
  heroStatDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: Colors.border,
  },
  heroStatValue: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  heroStatLabel: {
    fontSize: 11,
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionLabel: { marginBottom: Spacing.sm, marginTop: Spacing.sm },
  section: { gap: Spacing.sm, marginBottom: Spacing.lg },
  labelRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  labelKey: {
    width: 80,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
    paddingTop: 1,
  },
  labelVal: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});
