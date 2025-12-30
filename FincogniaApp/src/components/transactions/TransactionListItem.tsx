/**
 * Transaction List Item Component
 * Displays a single transaction in the list
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, listStyles } from '../../constants/designTokens';
import type { Transaction } from '../../types';

interface TransactionListItemProps {
  transaction: Transaction;
  onPress?: () => void;
}

// Category colors mapping
const categoryColors: { [key: string]: string } = {
  food: colors.accent.pink,
  transport: colors.accent.cyan,
  shopping: colors.accent.purple,
  bills: colors.semantic.warning,
  entertainment: colors.accent.brightGreen,
  income: colors.semantic.success,
  default: colors.primary.blue,
};

// Category icons (using text for now, can be replaced with actual icons)
const categoryIcons: { [key: string]: string } = {
  food: '🍔',
  transport: '🚗',
  shopping: '🛍️',
  bills: '📄',
  entertainment: '🎬',
  income: '💰',
  default: '💳',
};

export default function TransactionListItem({
  transaction,
  onPress,
}: TransactionListItemProps) {
  const isCredit = transaction.type === 'credit';
  const category = transaction.category || 'uncategorized';
  const categoryColor = categoryColors[category.toLowerCase()] || categoryColors.default;
  const categoryIcon = categoryIcons[category.toLowerCase()] || categoryIcons.default;

  const formatAmount = (amount: number) => {
    const formatted = Math.abs(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return isCredit ? `+₹${formatted}` : `-₹${formatted}`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const txDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (txDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: categoryColor }]}>
        <Text style={styles.icon}>{categoryIcon}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {transaction.merchant || category || 'Transaction'}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {category} • {formatTime(transaction.timestamp)}
        </Text>
      </View>

      <View style={styles.amountContainer}>
        <Text
          style={[
            styles.amount,
            { color: isCredit ? colors.semantic.positive : colors.semantic.negative },
          ]}>
          {formatAmount(transaction.amount)}
        </Text>
        {transaction.isRecurring && (
          <Text style={styles.recurringBadge}>Recurring</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: listStyles.transactionItem.paddingVertical,
    paddingHorizontal: spacing.md,
    minHeight: listStyles.transactionItem.minHeight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  iconContainer: {
    width: listStyles.transactionItem.iconSize,
    height: listStyles.transactionItem.iconSize,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.caption,
    color: colors.neutral.darkGray,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.xs,
  },
  recurringBadge: {
    fontSize: typography.size.small,
    color: colors.neutral.mediumGray,
    fontWeight: typography.weight.medium,
  },
});


