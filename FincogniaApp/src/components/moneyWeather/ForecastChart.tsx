/**
 * Forecast Chart Component
 * Displays cashflow forecast with period selector
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/designTokens';
import type { CashflowForecast } from '../../types';

interface ForecastChartProps {
  forecast: CashflowForecast | null;
  onPeriodChange: (period: '7d' | '30d' | '90d') => void;
  selectedPeriod: '7d' | '30d' | '90d';
  loading?: boolean;
}

const screenWidth = Dimensions.get('window').width;

export default function ForecastChart({
  forecast,
  onPeriodChange,
  selectedPeriod,
  loading = false,
}: ForecastChartProps) {
  const periods: Array<{ key: '7d' | '30d' | '90d'; label: string }> = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
  ];

  if (loading || !forecast) {
    return (
      <View style={styles.container}>
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive,
              ]}
              onPress={() => onPeriodChange(period.key)}>
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.key && styles.periodButtonTextActive,
                ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.placeholderText}>Loading forecast...</Text>
        </View>
      </View>
    );
  }

  // Prepare chart data for BarChart
  const labels = forecast.forecasts.map((f, index) => {
    const date = new Date(f.date);
    if (selectedPeriod === '7d') {
      return date.toLocaleDateString('en-IN', { weekday: 'short' });
    } else if (selectedPeriod === '30d') {
      // Show every 5th day
      return index % 5 === 0 ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
    } else {
      // Show every 15th day
      return index % 15 === 0 ? date.toLocaleDateString('en-IN', { month: 'short' }) : '';
    }
  });

  const chartData = {
    labels,
    datasets: [
      {
        data: forecast.forecasts.map((f) => Math.round(f.predictedBalance)),
      },
    ],
  };

  const riskColor =
    forecast.riskLevel === 'high'
      ? colors.semantic.error
      : forecast.riskLevel === 'medium'
      ? colors.semantic.warning
      : colors.semantic.success;

  return (
    <View style={styles.container}>
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.periodButtonActive,
            ]}
            onPress={() => onPeriodChange(period.key)}>
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.periodButtonTextActive,
              ]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.chartContainer}>
        <BarChart
          data={chartData}
          width={screenWidth - spacing.screenPadding * 2 - spacing.md * 2}
          height={220}
          yAxisLabel="₹"
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: colors.neutral.white,
            backgroundGradientFrom: colors.neutral.white,
            backgroundGradientTo: colors.neutral.white,
            decimalPlaces: 0,
            color: (opacity = 1) => {
              if (forecast.riskLevel === 'high') return `rgba(239, 68, 68, ${opacity})`; // red
              if (forecast.riskLevel === 'medium') return `rgba(245, 158, 11, ${opacity})`; // yellow
              return `rgba(16, 185, 129, ${opacity})`; // green
            },
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
          fromZero={false}
        />

        {/* Risk Level Indicator */}
        <View style={styles.riskIndicator}>
          <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
          <Text style={styles.riskText}>
            Risk: {forecast.riskLevel.toUpperCase()}
          </Text>
        </View>
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
  periodSelector: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.small,
    backgroundColor: colors.neutral.lightGray,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.primary.blue,
  },
  periodButtonText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.medium,
    color: colors.neutral.darkGray,
  },
  periodButtonTextActive: {
    color: colors.neutral.white,
    fontWeight: typography.weight.semiBold,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: borderRadius.medium,
  },
  chartPlaceholder: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: typography.size.body,
    color: colors.neutral.mediumGray,
  },
  riskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  riskText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.medium,
    color: colors.neutral.darkGray,
  },
});


