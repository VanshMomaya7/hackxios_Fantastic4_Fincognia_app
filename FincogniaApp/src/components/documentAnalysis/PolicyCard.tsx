/**
 * Policy Card Component
 * Displays a single policy summary
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/designTokens';
import type { PolicySummary } from '../../services/documentAnalysisService';

interface PolicyCardProps {
  title: string;
  policy: PolicySummary;
}

export default function PolicyCard({ title, policy }: PolicyCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Policy Name */}
        {policy.name && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Policy Name</Text>
            <Text style={styles.value}>{policy.name}</Text>
          </View>
        )}

        {/* Premium */}
        {policy.premium && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Premium</Text>
            <Text style={[styles.value, styles.premium]}>{policy.premium}</Text>
          </View>
        )}

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.summary}>{policy.summary}</Text>
        </View>

        {/* Coverage */}
        {policy.coverage && policy.coverage.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ Coverage</Text>
            {policy.coverage.map((item: string, index: number) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Exclusions */}
        {policy.exclusions && policy.exclusions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>❌ Exclusions</Text>
            {policy.exclusions.map((item: string, index: number) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Ideal For */}
        {policy.idealFor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ideal For</Text>
            <Text style={styles.value}>{policy.idealFor}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    ...shadows.medium,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  content: {
    maxHeight: 400,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    lineHeight: 22,
  },
  premium: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
    color: colors.primary.blue,
  },
  summary: {
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


