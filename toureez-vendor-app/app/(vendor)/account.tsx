/**
 * @file app/(vendor)/account.tsx
 * @description Account tab — user profile, company info, and navigation to
 * company, reviews, payouts, settings, and notifications.
 *
 * Also shows the count of unread notifications as a badge.
 */

import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '../../store/authStore';
import { useVendorCompany } from '../../hooks/useVendorCompany';
import { useUnreadNotificationCount } from '../../hooks/useVendorNotifications';
import { useUnreadEnquiryCount } from '../../hooks/useVendorEnquiries';
import { signOut } from '../../lib/api/auth';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';

// ── Menu row ──────────────────────────────────────────────────────────────────

interface MenuRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
  iconColor?: string;
  iconBg?: string;
  badge?: number;
  danger?: boolean;
  showChevron?: boolean;
}

function MenuRow({
  icon,
  label,
  subtitle,
  onPress,
  iconColor = Colors.primary,
  iconBg = Colors.primaryLight,
  badge,
  danger = false,
  showChevron = true,
}: MenuRowProps): React.ReactElement {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={[styles.menuIconBg, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.menuText}>
        <Text style={[styles.menuLabel, danger && styles.dangerText]}>{label}</Text>
        {subtitle != null && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.menuRight}>
        {badge != null && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
        {showChevron && (
          <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
        )}
      </View>
    </Pressable>
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
      <View style={[styles.sectionCard, Shadows.sm]}>
        {children}
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AccountScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { data: company } = useVendorCompany();
  const unreadCount = useUnreadNotificationCount();
  const unreadEnquiryCount = useUnreadEnquiryCount();

  const handleSignOut = (): void => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of the vendor portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => { void signOut(); },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={[styles.scroll, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Profile card ─────────────────────────────────────────────── */}
      <View style={[styles.profileCard, Shadows.card]}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarInitials}>
            {user?.full_name
              ? user.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
              : 'V'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.full_name ?? 'Vendor'}</Text>
          <View style={styles.roleRow}>
            <View style={styles.roleBadge}>
              <Ionicons name="briefcase" size={10} color={Colors.primary} />
              <Text style={styles.roleText}>Vendor</Text>
            </View>
          </View>
        </View>
        <Pressable
          style={styles.settingsBtn}
          onPress={() => router.push({ pathname: '/(vendor)/settings', params: { from: 'account' } })}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <Ionicons name="settings-outline" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {/* ── Approval status banner (only shown when NOT yet approved) ── */}
      {company != null && !company.is_verified && (
        <Pressable
          style={[
            styles.approvalBanner,
            { backgroundColor: company.status === 'rejected' ? Colors.errorLight : Colors.warningLight },
          ]}
          onPress={() => router.push({ pathname: '/(vendor)/company', params: { from: 'account' } })}
        >
          <Ionicons
            name={company.status === 'rejected' ? 'close-circle-outline' : 'time-outline'}
            size={18}
            color={company.status === 'rejected' ? Colors.error : Colors.warning}
          />
          <Text style={[styles.approvalText, { color: company.status === 'rejected' ? Colors.error : Colors.warning }]}>
            {company.status === 'rejected'
              ? 'Company rejected — tap to view details and resubmit'
              : 'Company approval pending — tap to check KYC status'}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={company.status === 'rejected' ? Colors.error : Colors.warning} />
        </Pressable>
      )}

      {/* ── My Business ──────────────────────────────────────────────── */}
      <MenuSection title="My Business">
        <MenuRow
          icon="business-outline"
          label="Company Profile"
          subtitle="Edit details, logo, and documents"
          onPress={() => router.push({ pathname: '/(vendor)/company', params: { from: 'account' } })}
        />
        <View style={styles.separator} />
        <MenuRow
          icon="bar-chart-outline"
          label="Analytics"
          subtitle="Revenue charts and performance"
          onPress={() => router.push({ pathname: '/(vendor)/analytics', params: { from: 'account' } })}
          iconColor={Colors.secondary}
          iconBg={Colors.secondaryLight}
        />
        <View style={styles.separator} />
        <MenuRow
          icon="chatbubbles-outline"
          label="Enquiries"
          subtitle="Reply to traveler questions"
          badge={unreadEnquiryCount}
          onPress={() => router.push({ pathname: '/(vendor)/enquiries', params: { from: 'account' } })}
          iconColor={Colors.info}
          iconBg={Colors.infoLight}
        />
        <View style={styles.separator} />
        <MenuRow
          icon="star-outline"
          label="Reviews"
          subtitle="Read feedback from your travelers"
          onPress={() => router.push({ pathname: '/(vendor)/reviews', params: { from: 'account' } })}
          iconColor={Colors.star}
          iconBg={Colors.accentLight}
        />
        <View style={styles.separator} />
        <MenuRow
          icon="wallet-outline"
          label="Payouts"
          subtitle="Payout history and bank accounts"
          onPress={() => router.push({ pathname: '/(vendor)/payouts', params: { from: 'account' } })}
          iconColor={Colors.success}
          iconBg={Colors.successLight}
        />
      </MenuSection>

      {/* ── App ──────────────────────────────────────────────────────── */}
      <MenuSection title="App">
        <MenuRow
          icon="notifications-outline"
          label="Notifications"
          subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          badge={unreadCount}
          onPress={() => router.push({ pathname: '/(vendor)/notifications', params: { from: 'account' } })}
          iconColor={Colors.secondary}
          iconBg={Colors.secondaryLight}
        />
        <View style={styles.separator} />
        <MenuRow
          icon="settings-outline"
          label="Settings"
          subtitle="Profile, password, preferences"
          onPress={() => router.push({ pathname: '/(vendor)/settings', params: { from: 'account' } })}
          iconColor={Colors.navyLight}
          iconBg={Colors.borderLight}
        />
        <View style={styles.separator} />
        <MenuRow
          icon="help-circle-outline"
          label="Help & Support"
          subtitle="FAQs, contact Toureez team"
          onPress={() => Alert.alert('Help & Support', 'Please email support@toureez.com for assistance.')}
          iconColor={Colors.info}
          iconBg={Colors.infoLight}
        />
      </MenuSection>

      {/* ── Sign out ─────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={[styles.sectionCard, Shadows.sm]}>
          <MenuRow
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleSignOut}
            iconColor={Colors.error}
            iconBg={Colors.errorLight}
            danger
            showChevron={false}
          />
        </View>
      </View>

      {/* ── App version ──────────────────────────────────────────────── */}
      <Text style={styles.version}>Toureez Vendor Portal</Text>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 0,
  },
  profileCard: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 12,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textWhite,
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.navy,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  approvalText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textLight,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuIconBg: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { flex: 1 },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.navy,
  },
  menuSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    fontWeight: '800',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 16,
  },
  dangerText: {
    color: Colors.error,
  },
  pressed: { opacity: 0.7 },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 8,
    marginBottom: 8,
  },
});
