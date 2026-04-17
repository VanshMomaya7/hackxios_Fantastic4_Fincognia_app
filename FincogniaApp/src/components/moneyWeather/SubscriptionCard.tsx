/**
 * Subscription Card Component
 * Displays subscription list with pause/cancel options
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/designTokens';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { addSubscription } from '../../services/subscriptionService';
import type { Subscription } from '../../types';

interface SubscriptionCardProps {
  subscriptions: Subscription[];
  onPause?: (subscriptionId: string) => void;
  onCancel?: (subscriptionId: string) => void;
  onRefresh?: () => void;
}

interface SubscriptionItemProps {
  subscription: Subscription;
  onPause?: (subscriptionId: string) => void;
  onCancel?: (subscriptionId: string) => void;
}

function SubscriptionItem({ subscription, onPause, onCancel }: SubscriptionItemProps) {
  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      default:
        return frequency;
    }
  };

  const statusColor =
    subscription.status === 'active'
      ? colors.semantic.success
      : subscription.status === 'paused'
      ? colors.semantic.warning
      : colors.neutral.mediumGray;

  return (
    <View style={styles.item}>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.merchantName}>{subscription.merchant}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {subscription.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.itemDetails}>
          <Text style={styles.amount}>{formatAmount(subscription.amount)}</Text>
          <Text style={styles.frequency}>{getFrequencyLabel(subscription.frequency)}</Text>
        </View>

        <Text style={styles.lastPayment}>
          Last payment: {formatDate(subscription.lastPayment)}
        </Text>
        {subscription.nextPayment && (
          <Text style={styles.nextPayment}>
            Next payment: {formatDate(subscription.nextPayment)}
          </Text>
        )}
      </View>

      {subscription.status === 'active' && (
        <View style={styles.actions}>
          {onPause && (
            <TouchableOpacity
              style={[styles.actionButton, styles.pauseButton]}
              onPress={() => onPause(subscription.id)}>
              <Text style={styles.pauseButtonText}>Pause</Text>
            </TouchableOpacity>
          )}
          {onCancel && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => onCancel(subscription.id)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

export default function SubscriptionCard({
  subscriptions,
  onPause,
  onCancel,
  onRefresh,
}: SubscriptionCardProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    merchant: '',
    amount: '',
    frequency: 'monthly' as 'weekly' | 'monthly' | 'yearly',
    lastPayment: Date.now(),
  });

  const activeSubscriptions = subscriptions.filter((sub) => sub.status === 'active');
  const totalMonthly = activeSubscriptions.reduce((sum, sub) => {
    if (sub.frequency === 'monthly') return sum + sub.amount;
    if (sub.frequency === 'weekly') return sum + sub.amount * 4.33;
    if (sub.frequency === 'yearly') return sum + sub.amount / 12;
    return sum;
  }, 0);

  const handleAddSubscription = async () => {
    if (!formData.merchant.trim()) {
      Alert.alert('Error', 'Please enter a merchant name');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      await addSubscription({
        merchant: formData.merchant.trim(),
        amount,
        frequency: formData.frequency,
        lastPayment: formData.lastPayment,
        status: 'active',
      });
      setShowAddModal(false);
      setFormData({ merchant: '', amount: '', frequency: 'monthly', lastPayment: Date.now() });
      if (onRefresh) {
        onRefresh();
      }
      Alert.alert('Success', 'Subscription added successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Subscriptions</Text>
        <View style={styles.headerRight}>
          <Text style={styles.total}>
            ₹{totalMonthly.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            /month
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {subscriptions.length === 0 ? (
        <Text style={styles.emptyText}>No subscriptions detected</Text>
      ) : (
        <FlatList
          data={subscriptions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SubscriptionItem
              subscription={item}
              onPause={onPause}
              onCancel={onCancel}
            />
          )}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Add Subscription Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Subscription</Text>

            <Input
              label="Merchant/Service Name"
              placeholder="e.g., Netflix, Spotify"
              value={formData.merchant}
              onChangeText={(text) => setFormData({ ...formData, merchant: text })}
              containerStyle={styles.inputField}
            />

            <Input
              label="Amount (₹)"
              placeholder="e.g., 999"
              keyboardType="numeric"
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              containerStyle={styles.inputField}
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Frequency</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.frequency}
                  onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                  style={styles.picker}>
                  <Picker.Item label="Monthly" value="monthly" />
                  <Picker.Item label="Weekly" value="weekly" />
                  <Picker.Item label="Yearly" value="yearly" />
                </Picker>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setShowAddModal(false)}
                style={styles.modalButton}
              />
              <Button
                title={loading ? 'Adding...' : 'Add'}
                onPress={handleAddSubscription}
                disabled={loading}
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
  total: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.semiBold,
    color: colors.primary.blue,
  },
  emptyText: {
    fontSize: typography.size.body,
    color: colors.neutral.mediumGray,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  item: {
    padding: spacing.sm,
    backgroundColor: colors.neutral.background,
    borderRadius: borderRadius.medium,
  },
  itemContent: {
    marginBottom: spacing.xs,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  merchantName: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.black,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
  },
  statusText: {
    fontSize: typography.size.small,
    fontWeight: typography.weight.semiBold,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  amount: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
  },
  frequency: {
    fontSize: typography.size.caption,
    color: colors.neutral.darkGray,
  },
  lastPayment: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
    marginBottom: spacing.xs / 2,
  },
  nextPayment: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.small,
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: colors.semantic.warning + '20',
    borderWidth: 1,
    borderColor: colors.semantic.warning,
  },
  pauseButtonText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.semiBold,
    color: colors.semantic.warning,
  },
  cancelButton: {
    backgroundColor: colors.semantic.error + '20',
    borderWidth: 1,
    borderColor: colors.semantic.error,
  },
  cancelButtonText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.semiBold,
    color: colors.semantic.error,
  },
  separator: {
    height: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary.blue,
    borderRadius: borderRadius.small,
  },
  addButtonText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.white,
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
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  inputField: {
    marginBottom: spacing.md,
  },
  pickerContainer: {
    marginBottom: spacing.md,
  },
  pickerLabel: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.medium,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.small,
    backgroundColor: colors.neutral.white,
  },
  picker: {
    height: 50,
    width: '100%',
    color: colors.neutral.black,
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


