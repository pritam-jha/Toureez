/**
 * @file components/common/Header.tsx
 * @description Toureez light header.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Shadows } from '../../constants/shadows';

export interface HeaderAction {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  accessibilityLabel: string;
}

export interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: HeaderAction[];
  style?: ViewStyle;
  showLogo?: boolean;
  logoText?: string;
}

const HIT_SLOP = {
  bottom: 8,
  left: 8,
  right: 8,
  top: 8,
};

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  onBack,
  actions = [],
  style,
  showLogo = false,
  logoText = 'Toureez',
}) => {
  const handleBack = (): void => {
    if (onBack) {
      onBack();
      return;
    }
    router.back();
  };

  return (
    <View style={[styles.header, style]}>
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity
            style={[styles.circleButton, Shadows.soft]}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={HIT_SLOP}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.navy} />
          </TouchableOpacity>
        ) : showLogo ? (
          <Text style={styles.logo}>{logoText}</Text>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={styles.titlePlaceholder} />
      )}

      <View style={styles.right}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.accessibilityLabel}
            style={[styles.circleButton, Shadows.soft]}
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel}
            hitSlop={HIT_SLOP}
          >
            <Ionicons name={action.icon} size={20} color={Colors.navy} />
          </TouchableOpacity>
        ))}
        {actions.length === 0 ? <View style={styles.placeholder} /> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  left: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: 52,
  },
  right: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    minWidth: 52,
  },
  circleButton: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  title: {
    color: Colors.navy,
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    marginHorizontal: 8,
    textAlign: 'center',
  },
  titlePlaceholder: {
    flex: 1,
  },
  logo: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  placeholder: {
    width: 36,
  },
});
