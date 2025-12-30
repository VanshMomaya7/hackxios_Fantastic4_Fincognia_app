/**
 * Input Component
 * Text field and Search variants
 */

import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { colors, typography, inputStyles, borderRadius, spacing } from '../../constants/designTokens';

type InputVariant = 'textField' | 'search';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  variant?: InputVariant;
  containerStyle?: ViewStyle;
}

export default function Input({
  label,
  error,
  variant = 'textField',
  containerStyle,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const isSearch = variant === 'search';

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isSearch && styles.searchContainer,
          isFocused && styles.focused,
          error && styles.error,
        ]}>
        <TextInput
          style={[
            styles.input,
            isSearch && styles.searchInput,
            style,
          ]}
          placeholderTextColor={colors.neutral.mediumGray}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.medium,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    height: inputStyles.textField.height,
    backgroundColor: colors.neutral.white,
    borderRadius: inputStyles.textField.borderRadius,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: inputStyles.textField.paddingHorizontal,
    justifyContent: 'center',
  },
  searchContainer: {
    backgroundColor: colors.neutral.lightGray,
    borderWidth: 0,
  },
  input: {
    fontSize: inputStyles.textField.fontSize,
    color: colors.neutral.black,
    flex: 1,
  },
  searchInput: {
    fontSize: typography.size.body,
  },
  focused: {
    borderColor: colors.primary.blue,
    // ...shadows.small,
  },
  error: {
    borderColor: colors.semantic.error,
  },
  errorText: {
    fontSize: typography.size.caption,
    color: colors.semantic.error,
    marginTop: spacing.xs,
  },
});

