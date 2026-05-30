/**
 * @file components/ErrorBoundary.tsx
 * @description Root error boundary for the traveller app.
 *
 * Catches render-time exceptions that propagate from any screen or component
 * and shows a recoverable fallback UI instead of a blank white screen.
 *
 * Usage — wrap the root Stack in app/_layout.tsx:
 *   <ErrorBoundary>
 *     <Stack ... />
 *   </ErrorBoundary>
 */

import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

let reloadAsync: (() => Promise<void>) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Updates = require('expo-updates') as { reloadAsync: () => Promise<void> };
  reloadAsync = Updates.reloadAsync;
} catch {
  // expo-updates not present (Expo Go) — Restart App button is hidden.
}

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    if (__DEV__) {
      // In production, forward to your error monitoring service (Sentry etc.)
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary] Uncaught render error:', error);
      // eslint-disable-next-line no-console
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
          <View style={styles.iconWrap}>
            <Text style={styles.iconText}>⚠️</Text>
          </View>

          <Text style={styles.heading}>Something went wrong</Text>
          <Text style={styles.subheading}>
            NEXTTRP ran into an unexpected problem. Your data is safe.
          </Text>

          <View style={styles.messageBox}>
            <Text style={styles.messageLabel}>Error details</Text>
            <Text style={styles.messageText} selectable>
              {message}
            </Text>
          </View>

          {showStack && (
            <View style={styles.stackBox}>
              <Text style={styles.stackText} selectable>
                {error!.stack}
              </Text>
            </View>
          )}

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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F0' },
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
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: { fontSize: 32 },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    color: '#5C5C7A',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 320,
  },
  messageBox: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  messageLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  messageText: {
    fontSize: 13,
    color: '#DC2626',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    lineHeight: 18,
  },
  stackBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    maxHeight: 180,
  },
  stackText: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    lineHeight: 15,
  },
  actions: { width: '100%', gap: 12, marginTop: 8 },
  primaryBtn: {
    backgroundColor: '#E8631A',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    backgroundColor: '#FEF0E8',
    borderWidth: 1,
    borderColor: '#E8631A',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#E8631A', fontWeight: '700', fontSize: 15 },
});
