/**
 * Document Tools Card Component
 * Displays on CoachScreen and navigates to DocumentTools
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/designTokens';

export default function DocumentToolsCard() {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('DocumentTools' as never);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.title}>Document Assistant</Text>
        <Text style={styles.subtitle}>Explain or compare financial documents</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📄</Text>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel} numberOfLines={2}>Document Understanding</Text>
            <Text style={styles.infoValue} numberOfLines={1}>AI Analysis</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel} numberOfLines={2}>Policy Comparison</Text>
            <Text style={styles.infoValue} numberOfLines={1}>Side-by-Side</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Tap to analyze documents</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.large,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.medium,
  },
  header: {
    marginBottom: spacing.md,
    minWidth: 0, // Allows flexbox to properly constrain children
  },
  title: {
    fontSize: typography.size.h2,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.xs / 2,
    flexWrap: 'wrap',
  },
  subtitle: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
    flexWrap: 'wrap',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.blue + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 40,
  },
  infoContainer: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0, // Allows flexbox to properly constrain children
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 24,
  },
  infoLabel: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    flex: 1,
    marginRight: spacing.xs,
  },
  infoValue: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: colors.primary.blue,
    flexShrink: 1,
    textAlign: 'right',
  },
  footer: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  footerText: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
    textAlign: 'center',
  },
});


