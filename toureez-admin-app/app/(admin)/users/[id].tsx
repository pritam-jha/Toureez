/**
 * @file app/(admin)/users/[id].tsx
 * @description Admin user detail with role management.
 */

import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/colors';
import { AdminUserRolePicker } from '../../../components/admin/AdminUserRolePicker';
import { ConfirmActionSheet } from '../../../components/dashboard/ConfirmActionSheet';
import { useAdminUser, useUpdateUserRole } from '../../../hooks/admin/useAdminUsers';
import { useAuthStore } from '../../../store/authStore';
import { deleteAdminUser } from '../../../lib/api/admin';
import type { UserRole } from '../../../types';

function InfoRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoKey}>{label}</Text>
      <Text style={styles.infoVal}>{value}</Text>
    </View>
  );
}

export default function AdminUserDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = id ?? '';
  const currentAdminId = useAuthStore((s) => s.user?.id);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [confirmSheet, setConfirmSheet] = useState(false);

  const { data: user, isLoading, isError } = useAdminUser(userId);
  const updateRole = useUpdateUserRole();

  const isOwnAccount = userId === currentAdminId;

  if (isLoading) return <SafeAreaView style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></SafeAreaView>;
  if (isError || !user) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}><Text style={styles.retryText}>Go Back</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleRoleSelect = (role: UserRole) => {
    if (role === user.role) return;
    setPendingRole(role);
    setConfirmSheet(true);
  };

  const handleConfirmRole = () => {
    if (!pendingRole) return;
    setConfirmSheet(false);
    updateRole.mutate(
      { userId, role: pendingRole },
      {
        onSuccess: () => Alert.alert('Role Updated', `User role changed to ${pendingRole}.`),
        onError: (e) => Alert.alert('Error', e.message),
      },
    );
    setPendingRole(null);
  };

  const handleDeleteUser = () => {
    Alert.alert(
      'Delete User',
      `Permanently delete ${user?.full_name ?? 'this user'}? This cancels all their bookings and removes their account. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteAdminUser(userId).then((res) => {
              if (res.error) { Alert.alert('Error', res.error); return; }
              Alert.alert('Deleted', 'User account has been removed.');
              router.back();
            });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>‹ Back</Text></TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{user.full_name ?? 'User'}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isOwnAccount && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>⚠️ You cannot change your own role.</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <InfoRow label="Name" value={user.full_name ?? '—'} />
          <InfoRow label="Email" value={user.email ?? '—'} />
          <InfoRow label="Phone" value={user.phone ?? '—'} />
          <InfoRow label="City" value={user.city ?? '—'} />
          <InfoRow label="State" value={user.state ?? '—'} />
          <InfoRow label="Bookings" value={String(user.booking_count ?? 0)} />
          <InfoRow label="Joined" value={new Date(user.created_at).toLocaleDateString('en-IN')} />
        </View>

        <AdminUserRolePicker
          currentRole={user.role}
          onSelect={handleRoleSelect}
          disabled={isOwnAccount || updateRole.isPending}
          loading={updateRole.isPending}
        />

        {/* Delete user — hidden for admins editing their own account */}
        {!isOwnAccount && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDeleteUser}
            activeOpacity={0.82}
            accessibilityRole="button"
          >
            <Text style={styles.deleteBtnText}>🗑 Delete User Account</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ConfirmActionSheet
        visible={confirmSheet}
        title="Change User Role?"
        description={`This will change the user's role to "${pendingRole}". This affects their access level immediately.`}
        confirmLabel="Change Role"
        confirmVariant="primary"
        onConfirm={handleConfirmRole}
        onCancel={() => { setConfirmSheet(false); setPendingRole(null); }}
        loading={updateRole.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  deleteBtn: { backgroundColor: Colors.errorLight, borderRadius: 10, marginHorizontal: 16, marginTop: 8, marginBottom: 32, padding: 14, alignItems: 'center' },
  deleteBtnText: { color: Colors.error, fontSize: 15, fontWeight: '700' },
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 60 },
  backText: { color: Colors.primary, fontSize: 16 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: Colors.text },
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  warningBanner: { backgroundColor: Colors.warningLight, borderRadius: 10, padding: 12 },
  warningText: { color: Colors.warning, fontSize: 13, fontWeight: '500' },
  section: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  infoRow: { flexDirection: 'row', gap: 8 },
  infoKey: { width: 72, fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  infoVal: { flex: 1, fontSize: 13, color: Colors.text },
  errorText: { color: Colors.textSecondary, fontSize: 15 },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 9 },
  retryText: { color: Colors.textWhite, fontWeight: '600', fontSize: 14 },
});
