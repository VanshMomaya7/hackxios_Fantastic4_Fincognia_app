/**
 * Spend Velocity Chart Component
 * Line chart showing cumulative actual spend vs ideal cumulative spend over the month
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/designTokens';
import Card from '../ui/Card';
import type { DailySpendData } from '../../types/budget';

interface SpendVelocityChartProps {
  dailySpendData: DailySpendData[];
}

const screenWidth = Dimensions.get('window').width;

export default function SpendVelocityChart({ dailySpendData }: SpendVelocityChartProps) {
  if (!dailySpendData || dailySpendData.length === 0) {
    return null;
  }

  // Prepare chart data
  const labels = dailySpendData.map(item => {
    // Show day number, but only label every 5 days to avoid crowding
    return item.day % 5 === 0 ? String(item.day) : '';
  });

  const actualCumulative = dailySpendData.map(item => item.actualCumulative);
  const idealCumulative = dailySpendData.map(item => item.idealCumulative);

  const chartWidth = screenWidth - spacing.screenPadding * 2 - spacing.md * 2;
  const maxValue = Math.max(
    ...actualCumulative,
    ...idealCumulative,
    1000 // Minimum scale
  );

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Spend Velocity</Text>
      <Text style={styles.subtitle}>Actual vs Ideal Cumulative Spend (₹)</Text>

      <View style={styles.chartContainer}>
        <LineChart
          data={{
            labels,
            datasets: [
              {
                data: idealCumulative,
                color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`, // Green for ideal
                strokeWidth: 2,
              },
              {
                data: actualCumulative,
                color: (opacity = 1) => `rgba(236, 72, 153, ${opacity})`, // Pink for actual
                strokeWidth: 3,
              },
            ],
          }}
          width={chartWidth}
          height={220}
          yAxisLabel="₹"
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: colors.neutral.white,
            backgroundGradientFrom: colors.neutral.white,
            backgroundGradientTo: colors.neutral.white,
            decimalPlaces: 0,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: {
              borderRadius: borderRadius.medium,
            },
            propsForBackgroundLines: {
              strokeDasharray: '',
              stroke: colors.border.subtle,
              strokeWidth: 1,
            },
            propsForDots: {
              r: '3',
              strokeWidth: '2',
            },
            color: (opacity = 1) => `rgba(236, 72, 153, ${opacity})`,
          }}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          fromZero={true}
          withDots={false}
          withShadow={false}
        />
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: colors.semantic.success }]} />
          <Text style={styles.legendText}>Ideal</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: colors.accent.pink }]} />
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
    alignItems: 'center',
    marginVertical: spacing.sm,
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
  legendLine: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: typography.size.caption,
    color: colors.neutral.darkGray,
  },
});

