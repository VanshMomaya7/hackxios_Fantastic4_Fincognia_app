/**
 * Budget vs Actual Chart Component
 * Bar chart comparing planned budget vs actual spending by category
 * Uses react-native-chart-kit BarChart with proper styling
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/designTokens';
import Card from '../ui/Card';
import type { BudgetCategoryAllocation } from '../../types/budget';

interface BudgetVsActualChartProps {
  categories: BudgetCategoryAllocation[];
}

const screenWidth = Dimensions.get('window').width;

export default function BudgetVsActualChart({ categories }: BudgetVsActualChartProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  // Filter out growth category for this chart
  const displayCategories = categories.filter(cat => cat.id !== 'growth');

  // Prepare chart data
  const labels = displayCategories.map(cat => {
    // Truncate long labels for better display
    return cat.label.length > 10 ? cat.label.substring(0, 8) + '..' : cat.label;
  });

  const plannedData = displayCategories.map(cat => cat.monthlyLimit);
  const actualData = displayCategories.map(cat => cat.spentThisPeriod);

  const chartWidth = screenWidth - spacing.screenPadding * 2 - spacing.md * 2;

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Budget vs Actual</Text>
      <Text style={styles.subtitle}>Planned vs Spent by Category (₹)</Text>

      <View style={styles.chartContainer}>
        {/* Planned Budget Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Planned Budget</Text>
          <BarChart
            data={{
              labels,
              datasets: [
                {
                  data: plannedData,
                },
              ],
            }}
            width={chartWidth}
            height={180}
            yAxisLabel="₹"
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: colors.neutral.white,
              backgroundGradientFrom: colors.neutral.white,
              backgroundGradientTo: colors.neutral.white,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 102, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              style: {
                borderRadius: borderRadius.medium,
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: colors.border.subtle,
                strokeWidth: 1,
              },
              barPercentage: 0.7,
            }}
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={false}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            fromZero={true}
            showValuesOnTopOfBars={true}
          />
        </View>

        {/* Actual Spending Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Actual Spending</Text>
          <BarChart
            data={{
              labels,
              datasets: [
                {
                  data: actualData,
                },
              ],
            }}
            width={chartWidth}
            height={180}
            yAxisLabel="₹"
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: colors.neutral.white,
              backgroundGradientFrom: colors.neutral.white,
              backgroundGradientTo: colors.neutral.white,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(236, 72, 153, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              style: {
                borderRadius: borderRadius.medium,
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: colors.border.subtle,
                strokeWidth: 1,
              },
              barPercentage: 0.7,
            }}
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={false}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            fromZero={true}
            showValuesOnTopOfBars={true}
          />
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: colors.primary.blue }]} />
          <Text style={styles.legendText}>Planned</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: colors.accent.pink }]} />
          <Text style={styles.legendText}>Actual</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
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
    marginBottom: spacing.md,
  },
  chartContainer: {
    gap: spacing.lg,
  },
  chartSection: {
    marginBottom: spacing.md,
  },
  chartTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.black,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  chart: {
    marginVertical: spacing.xs,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: typography.size.caption,
    color: colors.neutral.darkGray,
  },
});
