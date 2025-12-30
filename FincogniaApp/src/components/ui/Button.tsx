/**
 * Button Component
 * Primary, Secondary, and Text button variants
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, typography, buttonStyles, borderRadius, shadows } from '../../constants/designTokens';

type ButtonVariant = 'primary' | 'secondary' | 'text';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isText = variant === 'text';

  if (isPrimary) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[
          styles.primaryButton,
          disabled && styles.disabled,
        ]}>
        <LinearGradient
          colors={[colors.primary.blue, colors.accent.cyan]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}>
          {loading ? (
            <ActivityIndicator color={colors.neutral.white} />
          ) : (
            <Text style={styles.primaryText}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (isSecondary) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[
          styles.secondaryButton,
          disabled && styles.disabled,
        ]}>
        {loading ? (
          <ActivityIndicator color={colors.primary.blue} />
        ) : (
          <Text style={styles.secondaryText}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.textButton, disabled && styles.disabled]}>
      {loading ? (
        <ActivityIndicator color={colors.primary.blue} />
      ) : (
        <Text style={styles.textButtonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    minHeight: buttonStyles.primary.minHeight,
    borderRadius: buttonStyles.primary.borderRadius,
    ...shadows.medium,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: buttonStyles.primary.paddingHorizontal,
    paddingVertical: buttonStyles.primary.paddingVertical,
    borderRadius: buttonStyles.primary.borderRadius,
  },
  primaryText: {
    fontSize: buttonStyles.primary.fontSize,
    fontWeight: buttonStyles.primary.fontWeight,
    color: colors.neutral.white,
  },
  secondaryButton: {
    minHeight: buttonStyles.primary.minHeight,
    borderRadius: buttonStyles.secondary.borderRadius,
    backgroundColor: colors.neutral.lightGray,
    paddingHorizontal: buttonStyles.primary.paddingHorizontal,
    paddingVertical: buttonStyles.primary.paddingVertical,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  secondaryText: {
    fontSize: buttonStyles.primary.fontSize,
    fontWeight: typography.weight.semiBold,
    color: colors.primary.blue,
  },
  textButton: {
    paddingHorizontal: buttonStyles.text.paddingHorizontal,
    paddingVertical: buttonStyles.text.paddingVertical,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textButtonText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.medium,
    color: colors.primary.blue,
  },
  disabled: {
    opacity: 0.5,
  },
});

