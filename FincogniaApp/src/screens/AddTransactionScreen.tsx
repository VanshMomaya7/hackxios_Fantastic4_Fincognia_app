/**
 * Add Transaction Screen
 * Manual transaction entry form
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { useAuthStore } from '../store/useAuthStore';
import { saveTransaction } from '../services/dataIngestionService';
import { Button, Input, Card } from '../components/ui';
import { colors, typography, spacing } from '../constants/designTokens';

const CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Income',
  'Healthcare',
  'Education',
  'Other',
];

export default function AddTransactionScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'debit' as 'credit' | 'debit',
    merchant: '',
    category: '',
    date: new Date(),
    isRecurring: false,
    account: '',
  });
  const [errors, setErrors] = useState<{
    amount?: string;
    merchant?: string;
    category?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Please enter a valid amount';
      }
    }

    if (!formData.merchant.trim()) {
      newErrors.merchant = 'Merchant/Description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !user?.id) return;

    setLoading(true);
    try {
      const amount = parseFloat(formData.amount);
      const transactionAmount = formData.type === 'credit' ? amount : -amount;

      await saveTransaction({
        userId: user.id,
        timestamp: formData.date.getTime(),
        amount: transactionAmount,
        type: formData.type,
        merchant: formData.merchant.trim(),
        category: formData.category.toLowerCase(),
        source: 'manual',
        rawMessageId: null,
        isRecurring: formData.isRecurring,
        account: formData.account.trim() || null,
      });

      Alert.alert('Success', 'Transaction added successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Add Transaction</Text>
          </View>

          <Card style={styles.card}>
            {/* Transaction Type */}
            <View style={styles.typeContainer}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeButtons}>
                <Button
                  title="Expense"
                  onPress={() => setFormData({ ...formData, type: 'debit' })}
                  variant={formData.type === 'debit' ? 'primary' : 'secondary'}
                  style={styles.typeButton}
                />
                <Button
                  title="Income"
                  onPress={() => setFormData({ ...formData, type: 'credit' })}
                  variant={formData.type === 'credit' ? 'primary' : 'secondary'}
                  style={styles.typeButton}
                />
              </View>
            </View>

            {/* Amount */}
            <Input
              label="Amount"
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              placeholder="Enter amount"
              keyboardType="decimal-pad"
              error={errors.amount}
            />

            {/* Merchant/Description */}
            <Input
              label="Merchant / Description"
              value={formData.merchant}
              onChangeText={(text) => setFormData({ ...formData, merchant: text })}
              placeholder="e.g., Grocery Store, Salary, etc."
              error={errors.merchant}
            />

            {/* Category */}
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Category</Text>
              {errors.category && (
                <Text style={styles.errorText}>{errors.category}</Text>
              )}
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                  style={styles.picker}>
                  <Picker.Item label="Select category" value="" />
                  {CATEGORIES.map((cat) => (
                    <Picker.Item key={cat} label={cat} value={cat.toLowerCase()} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Date */}
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.dateText}>
                {formData.date.toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <Text style={styles.dateHint}>
                (Currently using today's date. Date picker coming soon)
              </Text>
            </View>

            {/* Account (Optional) */}
            <Input
              label="Account (Optional)"
              value={formData.account}
              onChangeText={(text) => setFormData({ ...formData, account: text })}
              placeholder="e.g., Bank Account, Cash, UPI"
            />

            {/* Recurring Toggle */}
            <View style={styles.switchContainer}>
              <View style={styles.switchContent}>
                <Text style={styles.switchLabel}>Recurring Transaction</Text>
                <Text style={styles.switchHint}>
                  Mark if this is a recurring payment
                </Text>
              </View>
              <Switch
                value={formData.isRecurring}
                onValueChange={(value) =>
                  setFormData({ ...formData, isRecurring: value })
                }
                trackColor={{
                  false: colors.neutral.lightGray,
                  true: colors.primary.blue,
                }}
                thumbColor={colors.neutral.white}
              />
            </View>

            {/* Save Button */}
            <Button
              title="Add Transaction"
              onPress={handleSave}
              loading={loading}
              style={styles.saveButton}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.screenPadding,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.size.h1,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
  },
  card: {
    marginBottom: spacing.md,
  },
  typeContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.medium,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  typeButton: {
    flex: 1,
  },
  pickerContainer: {
    marginBottom: spacing.md,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    backgroundColor: colors.neutral.white,
    marginTop: spacing.xs,
  },
  picker: {
    height: 50,
  },
  errorText: {
    fontSize: typography.size.caption,
    color: colors.semantic.error,
    marginTop: spacing.xs,
  },
  dateText: {
    fontSize: typography.size.body,
    color: colors.neutral.black,
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
  },
  dateHint: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
    marginTop: spacing.xs,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    marginTop: spacing.sm,
  },
  switchContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchLabel: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.medium,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  switchHint: {
    fontSize: typography.size.caption,
    color: colors.neutral.darkGray,
  },
  saveButton: {
    marginTop: spacing.md,
  },
});


