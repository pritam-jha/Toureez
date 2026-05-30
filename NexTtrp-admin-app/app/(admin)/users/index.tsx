/**
 * @file app/(admin)/users/index.tsx
 * Admin user management list.
 */

import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { FontWeight, Radius, Spacing } from '../../../constants/theme';
import { StatusFilterTabs } from '../../../components/dashboard/StatusFilterTabs';
import { ScreenLayout } from '../../../components/ui/ScreenLayout';
import { SearchBar } from '../../../components/ui/SearchBar';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Caption } from '../../../components/ui/Typography';
import { useAdminUsers } from '../../../hooks/admin/useAdminUsers';
import type { AdminUser } from '../../../types/admin';
import type { UserRole } from '../../../types';

type RoleFilter = UserRole | 'all';

const ROLE_TABS = [
  { label: 'All', value: 'all' as const },
  { label: 'Travelers', value: 'traveler' as UserRole },
  { label: 'Vendors', value: 'company_owner' as UserRole },
  { label: 'Admins', value: 'admin' as UserRole },
];

const ROLE_COLOR: Record<string, string> = {
  traveler: Colors.secondary,
  company_owner: Colors.primary,
  admin: Colors.navy,
};

const ROLE_LABEL: Record<string, string> = {
  traveler: 'Traveler',
  company_owner: 'Vendor',
  admin: 'Admin',
};

function UserRow({ user }: { user: AdminUser }): React.ReactElement {
  const roleColor = ROLE_COLOR[user.role] ?? Colors.textLight;
  const location = [user.city, user.state].filter(Boolean).join(', ') || 'Location not set';

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/(admin)/users/${user.id}`)}
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityLabel={`Open ${user.full_name ?? 'user'} profile`}
    >
      <View style={[styles.avatar, { backgroundColor: `${roleColor}18` }]}>
        <Text style={[styles.avatarText, { color: roleColor }]}>
          {(user.full_name ?? 'U').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.rowMeta}>
        <Text style={styles.rowName} numberOfLines={1}>
          {user.full_name ?? 'No name'}
        </Text>
        <Text style={styles.rowSub} numberOfLines={1}>{location}</Text>
        <Text style={styles.rowDate}>
          Joined {new Date(user.created_at).toLocaleDateString('en-IN')}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Badge status={user.role} label={ROLE_LABEL[user.role] ?? user.role} size="sm" />
        <Text style={styles.chevron}>{'>'}</Text>
      </View>
    </TouchableOpacity>
  );
}

function ItemSeparator(): React.ReactElement {
  return <View style={styles.separator} />;
}

export default function AdminUsersScreen(): React.ReactElement {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch } = useAdminUsers({
    role: roleFilter === 'all' ? undefined : roleFilter,
    search: search.trim() || undefined,
    limit: 30,
  });

  const items = data?.items ?? [];

  return (
    <ScreenLayout
      title="Users"
      subtitle={data ? `${data.total} total` : undefined}
      onBack={() => router.back()}
      scrollable={false}
      contentPadding={false}
      loading={isLoading && items.length === 0}
      error={isError ? (error?.message ?? 'Failed to load users') : undefined}
      onRetry={() => void refetch()}
    >
      <View style={styles.toolbar}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or phone"
        />
      </View>

      <StatusFilterTabs tabs={ROLE_TABS} selected={roleFilter} onSelect={setRoleFilter} />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <UserRow user={item} />}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={
          <EmptyState
            icon="!"
            title="No users found"
            subtitle={search ? 'Try a different search term or role filter.' : 'Users will appear here once accounts exist.'}
          />
        }
        ListFooterComponent={
          data && items.length > 0 ? (
            <View style={styles.footer}>
              <Caption color={Colors.textLight} align="center">
                {data.total} {data.total === 1 ? 'user' : 'users'} total
              </Caption>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  listContent: {
    flexGrow: 1,
    backgroundColor: Colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 76,
    gap: Spacing.md,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: FontWeight.bold,
  },
  rowMeta: { flex: 1, minWidth: 0, gap: 2 },
  rowName: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  rowSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rowDate: {
    fontSize: 11,
    color: Colors.textLight,
  },
  rowRight: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chevron: {
    fontSize: 17,
    color: Colors.textLight,
    fontWeight: FontWeight.bold,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
    marginLeft: Spacing.lg + 42 + Spacing.md,
  },
  footer: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
});
