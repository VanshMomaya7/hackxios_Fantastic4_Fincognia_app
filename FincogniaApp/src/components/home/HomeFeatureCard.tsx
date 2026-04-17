/**
 * Home Feature Card Component
 * Branded tile card with icon, title, subtitle, and chevron
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/designTokens';

interface HomeFeatureCardProps {
  iconName?: string;
  iconImage?: ImageSourcePropType;
  iconBackgroundColor: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
}

export default function HomeFeatureCard({
  iconName,
  iconImage,
  iconBackgroundColor,
  title,
  subtitle,
  onPress,
}: HomeFeatureCardProps) {
  const CardContent = () => (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
        {iconImage ? (
          <Image source={iconImage} style={styles.iconImage} resizeMode="contain" />
        ) : iconName ? (
          <Icon 
            name={iconName} 
            size={22} 
            color={colors.neutral.white}
            style={styles.icon}
          />
        ) : (
          <Icon name="help-circle-outline" size={22} color={colors.neutral.white} />
        )}
      </View>
      <View style={styles.textSection}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.chevronContainer}>
        <Icon name="chevron-right" size={24} color={colors.neutral.mediumGray} />
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.large,
    padding: spacing.cardPadding,
    ...shadows.small,
    minHeight: 80,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textSection: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    lineHeight: typography.lineHeight.body * typography.size.body,
  },
  chevronContainer: {
    marginLeft: spacing.sm,
    justifyContent: 'center',
  },
  iconImage: {
    width: 24,
    height: 24,
  },
  icon: {
    textAlign: 'center',
  },
});

