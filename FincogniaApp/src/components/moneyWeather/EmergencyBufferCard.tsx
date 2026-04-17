/**
 * Emergency Buffer Card Component
 * Displays emergency buffer status and progress
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/designTokens';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { updateBufferTarget, updateCurrentBuffer } from '../../services/bufferService';
import type { BufferInfo } from '../../services/bufferService';

interface EmergencyBufferCardProps {
  bufferInfo: BufferInfo | null;
  loading?: boolean;
  onRefresh?: () => void;
}

export default function EmergencyBufferCard({
  bufferInfo,
  loading = false,
  onRefresh,
}: EmergencyBufferCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [targetAmount, setTargetAmount] = useState('');
  const [saving, setSaving] = useState(false);
  if (loading || !bufferInfo) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Emergency Buffer</Text>
        <Text style={styles.loadingText}>Calculating...</Text>
      </View>
    );
  }

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const progressPercentage = Math.round(bufferInfo.progress * 100);
  const progressColor =
    bufferInfo.progress >= 1
      ? colors.semantic.success
      : bufferInfo.progress >= 0.5
      ? colors.semantic.warning
      : colors.semantic.error;

  const handleSaveTarget = async () => {
    const amount = parseFloat(targetAmount);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setSaving(true);
      await updateCurrentBuffer(amount);
      setShowEditModal(false);
      setTargetAmount('');
      if (onRefresh) {
        onRefresh();
      }
      Alert.alert('Success', 'Current buffer updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update current buffer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Buffer</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            if (bufferInfo) {
              setTargetAmount(bufferInfo.currentBuffer.toString());
            }
            setShowEditModal(true);
          }}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bufferInfo}>
        <View style={styles.bufferRow}>
          <Text style={styles.label}>Current Buffer</Text>
          <Text style={styles.amount}>{formatAmount(bufferInfo.currentBuffer)}</Text>
        </View>

        <View style={styles.bufferRow}>
          <Text style={styles.label}>Recommended</Text>
          <Text style={styles.recommendedAmount}>
            {formatAmount(bufferInfo.recommendedBuffer)}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, bufferInfo.progress * 100)}%`,
                backgroundColor: progressColor,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{progressPercentage}% of target</Text>
      </View>

      {/* Days of Expenses */}
      <View style={styles.daysContainer}>
        <Text style={styles.daysLabel}>Days of Expenses Covered</Text>
        <Text
          style={[
            styles.daysValue,
            bufferInfo.daysOfExpenses < 30 && styles.daysValueWarning,
            bufferInfo.daysOfExpenses >= 90 && styles.daysValueSuccess,
          ]}>
          {bufferInfo.daysOfExpenses} days
        </Text>
      </View>

      {/* Recommendation */}
      {bufferInfo.progress < 1 && (
        <View style={styles.recommendationBox}>
          <Text style={styles.recommendationText}>
            You need {formatAmount(bufferInfo.recommendedBuffer - bufferInfo.currentBuffer)}{' '}
            more to reach your recommended buffer
          </Text>
        </View>
      )}

      {bufferInfo.progress >= 1 && (
        <View style={[styles.recommendationBox, styles.successBox]}>
          <Text style={[styles.recommendationText, styles.successText]}>
            Great! You've reached your recommended emergency buffer
          </Text>
        </View>
      )}

      {/* Edit Buffer Target Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Current Buffer</Text>
            <Text style={styles.modalSubtitle}>
              Manually set your current buffer amount
            </Text>

            <Input
              label="Current Buffer Amount (₹)"
              placeholder="e.g., 25000"
              keyboardType="numeric"
              value={targetAmount}
              onChangeText={setTargetAmount}
              containerStyle={styles.inputField}
            />

            {bufferInfo && (
              <View style={styles.currentInfo}>
                <Text style={styles.currentInfoText}>
                  Current: ₹{bufferInfo.currentBuffer.toLocaleString('en-IN')}
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setShowEditModal(false)}
                style={styles.modalButton}
              />
              <Button
                title={saving ? 'Saving...' : 'Save'}
                onPress={handleSaveTarget}
                disabled={saving}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.size.h2,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
  },
  editButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.neutral.background,
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  editButtonText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.semiBold,
    color: colors.primary.blue,
  },
  loadingText: {
    fontSize: typography.size.body,
    color: colors.neutral.mediumGray,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  bufferInfo: {
    marginBottom: spacing.md,
  },
  bufferRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
  },
  amount: {
    fontSize: typography.size.h2,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
  },
  recommendedAmount: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.semiBold,
    color: colors.primary.blue,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.neutral.lightGray,
    borderRadius: borderRadius.small,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.small,
  },
  progressText: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
    textAlign: 'right',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    marginBottom: spacing.sm,
  },
  daysLabel: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
  },
  daysValue: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
  },
  daysValueWarning: {
    color: colors.semantic.warning,
  },
  daysValueSuccess: {
    color: colors.semantic.success,
  },
  recommendationBox: {
    backgroundColor: colors.neutral.background,
    borderRadius: borderRadius.small,
    padding: spacing.sm,
  },
  successBox: {
    backgroundColor: colors.semantic.success + '15',
  },
  recommendationText: {
    fontSize: typography.size.caption,
    color: colors.neutral.darkGray,
    textAlign: 'center',
  },
  successText: {
    color: colors.semantic.success,
    fontWeight: typography.weight.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: borderRadius.large,
    borderTopRightRadius: borderRadius.large,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: typography.size.h2,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  inputField: {
    marginBottom: spacing.md,
  },
  currentInfo: {
    backgroundColor: colors.neutral.background,
    borderRadius: borderRadius.small,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  currentInfoText: {
    fontSize: typography.size.caption,
    color: colors.neutral.darkGray,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});


