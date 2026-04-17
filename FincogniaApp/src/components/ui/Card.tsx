/**
 * Card Component
 * Standard, Elevated, and Glass variants
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, cardStyles, borderRadius, shadows, spacing } from '../../constants/designTokens';

type CardVariant = 'standard' | 'elevated' | 'glass';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
}

export default function Card({ children, variant = 'standard', style }: CardProps) {
  const isElevated = variant === 'elevated';
  const isGlass = variant === 'glass';

  return (
    <View
      style={[
        styles.card,
        isElevated && styles.elevated,
        isGlass && styles.glass,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: cardStyles.standard.borderRadius,
    padding: cardStyles.standard.padding,
    ...shadows.medium,
  },
  elevated: {
    borderRadius: cardStyles.elevated.borderRadius,
    ...shadows.large,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: cardStyles.glass.borderRadius,
    ...shadows.medium,
    // Note: Backdrop blur requires additional native module setup
  },
});

