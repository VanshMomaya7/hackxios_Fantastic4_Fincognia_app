/**
 * Cash Burn Simulator Component
 * Interactive tool to simulate spending scenarios
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/designTokens';
import { calculateDaysUntilZero, calculateProjectedBalance } from '../../utils/forecastUtils';
import type { Transaction } from '../../types';

interface CashBurnSimulatorProps {
  currentBalance: number;
  transactions: Transaction[];
}

export default function CashBurnSimulator({
  currentBalance,
  transactions,
}: CashBurnSimulatorProps) {
  // Calculate average daily expense from transactions first
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentTransactions = transactions.filter((tx) => tx.timestamp >= thirtyDaysAgo);

  let totalExpenses = 0;
  let expenseDays = 0;
  const dailyTotals: { [date: string]: { expenses: number } } = {};

  recentTransactions.forEach((tx) => {
    const date = new Date(tx.timestamp);
    const dateKey = date.toISOString().split('T')[0];

    if (!dailyTotals[dateKey]) {
      dailyTotals[dateKey] = { expenses: 0 };
    }

    if (tx.type === 'debit' || (tx.amount < 0)) {
      dailyTotals[dateKey].expenses += Math.abs(tx.amount);
    }
  });

  Object.values(dailyTotals).forEach((day) => {
    if (day.expenses > 0) {
      totalExpenses += day.expenses;
      expenseDays++;
    }
  });

  const calculatedAvgDailyExpense = expenseDays > 0 ? totalExpenses / expenseDays : 500;
  
  // Initialize dailySpend from actual transaction data, or default to 500
  const [dailySpend, setDailySpend] = useState(calculatedAvgDailyExpense);

  // Calculate average daily income from transactions
  let totalIncome = 0;
  let incomeDays = 0;
  const incomeDailyTotals: { [date: string]: { income: number } } = {};

  recentTransactions.forEach((tx) => {
    const date = new Date(tx.timestamp);
    const dateKey = date.toISOString().split('T')[0];

    if (!incomeDailyTotals[dateKey]) {
      incomeDailyTotals[dateKey] = { income: 0 };
    }

    if (tx.type === 'credit' || (tx.amount > 0)) {
      incomeDailyTotals[dateKey].income += Math.abs(tx.amount);
    }
  });

  Object.values(incomeDailyTotals).forEach((day) => {
    if (day.income > 0) {
      totalIncome += day.income;
      incomeDays++;
    }
  });

  const avgDailyIncome = incomeDays > 0 ? totalIncome / incomeDays : 0;
  const avgDailyExpense = calculatedAvgDailyExpense;

  // Calculate days until zero with custom daily spend
  // Use custom daily spend instead of average
  const customDailyNet = avgDailyIncome - dailySpend;
  const daysUntilZero = calculateDaysUntilZero(currentBalance, customDailyNet);

  // Calculate projected balance for next 30 days using custom daily spend
  // This should update dynamically as slider changes
  let projectedBalance30Days = currentBalance;
  for (let day = 0; day < 30; day++) {
    projectedBalance30Days += customDailyNet;
  }

  // Format amount
  const formatAmount = (amount: number) => {
    return `₹${Math.abs(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cash Burn Simulator</Text>
      <Text style={styles.subtitle}>
        See how your spending affects your balance
      </Text>

      <View style={styles.sliderContainer}>
        <Text style={styles.label}>Daily Spending: {formatAmount(dailySpend)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={Math.max(5000, avgDailyExpense * 2)}
          step={50}
          value={dailySpend}
          onValueChange={setDailySpend}
          minimumTrackTintColor={colors.primary.blue}
          maximumTrackTintColor={colors.neutral.lightGray}
          thumbTintColor={colors.primary.blue}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>₹0</Text>
          <Text style={styles.sliderLabel}>
            ₹{Math.max(5000, avgDailyExpense * 2).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      <View style={styles.resultsContainer}>
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Days Until Zero</Text>
          <Text
            style={[
              styles.resultValue,
              daysUntilZero !== null && daysUntilZero < 30 && styles.resultValueWarning,
            ]}>
            {daysUntilZero !== null ? `${daysUntilZero} days` : 'Never'}
          </Text>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Projected Balance (30 days)</Text>
          <Text
            style={[
              styles.resultValue,
              projectedBalance30Days < 0 && styles.resultValueDanger,
              projectedBalance30Days >= 0 && styles.resultValueSuccess,
            ]}>
            {formatAmount(projectedBalance30Days)}
          </Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Based on your average daily income of {formatAmount(avgDailyIncome)} and
          spending {formatAmount(dailySpend)} per day
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.large,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  title: {
    fontSize: typography.size.h2,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    marginBottom: spacing.md,
  },
  sliderContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.black,
    marginBottom: spacing.sm,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  sliderLabel: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
  },
  resultsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  resultCard: {
    flex: 1,
    backgroundColor: colors.neutral.background,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: typography.size.caption,
    color: colors.neutral.darkGray,
    marginBottom: spacing.xs,
  },
  resultValue: {
    fontSize: typography.size.h2,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
  },
  resultValueSuccess: {
    color: colors.semantic.success,
  },
  resultValueWarning: {
    color: colors.semantic.warning,
  },
  resultValueDanger: {
    color: colors.semantic.error,
  },
  infoBox: {
    backgroundColor: colors.neutral.background,
    borderRadius: borderRadius.small,
    padding: spacing.sm,
  },
  infoText: {
    fontSize: typography.size.caption,
    color: colors.neutral.darkGray,
    textAlign: 'center',
  },
});

