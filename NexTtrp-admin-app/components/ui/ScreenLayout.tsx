/**
 * @file components/ui/ScreenLayout.tsx
 * Top-level admin screen wrapper with safe-area handling, a consistent header,
 * loading/error states, optional scrolling, and optional fixed footer actions.
 */

import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import {
  FontWeight,
  Layout,
  Radius,
  Spacing,
  ZIndex,
} from '../../constants/theme';
import { Button } from './Button';

interface ScreenLayoutProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  headerRight?: React.ReactNode;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentPadding?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  background?: string;
  maxContentWidth?: number | false;
}

export function ScreenLayout({
  title,
  subtitle,
  onBack,
  headerRight,
  loading = false,
  error,
  onRetry,
  scrollable = true,
  refreshing = false,
  onRefresh,
  contentPadding = true,
  children,
  footer,
  background = Colors.background,
  maxContentWidth = Layout.maxContentWidth,
}: ScreenLayoutProps): React.ReactElement {
  const { width } = useWindowDimensions();
  const hasError = error !== undefined && error.length > 0;
  const isWide = width >= 900;

  function renderState(message: string, isErrorState = false) {
    return (
      <View style={styles.center}>
        {isErrorState ? (
          <View style={styles.errorMark}>
            <Text style={styles.errorMarkText}>!</Text>
          </View>
        ) : (
          <ActivityIndicator size="large" color={Colors.primary} />
        )}
        <Text style={isErrorState ? styles.errorTitle : styles.loadingText}>
          {isErrorState ? 'Something went wrong' : 'Loading...'}
        </Text>
        {isErrorState && <Text style={styles.errorText}>{message}</Text>}
        {isErrorState && onRetry !== undefined && (
          <View style={styles.retryWrap}>
            <Button variant="primary" size="md" onPress={onRetry}>
              Try Again
            </Button>
          </View>
        )}
      </View>
    );
  }

  function renderBody() {
    if (loading) return renderState('Loading...');
    if (hasError) return renderState(error ?? 'Unable to load this screen.', true);

    if (scrollable) {
      return (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh !== undefined ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            ) : undefined
          }
        >
          <View
            style={[
              styles.contentShell,
              maxContentWidth !== false && { maxWidth: maxContentWidth },
              contentPadding && styles.contentPadding,
            ]}
          >
            {children}
          </View>
        </ScrollView>
      );
    }

    return (
      <View style={[styles.flat, contentPadding && styles.contentPadding]}>
        {children}
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.safe, { backgroundColor: background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
      >
        <View style={styles.header}>
          <View style={[styles.headerInner, isWide && styles.headerInnerWide]}>
            <View style={styles.headerSide}>
              {onBack !== undefined ? (
                <TouchableOpacity
                  onPress={onBack}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.backBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <Text style={styles.backChevron}>{'<'}</Text>
                  <Text style={styles.backLabel}>Back</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.headerCenter}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              {subtitle !== undefined && (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>

            <View style={[styles.headerSide, styles.headerRight]}>
              {headerRight}
            </View>
          </View>
        </View>

        <View style={styles.body}>{renderBody()}</View>

        {footer !== undefined && !loading && !hasError ? (
          <View style={styles.footer}>{footer}</View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  kav: { flex: 1 },
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: ZIndex.sticky,
  },
  headerInner: {
    minHeight: Layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    alignSelf: 'center',
    width: '100%',
  },
  headerInnerWide: {
    maxWidth: Layout.maxContentWidth + Spacing.xxxl,
  },
  headerSide: {
    width: 82,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: { justifyContent: 'flex-end' },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    minWidth: 0,
  },
  backBtn: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.sm,
  },
  backChevron: {
    fontSize: 25,
    lineHeight: 26,
    color: Colors.primary,
    marginRight: 2,
  },
  backLabel: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  title: {
    fontSize: 17,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  body: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: Spacing.xxxl,
  },
  contentShell: {
    width: '100%',
  },
  flat: { flex: 1 },
  contentPadding: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  errorMark: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: Colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  errorMarkText: {
    color: Colors.error,
    fontSize: 22,
    fontWeight: FontWeight.extrabold,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 360,
  },
  retryWrap: { marginTop: Spacing.lg },
  footer: {
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
});
