/**
 * Sentry stub — no-op until a DSN is configured and the package installed.
 * Set EXPO_PUBLIC_SENTRY_DSN in eas.json to activate real monitoring.
 */
export function initialiseSentry(): void {
  // Intentionally empty — @sentry/react-native not installed.
  // Add the package + plugin + DSN to enable.
}
