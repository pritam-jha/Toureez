/**
 * @file app/(admin)/packages/[id].tsx
 * @description Admin package detail — approve, reject, feature, bestseller.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/colors';
import { ModerationToolbar } from '../../../components/admin/ModerationToolbar';
import { ConfirmActionSheet } from '../../../components/dashboard/ConfirmActionSheet';
import {
  useAdminPackage,
  useApprovePackage,
  useRejectPackage,
  useFeaturePackage,
  useDeletePackage,
} from '../../../hooks/admin/useAdminPackages';

type Sheet = 'approve' | 'reject' | null;

function InfoRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoKey}>{label}</Text>
      <Text style={styles.infoVal}>{value}</Text>
    </View>
  );
}

const STATUS_COLOR: Record<string, string> = {
  draft: Colors.textLight,
  pending: Colors.warning,
  active: Colors.success,
  rejected: Colors.error,
};

export default function AdminPackageDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pkgId = id ?? '';
  const [sheet, setSheet] = useState<Sheet>(null);

  const { data: pkg, isLoading, isError } = useAdminPackage(pkgId);
  const approve = useApprovePackage();
  const reject = useRejectPackage();
  const feature = useFeaturePackage();
  const deletePackage = useDeletePackage();

  const isMutating = approve.isPending || reject.isPending || feature.isPending || deletePackage.isPending;

  const handleDelete = () => {
    Alert.alert(
      'Delete Package',
      `Permanently delete "${pkg?.title}"? This cannot be undone. Only draft or rejected packages with no bookings can be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePackage.mutate(pkgId, {
              onSuccess: () => { Alert.alert('Deleted', 'Package has been deleted.'); router.back(); },
              onError: (e) => Alert.alert('Cannot Delete', e.message),
            });
          },
        },
      ],
    );
  };

  if (isLoading) {
    return <SafeAreaView style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></SafeAreaView>;
  }

  if (isError || !pkg) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>Package not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const statusColor = STATUS_COLOR[pkg.status] ?? Colors.textLight;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{pkg.title}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Cover */}
        {pkg.cover_image ? (
          <Image source={{ uri: pkg.cover_image }} style={styles.cover} />
        ) : (
          <View style={styles.coverPlaceholder}><MaterialCommunityIcons name="image-off-outline" size={40} color={Colors.textLight} /></View>
        )}

        {/* Status */}
        <View style={styles.statusRow}>
          <View style={[styles.badge, { backgroundColor: `${statusColor}18` }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{pkg.status.toUpperCase()}</Text>
          </View>
          {pkg.is_featured && <View style={[styles.badge, { backgroundColor: Colors.accentLight }]}><Text style={[styles.badgeText, { color: Colors.accent }]}>★ Featured</Text></View>}
          {pkg.is_bestseller && <View style={[styles.badge, { backgroundColor: Colors.accentLight }]}><Text style={[styles.badgeText, { color: Colors.accent }]}>✦ Bestseller</Text></View>}
        </View>

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package Info</Text>
          <InfoRow label="Title" value={pkg.title} />
          <InfoRow label="Company" value={pkg.company.name} />
          <InfoRow label="Location" value={`${pkg.location.city}, ${pkg.location.state}`} />
          <InfoRow label="Category" value={pkg.category.label} />
          <InfoRow label="Duration" value={`${pkg.duration_days}D / ${pkg.duration_nights}N`} />
          <InfoRow label="Group" value={`${pkg.min_group_size}–${pkg.max_group_size} pax`} />
          <InfoRow label="Rating" value={`★ ${pkg.avg_rating.toFixed(1)} (${pkg.review_count} reviews)`} />
          <InfoRow label="Bookings" value={String(pkg.total_bookings)} />
          <InfoRow label="Created" value={new Date(pkg.created_at).toLocaleDateString('en-IN')} />
        </View>

        {/* Feature toggles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Merchandising</Text>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Featured</Text>
              <Text style={styles.toggleDesc}>Shown on home screen featured section</Text>
            </View>
            <Switch
              value={pkg.is_featured}
              onValueChange={(val) =>
                feature.mutate(
                  { packageId: pkgId, isFeatured: val },
                  { onError: (e) => Alert.alert('Error', e.message) },
                )
              }
              disabled={isMutating}
              trackColor={{ true: Colors.primary, false: Colors.border }}
              thumbColor={Colors.surface}
            />
          </View>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Bestseller</Text>
              <Text style={styles.toggleDesc}>Shows bestseller badge on the card</Text>
            </View>
            <Switch
              value={pkg.is_bestseller}
              onValueChange={(val) =>
                feature.mutate(
                  { packageId: pkgId, isFeatured: pkg.is_featured, isBestseller: val },
                  { onError: (e) => Alert.alert('Error', e.message) },
                )
              }
              disabled={isMutating}
              trackColor={{ true: Colors.accent, false: Colors.border }}
              thumbColor={Colors.surface}
            />
          </View>
        </View>
      </ScrollView>

      <ModerationToolbar
        actions={[
          {
            label: '🗑 Delete',
            variant: 'danger',
            onPress: handleDelete,
            disabled: (pkg.status === 'active' || pkg.status === 'pending') || isMutating,
            loading: deletePackage.isPending,
          },
          {
            label: 'Reject',
            variant: 'warning',
            onPress: () => setSheet('reject'),
            disabled: pkg.status === 'rejected' || pkg.status === 'active' === false && pkg.status !== 'pending' || isMutating,
            loading: reject.isPending,
          },
          {
            label: pkg.status === 'active' ? '✓ Approved' : 'Approve',
            variant: 'success',
            onPress: () => setSheet('approve'),
            disabled: pkg.status === 'active' || isMutating,
            loading: approve.isPending,
          },
        ]}
      />

      <ConfirmActionSheet
        visible={sheet === 'approve'}
        title="Approve Package?"
        description="Package will go live and be visible to travellers."
        confirmLabel="Approve"
        confirmVariant="success"
        onConfirm={(note) => { setSheet(null); approve.mutate({ packageId: pkgId, note }, { onSuccess: () => Alert.alert('Approved', 'Package is now live.'), onError: (e) => Alert.alert('Error', e.message) }); }}
        onCancel={() => setSheet(null)}
        loading={approve.isPending}
      />
      <ConfirmActionSheet
        visible={sheet === 'reject'}
        title="Reject Package"
        description="Please provide a reason. The vendor will be notified."
        confirmLabel="Reject"
        confirmVariant="danger"
        requireReason
        onConfirm={(reason) => { setSheet(null); reject.mutate({ packageId: pkgId, reason: reason! }, { onSuccess: () => Alert.alert('Rejected', 'Package has been rejected.'), onError: (e) => Alert.alert('Error', e.message) }); }}
        onCancel={() => setSheet(null)}
        loading={reject.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 60 },
  backText: { color: Colors.primary, fontSize: 16 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: Colors.text },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  cover: { width: '100%', height: 180, borderRadius: 12 },
  coverPlaceholder: { width: '100%', height: 180, borderRadius: 12, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  statusRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontWeight: '700', fontSize: 11 },
  section: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  infoRow: { flexDirection: 'row', gap: 8 },
  infoKey: { width: 80, fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  infoVal: { flex: 1, fontSize: 13, color: Colors.text },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  toggleDesc: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  errorText: { color: Colors.textSecondary, fontSize: 15 },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 9 },
  retryText: { color: Colors.textWhite, fontWeight: '600', fontSize: 14 },
});
