/**
 * Add Goal Modal Component
 * Modal for adding or editing financial goals
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/designTokens';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { createGoal, updateGoal } from '../../services/goalService';
import type { Goal } from '../../types';

interface AddGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  editingGoal?: Goal | null;
}

export default function AddGoalModal({ visible, onClose, onSave, editingGoal }: AddGoalModalProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editingGoal) {
        setName(editingGoal.name || '');
        setTargetAmount(editingGoal.targetAmount?.toString() || '');
        setCurrentAmount(editingGoal.currentAmount?.toString() || '0');
        // Convert timestamp to YYYY-MM-DD format
        const date = new Date(editingGoal.targetDate);
        setTargetDate(date.toISOString().split('T')[0]);
      } else {
        // Reset form for new goal
        setName('');
        setTargetAmount('');
        setCurrentAmount('0');
        setTargetDate('');
      }
    }
  }, [visible, editingGoal]);

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a goal name');
      return;
    }

    const targetAmountNum = parseFloat(targetAmount);
    if (isNaN(targetAmountNum) || targetAmountNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid target amount');
      return;
    }

    const currentAmountNum = parseFloat(currentAmount) || 0;
    if (isNaN(currentAmountNum) || currentAmountNum < 0) {
      Alert.alert('Validation Error', 'Current amount must be a positive number or zero');
      return;
    }

    if (currentAmountNum >= targetAmountNum) {
      Alert.alert('Validation Error', 'Current amount cannot be greater than or equal to target amount');
      return;
    }

    if (!targetDate) {
      Alert.alert('Validation Error', 'Please select a target date');
      return;
    }

    const targetDateTimestamp = new Date(targetDate).getTime();
    if (isNaN(targetDateTimestamp) || targetDateTimestamp <= Date.now()) {
      Alert.alert('Validation Error', 'Target date must be in the future');
      return;
    }

    try {
      setLoading(true);

      // Calculate monthly contribution needed
      const monthsRemaining = Math.max(1, Math.ceil((targetDateTimestamp - Date.now()) / (30 * 24 * 60 * 60 * 1000)));
      const remaining = targetAmountNum - currentAmountNum;
      const monthlyContribution = Math.round(remaining / monthsRemaining);

      if (editingGoal) {
        // Update existing goal
        await updateGoal(editingGoal.id, {
          name: name.trim(),
          targetAmount: targetAmountNum,
          targetDate: targetDateTimestamp,
          currentAmount: currentAmountNum,
          monthlyContribution,
        });
        Alert.alert('Success', 'Goal updated successfully');
      } else {
        // Create new goal
        await createGoal({
          name: name.trim(),
          targetAmount: targetAmountNum,
          targetDate: targetDateTimestamp,
          currentAmount: currentAmountNum,
          monthlyContribution,
        });
        Alert.alert('Success', 'Goal created successfully');
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('[Add Goal Modal] Error saving goal:', error);
      Alert.alert('Error', error.message || 'Failed to save goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{editingGoal ? 'Edit Goal' : 'Add Goal'}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Input
            label="Goal Name"
            placeholder="e.g., Emergency Fund, Vacation, New Bike"
            value={name}
            onChangeText={setName}
            containerStyle={styles.input}
          />

          <Input
            label="Target Amount (₹)"
            placeholder="e.g., 50000"
            keyboardType="numeric"
            value={targetAmount}
            onChangeText={setTargetAmount}
            containerStyle={styles.input}
          />

          <Input
            label="Current Amount (₹)"
            placeholder="How much you've saved so far (optional)"
            keyboardType="numeric"
            value={currentAmount}
            onChangeText={setCurrentAmount}
            containerStyle={styles.input}
          />

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Target Date</Text>
            <Input
              placeholder="YYYY-MM-DD"
              value={targetDate}
              onChangeText={setTargetDate}
              containerStyle={styles.input}
            />
            <Text style={styles.hint}>Enter date in YYYY-MM-DD format (e.g., 2025-12-31)</Text>
          </View>

          <Button
            title={loading ? 'Saving...' : editingGoal ? 'Update Goal' : 'Create Goal'}
            onPress={handleSave}
            disabled={loading}
            style={styles.saveButton}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  cancelButton: {
    padding: spacing.xs,
  },
  cancelButtonText: {
    fontSize: typography.size.body,
    color: colors.primary.blue,
  },
  title: {
    fontSize: typography.size.h2,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
  },
  placeholder: {
    width: 60, // Balance the cancel button width
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.screenPadding,
  },
  input: {
    marginBottom: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.md,
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
    marginTop: spacing.xs,
  },
  saveButton: {
    marginTop: spacing.lg,
  },
});

