/**
 * Policy Recommendation Card Component
 * Displays a single policy recommendation
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/designTokens';
import type { PolicyRecommendation } from '../../services/documentAnalysisService';
import type { PolicyType } from '../../types/policyForm';

interface PolicyRecommendationCardProps {
  recommendation: PolicyRecommendation;
  isBestForYou?: boolean;
  policyType: PolicyType;
}

export default function PolicyRecommendationCard({
  recommendation,
  isBestForYou = false,
  policyType,
}: PolicyRecommendationCardProps) {
  const navigation = useNavigation<any>();
  
  const handleApply = () => {
    navigation.navigate('PolicyApplication', {
      policy: recommendation,
      policyType: policyType,
    });
  };
  return (
    <View style={[styles.container, isBestForYou && styles.bestForYouContainer]}>
      {isBestForYou && (
        <View style={styles.bestForYouBadge}>
          <Text style={styles.bestForYouText}>🏆 Best for You</Text>
        </View>
      )}
      
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.name}>{recommendation.name}</Text>
          <Text style={styles.provider}>{recommendation.provider}</Text>
        </View>
        <Text style={styles.premium}>{recommendation.premium}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Recommended</Text>
        <Text style={styles.whyRecommended}>{recommendation.whyRecommended}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Coverage</Text>
        {recommendation.coverage.map((item: string, index: number) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.bullet}>✓</Text>
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.prosConsRow}>
        <View style={styles.prosConsColumn}>
          <Text style={styles.prosConsTitle}>Pros</Text>
          {recommendation.pros.map((pro: string, index: number) => (
            <View key={index} style={styles.listItem}>
              <Text style={[styles.bullet, styles.prosBullet]}>+</Text>
              <Text style={styles.listText}>{pro}</Text>
            </View>
          ))}
        </View>

        <View style={styles.prosConsColumn}>
          <Text style={styles.prosConsTitle}>Cons</Text>
          {recommendation.cons.map((con: string, index: number) => (
            <View key={index} style={styles.listItem}>
              <Text style={[styles.bullet, styles.consBullet]}>-</Text>
              <Text style={styles.listText}>{con}</Text>
            </View>
          ))}
        </View>
      </View>

      {recommendation.exclusions && recommendation.exclusions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exclusions</Text>
          {recommendation.exclusions.map((exclusion: string, index: number) => (
            <View key={index} style={styles.listItem}>
              <Text style={[styles.bullet, styles.exclusionBullet]}>✗</Text>
              <Text style={styles.listText}>{exclusion}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.idealForSection}>
        <Text style={styles.idealForLabel}>Ideal for:</Text>
        <Text style={styles.idealForText}>{recommendation.idealFor}</Text>
      </View>

      {/* Apply Button */}
      <TouchableOpacity
        style={[styles.applyButton, isBestForYou && styles.applyButtonBest]}
        onPress={handleApply}
        activeOpacity={0.7}>
        <Text style={styles.applyButtonText}>Apply for This Policy</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.medium,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bestForYouContainer: {
    borderColor: colors.primary.blue,
    backgroundColor: '#F0F7FF',
  },
  bestForYouBadge: {
    backgroundColor: colors.primary.blue,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.small,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  bestForYouText: {
    color: colors.neutral.white,
    fontSize: typography.size.caption,
    fontWeight: typography.weight.bold,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  titleSection: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  provider: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
  },
  premium: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
    color: colors.primary.blue,
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
  whyRecommended: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
    paddingLeft: spacing.xs,
  },
  bullet: {
    fontSize: typography.size.body,
    marginRight: spacing.sm,
    width: 20,
  },
  listText: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    flex: 1,
    lineHeight: 20,
  },
  prosConsRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  prosConsColumn: {
    flex: 1,
  },
  prosConsTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.black,
    marginBottom: spacing.sm,
  },
  prosBullet: {
    color: colors.semantic.success,
  },
  consBullet: {
    color: colors.semantic.error,
  },
  exclusionBullet: {
    color: colors.semantic.warning,
  },
  idealForSection: {
    backgroundColor: colors.neutral.lightGray,
    padding: spacing.sm,
    borderRadius: borderRadius.small,
    marginTop: spacing.sm,
  },
  idealForLabel: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.mediumGray,
    marginBottom: spacing.xs,
  },
  idealForText: {
    fontSize: typography.size.body,
    color: colors.neutral.black,
    fontWeight: typography.weight.medium,
  },
  applyButton: {
    backgroundColor: colors.primary.blue,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  applyButtonBest: {
    backgroundColor: colors.primary.blue,
    borderWidth: 2,
    borderColor: colors.neutral.white,
  },
  applyButtonText: {
    color: colors.neutral.white,
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
  },
});

