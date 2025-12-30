/**
 * Stock Simulator Card Component
 * Displays stock simulator preview on LearnScreen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { spacing, typography, borderRadius, shadows } from '../../constants/designTokens';

export default function StockSimulatorCard() {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('StockSimulator' as never);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.title}>Stock Portfolio Simulator</Text>
        <Text style={styles.subtitle}>Practice trading with virtual money</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📈</Text>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Starting Capital</Text>
            <Text style={styles.infoValue}>₹1,00,000</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Available Stocks</Text>
            <Text style={styles.infoValue}>8 Stocks</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Features</Text>
            <Text style={[styles.infoValue, { color: '#06b6d4' }]}>Buy, Sell, Watchlist</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Tap to start virtual trading</Text>
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: '#06b6d4',
  },
  icon: {
    fontSize: 40,
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


