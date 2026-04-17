/**
 * Social Security Screen
 * Mock e-Shram registration flow with auto-fill and PDF generation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { colors, typography, spacing, borderRadius } from '../constants/designTokens';
import { useAuthStore } from '../store/useAuthStore';
import { getUserProfile } from '../services/userService';
import { autoFillMockForm, submitMockForm } from '../services/socialSecurityService';
import { requestBiometricAuth } from '../utils/biometricAuth';
import type { MockEShramForm } from '../services/socialSecurityService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli',
  'Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

const INCOME_RANGES = [
  { label: 'Less than ₹1 Lakh/year', value: '<1L' },
  { label: '₹1 Lakh - ₹3 Lakh/year', value: '1-3L' },
  { label: '₹3 Lakh - ₹5 Lakh/year', value: '3-5L' },
  { label: 'More than ₹5 Lakh/year', value: '>5L' },
];

const LABOUR_LAW_QUESTIONS = [
  'What benefits does e-Shram give a delivery worker?',
  'What accident coverage am I entitled to?',
  'What are my rights as a gig worker?',
  'How does e-Shram pension work?',
];

export default function SocialSecurityScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState<MockEShramForm>({
    name: '',
    mobile: '',
    email: '',
    ageOrDob: '',
    state: '',
    occupation: '',
    incomeRange: '',
  });
  const [autoFilling, setAutoFilling] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load user profile data
    if (user?.id) {
      loadUserProfile();
    }
  }, [user?.id]);

  const loadUserProfile = async () => {
    if (!user?.id) return;

    try {
      const profile = await getUserProfile(user.id);
      if (profile) {
        setFormData(prev => ({
          ...prev,
          name: profile.fullName || '',
          email: profile.email || '',
        }));
      }
    } catch (error) {
      console.error('[Social Security] Error loading profile:', error);
    }
  };

  const handleAutoFill = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setAutoFilling(true);
      const result = await autoFillMockForm(user.id);
      
      // Update form with auto-filled values
      setFormData(result);
      
      if (result.notes) {
        // Silently auto-fill, no alert needed
        console.log('[Social Security] Auto-fill notes:', result.notes);
      }
    } catch (error) {
      console.error('[Social Security] Error auto-filling:', error);
      Alert.alert('Auto-fill Failed', error instanceof Error ? error.message : 'Failed to auto-fill form. Please try again.');
    } finally {
      setAutoFilling(false);
    }
  };

  const handleAskAboutLabourLaws = () => {
    // Show question options
    Alert.alert(
      'Ask About Labour Laws',
      'Choose a question to ask the PaisaBuddy Agent:',
      [
        ...LABOUR_LAW_QUESTIONS.map(question => ({
          text: question,
          onPress: () => {
            // Navigate to Agent screen - for now just navigate, could pass message later
            navigation.navigate('Agent' as never);
            // Note: In a full implementation, you'd pass the question as a param
            // For now, user can ask manually
          },
        })),
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) newErrors.name = 'Name is required';
    if (!formData.mobile?.trim()) newErrors.mobile = 'Mobile number is required';
    if (!formData.email?.trim()) newErrors.email = 'Email is required';
    if (!formData.ageOrDob?.trim()) newErrors.ageOrDob = 'Age or Date of Birth is required';
    if (!formData.state?.trim()) newErrors.state = 'State is required';
    if (!formData.occupation?.trim()) newErrors.occupation = 'Occupation is required';
    if (!formData.incomeRange?.trim()) newErrors.incomeRange = 'Income range is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      // Request biometric authentication
      const authResult = await requestBiometricAuth('Confirm to generate your Social Security Pack');

      if (!authResult.success) {
        if (authResult.error?.includes('cancelled')) {
          return; // User cancelled, don't show error
        }
        Alert.alert('Authentication Failed', authResult.error || 'Please try again.');
        return;
      }

      // Submit form
      setSubmitting(true);
      const result = await submitMockForm(user.id, formData);

      if (result.success) {
        Alert.alert(
          'Success!',
          result.message || 'We\'ve emailed you a mock e-Shram registration and your benefits summary.',
          [{ text: 'OK' }]
        );
        // Optionally reset form or navigate back
      } else {
        Alert.alert('Error', result.message || 'Failed to submit form. Please try again.');
      }
    } catch (error) {
      console.error('[Social Security] Error submitting:', error);
      Alert.alert('Submission Failed', error instanceof Error ? error.message : 'Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: keyof MockEShramForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          
          {/* Know Your Rights Section */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Know Your Rights</Text>
            <Text style={styles.infoText}>
              e-Shram is India's national database for unorganized workers. It provides access to social security benefits like insurance, pension, and accident coverage.
            </Text>
            {/* <View style={styles.mockWarning}>
              <Text style={styles.warningText}>
                ⚠️ This is a <Text style={styles.warningBold}>form</Text> for educational purposes only. It is not an official e-Shram registration.
              </Text>
            </View> */}
            <Button
              title="Ask about labour laws"
              onPress={handleAskAboutLabourLaws}
              variant="secondary"
              style={styles.askButton}
            />
          </Card>

          {/* Mock e-Shram Form Section */}
          <Card style={styles.sectionCard}>
            <View style={styles.formHeader}>
              <Text style={styles.sectionTitle}>E-Shram Form</Text>
              <Button
                title={autoFilling ? 'Auto-filling...' : 'Auto-fill with Agent'}
                onPress={handleAutoFill}
                variant="text"
                disabled={autoFilling}
                style={styles.autoFillButton}
              />
            </View>

            <Input
              label="Name *"
              value={formData.name}
              onChangeText={(text) => updateField('name', text)}
              placeholder="Enter your full name"
              error={errors.name}
            />

            <Input
              label="Mobile Number *"
              value={formData.mobile}
              onChangeText={(text) => updateField('mobile', text)}
              placeholder="Enter your mobile number"
              keyboardType="phone-pad"
              error={errors.mobile}
            />

            <Input
              label="Email *"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="Age or Date of Birth *"
              value={formData.ageOrDob}
              onChangeText={(text) => updateField('ageOrDob', text)}
              placeholder="e.g., 28 or DD/MM/YYYY"
              error={errors.ageOrDob}
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>State *</Text>
              {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.state}
                  onValueChange={(value) => updateField('state', value)}
                  style={styles.picker}>
                  <Picker.Item label="Select your state" value="" />
                  {INDIAN_STATES.map((state) => (
                    <Picker.Item key={state} label={state} value={state} />
                  ))}
                </Picker>
              </View>
            </View>

            <Input
              label="Occupation *"
              value={formData.occupation}
              onChangeText={(text) => updateField('occupation', text)}
              placeholder="e.g., Delivery Worker, Driver, Freelancer"
              error={errors.occupation}
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Annual Income Range *</Text>
              {errors.incomeRange && <Text style={styles.errorText}>{errors.incomeRange}</Text>}
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.incomeRange}
                  onValueChange={(value) => updateField('incomeRange', value)}
                  style={styles.picker}>
                  <Picker.Item label="Select income range" value="" />
                  {INCOME_RANGES.map((range) => (
                    <Picker.Item key={range.value} label={range.label} value={range.value} />
                  ))}
                </Picker>
              </View>
            </View>
          </Card>

          {/* Confirm & Generate Section */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Confirm & Generate</Text>
            <Text style={styles.infoText}>
              Once you confirm, we'll generate a mock e-Shram registration form and benefits summary. This will be sent to your email as a PDF.
            </Text>
            <Button
              title={submitting ? 'Generating...' : 'Confirm & Generate My Social Security Pack'}
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting}
              style={styles.submitButton}
            />
            {autoFilling && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary.blue} />
                <Text style={styles.loadingText}>Auto-filling form...</Text>
              </View>
            )}
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xl,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.md,
  },
  infoText: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
    lineHeight: typography.lineHeight.body * typography.size.body,
    marginBottom: spacing.md,
  },
  mockWarning: {
    backgroundColor: colors.semantic.warning + '20',
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.semantic.warning,
  },
  warningText: {
    fontSize: typography.size.caption,
    color: colors.neutral.black,
    lineHeight: typography.lineHeight.caption * typography.size.caption,
  },
  warningBold: {
    fontWeight: typography.weight.bold,
  },
  askButton: {
    marginTop: spacing.sm,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  autoFillButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
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
    borderRadius: borderRadius.medium,
    backgroundColor: colors.neutral.white,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  errorText: {
    fontSize: typography.size.caption,
    color: colors.semantic.error,
    marginTop: spacing.xs,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.medium,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
  },
});

