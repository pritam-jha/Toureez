/**
 * @file components/ui/Typography.tsx
 * @description Typography primitives — strict, themeable Text wrappers.
 *
 * Each primitive renders a React Native Text with the matching variant
 * from `theme.typography`. All primitives forward refs and accept the
 * full Text prop surface.
 *
 *   <H1>Dashboard</H1>
 *   <Body color={Colors.textSecondary}>Welcome back</Body>
 */

import React, { forwardRef } from 'react';
import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { TypographyVariants } from '../../constants/theme';

type Variant = keyof typeof TypographyVariants;

interface TypographyProps extends TextProps {
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  uppercase?: boolean;
  style?: TextStyle | TextStyle[];
}

function makeTypography(variant: Variant, defaultColor: string = Colors.text) {
  const variantStyle = TypographyVariants[variant] as TextStyle;
  const Component = forwardRef<Text, TypographyProps>(function TypographyComponent(
    { color, align, uppercase, style, children, ...rest },
    ref,
  ) {
    return (
      <Text
        ref={ref}
        {...rest}
        style={[
          variantStyle,
          { color: color ?? defaultColor },
          align !== undefined && { textAlign: align },
          uppercase === true && styles.uppercase,
          style,
        ]}
      >
        {children}
      </Text>
    );
  });
  Component.displayName = `Typography(${variant})`;
  return Component;
}

export const Display = makeTypography('display');
export const H1 = makeTypography('h1');
export const H2 = makeTypography('h2');
export const H3 = makeTypography('h3');
export const H4 = makeTypography('h4');
export const Body = makeTypography('body');
export const BodySm = makeTypography('bodySm');
export const Caption = makeTypography('caption', Colors.textSecondary);
export const Label = makeTypography('label', Colors.textSecondary);
export const Mono = makeTypography('mono');

const styles = StyleSheet.create({
  uppercase: { textTransform: 'uppercase' },
});
