/**
 * Analysis Result Card Component
 * Displays document analysis results
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/designTokens';
import type { DocumentAnalysisResult, KeyFigure } from '../../services/documentAnalysisService';

interface AnalysisResultCardProps {
  result: DocumentAnalysisResult;
}

export default function AnalysisResultCard({ result }: AnalysisResultCardProps) {
  return (
    <View style={styles.container}>
      {/* Document Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Document Type</Text>
        <Text style={styles.docType}>{result.docType.replace(/_/g, ' ').toUpperCase()}</Text>
      </View>

      {/* Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.summary}>{result.summary}</Text>
      </View>

      {/* Key Figures */}
      {result.keyFigures && result.keyFigures.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Figures</Text>
          {result.keyFigures.map((figure: KeyFigure, index: number) => (
            <View key={index} style={styles.keyFigureRow}>
              <Text style={styles.keyFigureLabel}>{figure.label}:</Text>
              <Text style={styles.keyFigureValue}>{figure.value}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Risks */}
      {result.risks && result.risks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Risks</Text>
          {result.risks.map((risk: string, index: number) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{risk}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recommended Actions */}
      {result.actions && result.actions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Recommended Actions</Text>
          {result.actions.map((action: string, index: number) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{action}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Confidence Score */}
      <View style={styles.confidenceSection}>
        <Text style={styles.confidenceLabel}>Confidence: </Text>
        <Text style={styles.confidenceValue}>
          {(result.confidence * 100).toFixed(0)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    ...shadows.medium,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.sm,
  },
  docType: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: colors.primary.blue,
    textTransform: 'capitalize',
  },
  summary: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    lineHeight: 22,
  },
  keyFigureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  keyFigureLabel: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    flex: 1,
  },
  keyFigureValue: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.black,
    flex: 1,
    textAlign: 'right',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
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
    lineHeight: 22,
  },
  confidenceSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  confidenceLabel: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
  },
  confidenceValue: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    color: colors.primary.blue,
  },
});

