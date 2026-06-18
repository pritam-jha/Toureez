/**
 * @file components/dashboard/DashboardShell.tsx
 * @description Layout shell shared by admin and vendor dashboards.
 *
 * Provides:
 * - SafeAreaView wrapper
 * - Scrollable content area
 * - Sticky header with title and optional right action
 * - Pull-to-refresh
 * - Loading / error / empty states
 */

import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';

export interface DashboardShellProps {
  title: string;
  subtitle?: string;
  /** Optional element rendered to the right of the title (e.g. a settings icon) */
  headerRight?: React.ReactNode;
  /** Page-level loading — shows a full-screen spinner */
  loading?: boolean;
  /** Non-blocking refresh (pull-to-refresh in progress) */
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Error state message */
  error?: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function DashboardShell({
  title,
  subtitle,
  headerRight,
  loading = false,
  refreshing = false,
  onRefresh,
  error,
  onRetry,
  children,
}: DashboardShellProps): React.ReactElement {
  return (
    <SafeAreaView style={styles.safe}>
      {/* Sticky header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle !== undefined && (
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          )}
        </View>
        {headerRight !== undefined && (
          <View style={styles.headerRight}>{headerRight}</View>
        )}
      </View>

      {/* Full-screen loading */}
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : error !== null && error !== undefined ? (
        /* Error state */
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          {onRetry !== undefined && (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        /* Main scrollable content */
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh !== undefined ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    marginLeft: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  errorEmoji: {
    fontSize: 36,
  },
  errorText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: {
    color: Colors.textWhite,
    fontWeight: '600',
    fontSize: 14,
  },
});
