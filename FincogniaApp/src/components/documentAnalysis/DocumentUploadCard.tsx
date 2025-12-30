/**
 * Document Upload Card Component
 * Allows users to upload document images
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/designTokens';

interface DocumentUploadCardProps {
  label: string;
  imageUri?: string | null;
  onPress: () => void;
  loading?: boolean;
}

export default function DocumentUploadCard({
  label,
  imageUri,
  onPress,
  loading = false,
}: DocumentUploadCardProps) {
  return (
    <TouchableOpacity
      style={[styles.container, imageUri && styles.containerWithImage]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.blue} />
          <Text style={styles.loadingText}>Uploading...</Text>
        </View>
      ) : imageUri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>Tap to change</Text>
          </View>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.icon}>📄</Text>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.hint}>Tap to upload document</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.medium,
    borderWidth: 2,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
    height: 250, // Fixed height for consistent sizing
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    ...shadows.small,
  },
  containerWithImage: {
    borderStyle: 'solid',
    borderColor: colors.primary.blue,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: borderRadius.small,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.small,
    resizeMode: 'contain', // Show full image without cropping, fits within bounds
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomLeftRadius: borderRadius.small,
    borderBottomRightRadius: borderRadius.small,
  },
  overlayText: {
    color: colors.neutral.white,
    fontSize: typography.size.caption,
    fontWeight: typography.weight.medium,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.size.body,
    color: colors.neutral.mediumGray,
  },
});

