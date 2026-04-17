/**
 * Comparison Result Card Component
 * Displays policy comparison verdict
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/designTokens';

interface ComparisonResultCardProps {
  betterForGigWorker: 'A' | 'B' | 'depends';
  reason: string;
  keyDifferences: string[];
}

export default function ComparisonResultCard({
  betterForGigWorker,
  reason,
  keyDifferences,
}: ComparisonResultCardProps) {
  const getVerdictColor = () => {
    if (betterForGigWorker === 'A') return colors.primary.blue;
    if (betterForGigWorker === 'B') return colors.accent.cyan;
    return colors.semantic.warning;
  };

  const getVerdictText = () => {
    if (betterForGigWorker === 'A') return 'Policy A is Better';
    if (betterForGigWorker === 'B') return 'Policy B is Better';
    return 'Depends on Your Needs';
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: getVerdictColor() }]}>
        <Text style={styles.verdictIcon}>🏆</Text>
        <Text style={styles.verdictText}>{getVerdictText()}</Text>
      </View>

      <View style={styles.content}>
        {/* Reason */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why?</Text>
          <Text style={styles.reason}>{reason}</Text>
        </View>

        {/* Key Differences */}
        {keyDifferences && keyDifferences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Differences</Text>
            {keyDifferences.map((difference: string, index: number) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>{difference}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.medium,
    overflow: 'hidden',
    ...shadows.medium,
    marginTop: spacing.md,
  },
  header: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verdictIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  verdictText: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
    color: colors.neutral.white,
    textAlign: 'center',
  },
  content: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.black,
    marginBottom: spacing.sm,
  },
  reason: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
    paddingLeft: spacing.xs,
  },
  bullet: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    marginRight: spacing.sm,
  },
  listText: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    flex: 1,
    lineHeight: 20,
  },
});


