/**
 * Budget Card Component
 * Quick access card for Adaptive Budget screen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/designTokens';

export default function BudgetCard() {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Budget' as never)}
      activeOpacity={0.8}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>💰</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Adaptive Budget</Text>
          <Text style={styles.subtitle}>Auto-generated budgets with smart alerts</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.primary.blue + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
  },
  arrow: {
    fontSize: typography.size.h2,
    color: colors.primary.blue,
    fontWeight: typography.weight.bold,
  },
});

