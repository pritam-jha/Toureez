/**
 * @file app/(admin)/account.tsx
 * @description Admin profile and account screen.
 *
 * Shows the authenticated admin's profile card and provides quick links
 * to Audit Logs, Notifications, and sign-out.
 */

import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontWeight, Radius, Spacing } from '../../constants/theme';
import { useQueryClient } from '@tanstack/react-query';
import { signOut } from '../../lib/api/auth';
import { useAuthStore } from '../../store/authStore';
import { useAdminUnreadCount } from '../../hooks/admin/useAdminNotifications';

// ── Menu row ──────────────────────────────────────────────────────────────────

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface MenuRowProps {
  icon: MCIcon;
  label: string;
  subtitle?: string;
  onPress: () => void;
  badge?: number;
  danger?: boolean;
}

function MenuRow({ icon, label, subtitle, onPress, badge, danger = false }: MenuRowProps): React.ReactElement {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={styles.menuRow}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={danger ? Colors.error : Colors.primary}
        />
      </View>
      <View style={styles.menuText}>
        <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
        {subtitle != null && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.menuRight}>
        {badge != null && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
        {!danger && (
          <Text style={styles.chevron}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

interface MenuSectionProps {
  title: string;
  children: React.ReactNode;
}

function MenuSection({ title, children }: MenuSectionProps): React.ReactElement {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>
        {children}
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AdminAccountScreen(): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);
  const unreadCount = useAdminUnreadCount();
  const queryClient = useQueryClient();

  const initials = (user?.full_name ?? 'Admin')
    .split(' ')
    .map((n) => n[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSignOut = (): void => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of the admin portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            // Sign out then explicitly clear local state and navigate.
            // Not relying solely on onAuthStateChange in _layout.tsx to
            // handle navigation — that callback is async and can miss the
            // navigation call due to timing.
            void signOut()
              .catch(() => {
                // If Supabase sign-out fails (e.g. already expired), proceed anyway.
              })
              .finally(() => {
                clearUser();
                queryClient.clear();
                router.replace('/(auth)/login');
              });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile card ── */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.full_name ?? 'Admin'}</Text>
            <View style={styles.roleBadge}>
              <MaterialCommunityIcons name="shield-check" size={11} color={Colors.primary} />
              <Text style={styles.roleText}>Administrator</Text>
            </View>
          </View>
        </View>

        {/* ── Admin tools ── */}
        <MenuSection title="Admin Tools">
          <MenuRow
            icon="bell-outline"
            label="Notifications"
            subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            badge={unreadCount}
            onPress={() => router.push('/(admin)/notifications' as never)}
          />
          <View style={styles.separator} />
          <MenuRow
            icon="clipboard-text-outline"
            label="Audit Logs"
            subtitle="Read-only activity trail"
            onPress={() => router.push('/(admin)/audit-logs')}
          />
        </MenuSection>

        {/* ── Quick links ── */}
        <MenuSection title="Manage">
          <MenuRow
            icon="account-group"
            label="Users"
            onPress={() => router.push('/(admin)/users')}
          />
          <View style={styles.separator} />
          <MenuRow
            icon="office-building"
            label="Vendors"
            onPress={() => router.push('/(admin)/vendors')}
          />
          <View style={styles.separator} />
          <MenuRow
            icon="package-variant"
            label="Packages"
            onPress={() => router.push('/(admin)/packages')}
          />
        </MenuSection>

        {/* ── Sign out ── */}
        <MenuSection title="Session">
          <MenuRow
            icon="logout"
            label="Sign Out"
            onPress={handleSignOut}
            danger
          />
        </MenuSection>

        <Text style={styles.version}>NEXTTRP Admin Portal</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 60 },
  backText: { color: Colors.primary, fontSize: 16 },
  headerTitle: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxxl,
    gap: 0,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xxl,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: FontWeight.extrabold,
    color: Colors.textWhite,
  },
  profileInfo: { flex: 1, gap: 6 },
  profileName: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  roleText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryUltraLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: {
    backgroundColor: Colors.errorLight,
  },
  menuText: { flex: 1 },
  menuLabel: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  menuLabelDanger: { color: Colors.error },
  menuSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  chevron: {
    fontSize: 18,
    color: Colors.textLight,
    fontWeight: FontWeight.bold,
  },
  badge: {
    backgroundColor: Colors.error,
    borderRadius: 8,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: Colors.textWhite,
    fontSize: 10,
    fontWeight: FontWeight.extrabold,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.lg,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textLight,
    marginTop: Spacing.md,
  },
});
