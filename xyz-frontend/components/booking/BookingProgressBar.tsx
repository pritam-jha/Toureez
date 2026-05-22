/**
 * @file components/booking/BookingProgressBar.tsx
 * @description Step indicator for the 4-step booking flow.
 *
 * Renders numbered circles connected by lines.
 * Completed steps show a checkmark; the active step is highlighted in primary.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BookingProgressBarProps {
  currentStep: 1 | 2 | 3 | 4;
}

const STEPS = [
  { number: 1, label: 'Details' },
  { number: 2, label: 'Summary' },
  { number: 3, label: 'Payment' },
  { number: 4, label: 'Confirm' },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export function BookingProgressBar({
  currentStep,
}: BookingProgressBarProps): React.ReactElement {
  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${currentStep} of ${STEPS.length}`}
      accessibilityValue={{ min: 1, max: STEPS.length, now: currentStep }}
    >
      {STEPS.map((step, index) => {
        const isCompleted = step.number < currentStep;
        const isActive = step.number === currentStep;
        const isLast = index === STEPS.length - 1;

        return (
          <React.Fragment key={step.number}>
            {/* Step node */}
            <View style={styles.stepWrapper}>
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.circleCompleted,
                  isActive && styles.circleActive,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={12} color={Colors.white} />
                ) : (
                  <Text
                    style={[
                      styles.circleText,
                      isActive && styles.circleTextActive,
                    ]}
                  >
                    {step.number}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  isActive && styles.labelActive,
                  isCompleted && styles.labelCompleted,
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>

            {/* Connector line between steps */}
            {!isLast && (
              <View
                style={[
                  styles.connector,
                  isCompleted && styles.connectorCompleted,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const CIRCLE_SIZE = 28;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surfacePrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  stepWrapper: {
    alignItems: 'center',
    width: 52,
  },
  circle: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundLayer2,
    borderRadius: CIRCLE_SIZE / 2,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    width: CIRCLE_SIZE,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorderStrong,
  },
  circleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.30,
    shadowRadius: 8,
    elevation: 5,
  },
  circleCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  circleText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  circleTextActive: {
    color: Colors.white,
  },
  label: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  labelCompleted: {
    color: Colors.success,
  },
  connector: {
    backgroundColor: Colors.backgroundLayer2,
    flex: 1,
    height: 2,
    marginBottom: 18,
  },
  connectorCompleted: {
    backgroundColor: Colors.success,
  },
});
