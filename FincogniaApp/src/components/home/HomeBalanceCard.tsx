/**
 * Home Balance Card Component
 * Modern fintech-style balance card with icon and horizontal layout
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/designTokens';

interface HomeBalanceCardProps {
  totalBalance: number;
  savings: number;
  onPress?: () => void;
}

export default function HomeBalanceCard({ totalBalance, savings, onPress }: HomeBalanceCardProps) {
  const formatCurrency = (amount: number) => {
    return `₹${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const CardContent = () => (
    <View style={styles.card}>
      <View style={styles.leftSection}>
        <Text style={styles.label}>Total Balance</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(totalBalance)}</Text>
        <Text style={styles.savingsText}>Savings: {formatCurrency(savings)}</Text>
        {onPress && (
          <TouchableOpacity style={styles.viewDetailsButton} onPress={onPress}>
            <Text style={styles.viewDetailsText}>View details</Text>
            <Icon name="chevron-right" size={16} color={colors.primary.blue} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.rightSection}>
        <View style={styles.iconContainer}>
          <Icon 
            name="wallet" 
            size={32} 
            color={colors.neutral.white}
            style={styles.icon}
          />
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing.cardPadding,
    ...shadows.medium,
    minHeight: 140,
  },
  leftSection: {
    flex: 1,
    justifyContent: 'space-between',
  },
  label: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.medium,
    color: colors.neutral.mediumGray,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    fontSize: typography.size.display,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  savingsText: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    marginBottom: spacing.sm,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  viewDetailsText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.semiBold,
    color: colors.primary.blue,
    marginRight: spacing.xs,
  },
  rightSection: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingLeft: spacing.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    textAlign: 'center',
  },
});

