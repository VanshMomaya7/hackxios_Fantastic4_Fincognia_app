/**
 * Credit Scoring Card Component
 * Displays credit score summary on LearnScreen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/designTokens';

export default function CreditScoringCard() {
  const navigation = useNavigation();
  
  // Mock credit score data - can be fetched from a service later
  const creditScore = 680;
  const creditScoreLabel = creditScore >= 750 ? 'Excellent' : creditScore >= 650 ? 'Good' : creditScore >= 550 ? 'Fair' : 'Poor';
  
  const getScoreColor = (score: number): string => {
    if (score >= 750) return '#10b981'; // green
    if (score >= 650) return '#06b6d4'; // cyan
    if (score >= 550) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const handlePress = () => {
    navigation.navigate('Credit' as never);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.title}>Credit Score Simulator</Text>
        <Text style={styles.subtitle}>Learn how credit scores work</Text>
      </View>

      <View style={styles.scoreContainer}>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreValue, { color: getScoreColor(creditScore) }]}>
            {creditScore}
          </Text>
          <Text style={styles.scoreLabel}>{creditScoreLabel}</Text>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Credit Utilization</Text>
            <Text style={styles.infoValue}>45%</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment History</Text>
            <Text style={[styles.infoValue, { color: '#10b981' }]}>94%</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Accounts</Text>
            <Text style={styles.infoValue}>3 Active</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Tap to explore credit management</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#16213e',
    borderRadius: borderRadius.large,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#0f3460',
    ...shadows.small,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.size.h2,
    fontWeight: typography.weight.bold,
    color: '#ffffff',
    marginBottom: spacing.xs / 2,
  },
  subtitle: {
    fontSize: typography.size.caption,
    color: '#7a7a7a',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: '#06b6d4',
  },
  scoreValue: {
    fontSize: typography.size.display,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.xs / 2,
  },
  scoreLabel: {
    fontSize: typography.size.caption,
    color: '#a0a0a0',
    fontWeight: typography.weight.medium,
  },
  infoContainer: {
    flex: 1,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: typography.size.body,
    color: '#a0a0a0',
  },
  infoValue: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: '#ffffff',
  },
  footer: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  footerText: {
    fontSize: typography.size.caption,
    color: '#7a7a7a',
    textAlign: 'center',
  },
});


