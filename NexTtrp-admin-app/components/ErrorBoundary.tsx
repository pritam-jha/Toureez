/**
 * @file components/ErrorBoundary.tsx
 * @description Root error boundary for the admin app.
 *
 * Catches any render-time exception that propagates up from a screen or
 * component and shows a friendly recovery UI instead of a blank white screen.
 *
 * Usage — wrap the root Stack in app/_layout.tsx:
 *   <ErrorBoundary>
 *     <Stack ... />
 *   </ErrorBoundary>
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// expo-updates may not be installed in every environment (e.g. Expo Go).
// Import it lazily so the boundary itself never crashes on missing module.
let reloadAsync: (() => Promise<void>) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Updates = require('expo-updates') as { reloadAsync: () => Promise<void> };
  reloadAsync = Updates.reloadAsync;
} catch {
  // expo-updates not present — Restart App button will be hidden.
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Log the full stack in development; in production ship to your
    // error-monitoring service (Sentry, Bugsnag, etc.) here.
    if (__DEV__) {
      console.error('[ErrorBoundary] Uncaught render error:', error);
      console.error('[ErrorBoundary] Component stack:', info.componentStack);
    }
  }

  private handleTryAgain = (): void => {
    this.setState({ hasError: false, error: null });
  };

  private handleRestart = (): void => {
    if (reloadAsync) {
      void reloadAsync();
    }
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error } = this.state;
    const message = error?.message ?? 'An unexpected error occurred.';
    const showStack = __DEV__ && error?.stack != null;

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={styles.iconWrap}>
            <Text style={styles.iconText}>⚠️</Text>
          </View>

          {/* Heading */}
          <Text style={styles.heading}>Something went wrong</Text>
          <Text style={styles.subheading}>
            The app ran into an unexpected problem. Your data is safe.
          </Text>

          {/* Error message */}
          <View style={styles.messageBox}>
            <Text style={styles.messageLabel}>Error details</Text>
            <Text style={styles.messageText} selectable>
              {message}
            </Text>
          </View>

          {/* Stack trace (dev only) */}
          {showStack && (
            <View style={styles.stackBox}>
              <Text style={styles.stackText} selectable>
                {error!.stack}
              </Text>
            </View>
          )}

          {/* Recovery actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={this.handleTryAgain}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel="Try rendering the screen again"
            >
              <Text style={styles.primaryBtnText}>Try Again</Text>
            </TouchableOpacity>

            {reloadAsync !== null && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={this.handleRestart}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel="Fully restart the application"
              >
                <Text style={styles.secondaryBtnText}>Restart App</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const COLORS = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  textSecondary: '#6B7280',
  error: '#DC2626',
  errorLight: '#FEF2F2',
  primary: '#1D4ED8',
  primaryLight: '#EFF6FF',
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 32,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 320,
  },
  messageBox: {
    width: '100%',
    backgroundColor: COLORS.errorLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  messageLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.error,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  messageText: {
    fontSize: 13,
    color: COLORS.error,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    lineHeight: 18,
  },
  stackBox: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    maxHeight: 180,
  },
  stackText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    lineHeight: 15,
  },
  actions: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryBtn: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});
