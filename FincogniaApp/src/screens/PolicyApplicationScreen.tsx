/**
 * Policy Application Screen
 * Comprehensive form with 20-25 fields for policy application
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { colors, typography, spacing, borderRadius } from '../constants/designTokens';
import { useAuthStore } from '../store/useAuthStore';
import { fetchUserDataFromFirebase, autoFillFormWithAI } from '../services/policyFormService';
import { submitPolicyApplication } from '../services/policyApplicationService';
import { requestBiometricAuth } from '../utils/biometricAuth';
import type { PolicyFormData, PolicyType } from '../types/policyForm';
import type { PolicyRecommendation } from '../services/documentAnalysisService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

type PolicyApplicationRouteParams = {
  PolicyApplication: {
    policy: PolicyRecommendation;
    policyType: PolicyType;
  };
};

export default function PolicyApplicationScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<PolicyApplicationRouteParams, 'PolicyApplication'>>();
  const { policy, policyType } = route.params;
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState<Partial<PolicyFormData>>({});
  const [loading, setLoading] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Initialize form with empty values
    initializeForm();
  }, []);

  const initializeForm = () => {
    const initialData: Partial<PolicyFormData> = {
      permanentAddressSame: true,
      declarationConsent: false,
      medicalDisclosureConsent: false,
      paymentMethod: '',
      gender: '',
      howDidYouHear: '',
      additionalNotes: '',
    };
    setFormData(initialData);
  };

  const handleAutoFill = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setAutoFilling(true);
      
      // Fetch user data from Firebase
      const userData = await fetchUserDataFromFirebase(user.id);
      
      // Call auto-fill service
      const result = await autoFillFormWithAI(policyType, userData, policy);
      
      // Update form data with auto-filled values
      setFormData(result.formData);
      
      // Auto-fill completed silently - no alert needed
    } catch (error) {
      console.error('Error auto-filling form:', error);
      Alert.alert('Auto-fill Failed', error instanceof Error ? error.message : 'Failed to auto-fill form. Please try again.');
    } finally {
      setAutoFilling(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required fields validation
    if (!formData.fullName?.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.dateOfBirth?.trim()) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.email?.trim()) newErrors.email = 'Email is required';
    if (!formData.phoneNumber?.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.aadhaarNumber?.trim()) newErrors.aadhaarNumber = 'Aadhaar number is required';
    if (!formData.currentAddress?.trim()) newErrors.currentAddress = 'Current address is required';
    if (!formData.city?.trim()) newErrors.city = 'City is required';
    if (!formData.state?.trim()) newErrors.state = 'State is required';
    if (!formData.pincode?.trim()) newErrors.pincode = 'Pincode is required';
    if (!formData.nomineeName?.trim()) newErrors.nomineeName = 'Nominee name is required';
    if (!formData.nomineeRelationship?.trim()) newErrors.nomineeRelationship = 'Nominee relationship is required';
    if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method is required';
    
    // Policy-specific validations
    if (policyType === 'bike') {
      if (!formData.bikeMake?.trim()) newErrors.bikeMake = 'Bike make is required';
      if (!formData.bikeModel?.trim()) newErrors.bikeModel = 'Bike model is required';
      if (!formData.registrationNumber?.trim()) newErrors.registrationNumber = 'Registration number is required';
    }
    
    if (!formData.declarationConsent) {
      newErrors.declarationConsent = 'You must accept the declaration';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setLoading(true);

      // Step 1: Request biometric authentication
      Alert.alert(
        'Digital Signature Required',
        'Please authenticate to sign and submit your application.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setLoading(false);
            },
          },
          {
            text: 'Continue',
            onPress: async () => {
              try {
                let authResult;
                try {
                  authResult = await requestBiometricAuth(
                    'Sign your policy application'
                  );
                } catch (authError) {
                  console.error('[Policy Application] Authentication error:', authError);
                  Alert.alert(
                    'Authentication Unavailable',
                    'Biometric authentication is not available on this device. Please ensure the app has been rebuilt after installing the biometric library.',
                    [{ text: 'OK', onPress: () => setLoading(false) }]
                  );
                  return;
                }

                if (!authResult.success) {
                  if (authResult.error !== 'Authentication cancelled') {
                    Alert.alert('Authentication Failed', authResult.error || 'Could not verify your identity. Please try again.');
                  }
                  setLoading(false);
                  return;
                }

                // Step 2: Generate signature data
                const signatureData = {
                  timestamp: new Date().toISOString(),
                  authMethod: authResult.signature?.includes('passcode') ? 'passcode' : 'biometric',
                  signatureHash: authResult.signature || 'verified_' + Date.now(),
                };

                // Step 3: Submit application (generates PDF and sends email)
                Alert.alert('Submitting...', 'Generating PDF and sending to your email. This may take a moment.');

                const result = await submitPolicyApplication(
                  formData as Partial<PolicyFormData>,
                  policy,
                  signatureData
                );

                if (result.success) {
                  Alert.alert(
                    'Application Submitted! 🎉',
                    `${result.message}\n\nCheck your email (${formData.email || user.email}) for the complete PDF document.`,
                    [
                      {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                      },
                    ]
                  );
                } else {
                  throw new Error(result.message || 'Submission failed');
                }
              } catch (error) {
                console.error('Error submitting application:', error);
                Alert.alert(
                  'Submission Failed',
                  error instanceof Error ? error.message : 'Failed to submit application. Please try again.'
                );
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const updateField = (field: keyof PolicyFormData, value: any) => {
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
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Policy Application</Text>
            <Text style={styles.subtitle}>{policy.name} - {policy.provider}</Text>
          </View>

          {/* Auto-fill Button */}
          <Card style={styles.autoFillCard}>
            <Button
              title={autoFilling ? 'Auto-filling...' : '🤖 Auto-fill with AI'}
              onPress={handleAutoFill}
              disabled={autoFilling}
              loading={autoFilling}
              variant="secondary"
            />
            <Text style={styles.autoFillHint}>
              Fill all fields automatically using your profile data and AI-generated realistic values
            </Text>
          </Card>

          {/* Personal Information Section */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <Input
              label="Full Name *"
              value={formData.fullName || ''}
              onChangeText={(text) => updateField('fullName', text)}
              placeholder="Enter your full name"
              error={errors.fullName}
            />

            <Input
              label="Date of Birth *"
              value={formData.dateOfBirth || ''}
              onChangeText={(text) => updateField('dateOfBirth', text)}
              placeholder="YYYY-MM-DD"
              error={errors.dateOfBirth}
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Gender *</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.gender}
                  onValueChange={(value) => updateField('gender', value)}
                  style={styles.picker}>
                  <Picker.Item label="Select gender" value="" />
                  <Picker.Item label="Male" value="Male" />
                  <Picker.Item label="Female" value="Female" />
                  <Picker.Item label="Other" value="Other" />
                </Picker>
              </View>
            </View>

            <Input
              label="Email *"
              value={formData.email || ''}
              onChangeText={(text) => updateField('email', text)}
              placeholder="your.email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="Phone Number *"
              value={formData.phoneNumber || ''}
              onChangeText={(text) => updateField('phoneNumber', text)}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              maxLength={10}
              error={errors.phoneNumber}
            />

            <Input
              label="Alternate Phone"
              value={formData.alternatePhone || ''}
              onChangeText={(text) => updateField('alternatePhone', text)}
              placeholder="10-digit alternate number"
              keyboardType="phone-pad"
              maxLength={10}
            />

            <Input
              label="Aadhaar Number *"
              value={formData.aadhaarNumber || ''}
              onChangeText={(text) => updateField('aadhaarNumber', text)}
              placeholder="12-digit Aadhaar number"
              keyboardType="number-pad"
              maxLength={12}
              error={errors.aadhaarNumber}
            />
          </Card>

          {/* Address Information Section */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Address Information</Text>
            
            <Input
              label="Current Address *"
              value={formData.currentAddress || ''}
              onChangeText={(text) => updateField('currentAddress', text)}
              placeholder="Flat/Apartment, Building, Area"
              multiline
              numberOfLines={3}
              error={errors.currentAddress}
            />

            <Input
              label="City *"
              value={formData.city || ''}
              onChangeText={(text) => updateField('city', text)}
              placeholder="Enter city"
              error={errors.city}
            />

            <Input
              label="State *"
              value={formData.state || ''}
              onChangeText={(text) => updateField('state', text)}
              placeholder="Enter state"
              error={errors.state}
            />

            <Input
              label="Pincode *"
              value={formData.pincode || ''}
              onChangeText={(text) => updateField('pincode', text)}
              placeholder="6-digit pincode"
              keyboardType="number-pad"
              maxLength={6}
              error={errors.pincode}
            />

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Permanent Address Same as Current</Text>
              <Switch
                value={formData.permanentAddressSame ?? true}
                onValueChange={(value) => updateField('permanentAddressSame', value)}
                trackColor={{ false: colors.neutral.mediumGray, true: colors.primary.blue }}
                thumbColor={colors.neutral.white}
              />
            </View>
          </Card>

          {/* Policy-Specific Fields */}
          {policyType === 'bike' && (
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Bike Details</Text>
              
              <Input
                label="Bike Make *"
                value={formData.bikeMake || ''}
                onChangeText={(text) => updateField('bikeMake', text)}
                placeholder="e.g., Honda, Bajaj, Hero"
                error={errors.bikeMake}
              />

              <Input
                label="Bike Model *"
                value={formData.bikeModel || ''}
                onChangeText={(text) => updateField('bikeModel', text)}
                placeholder="e.g., Activa, Pulsar, Splendor"
                error={errors.bikeModel}
              />

              <Input
                label="Registration Number *"
                value={formData.registrationNumber || ''}
                onChangeText={(text) => updateField('registrationNumber', text)}
                placeholder="e.g., MH12AB1234"
                autoCapitalize="characters"
                error={errors.registrationNumber}
              />

              <Input
                label="Year of Manufacture"
                value={formData.yearOfManufacture || ''}
                onChangeText={(text) => updateField('yearOfManufacture', text)}
                placeholder="YYYY"
                keyboardType="number-pad"
                maxLength={4}
              />

              <Input
                label="Engine CC"
                value={formData.engineCC || ''}
                onChangeText={(text) => updateField('engineCC', text)}
                placeholder="e.g., 125cc, 150cc"
              />
            </Card>
          )}

          {policyType === 'health' && (
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Health Information</Text>
              
              <Input
                label="Height (cm)"
                value={formData.height || ''}
                onChangeText={(text) => updateField('height', text)}
                placeholder="Height in centimeters"
                keyboardType="number-pad"
              />

              <Input
                label="Weight (kg)"
                value={formData.weight || ''}
                onChangeText={(text) => updateField('weight', text)}
                placeholder="Weight in kilograms"
                keyboardType="number-pad"
              />

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Blood Group</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={formData.bloodGroup}
                    onValueChange={(value) => updateField('bloodGroup', value)}
                    style={styles.picker}>
                    <Picker.Item label="Select blood group" value="" />
                    <Picker.Item label="A+" value="A+" />
                    <Picker.Item label="A-" value="A-" />
                    <Picker.Item label="B+" value="B+" />
                    <Picker.Item label="B-" value="B-" />
                    <Picker.Item label="O+" value="O+" />
                    <Picker.Item label="O-" value="O-" />
                    <Picker.Item label="AB+" value="AB+" />
                    <Picker.Item label="AB-" value="AB-" />
                  </Picker>
                </View>
              </View>

              <Input
                label="Pre-existing Conditions"
                value={formData.preExistingConditions || ''}
                onChangeText={(text) => updateField('preExistingConditions', text)}
                placeholder="None or describe conditions"
                multiline
                numberOfLines={2}
              />

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Any Existing Health Insurance</Text>
                <Switch
                  value={formData.anyExistingHealthInsurance ?? false}
                  onValueChange={(value) => updateField('anyExistingHealthInsurance', value)}
                  trackColor={{ false: colors.neutral.mediumGray, true: colors.primary.blue }}
                  thumbColor={colors.neutral.white}
                />
              </View>

              {formData.anyExistingHealthInsurance && (
                <Input
                  label="Existing Policy Number"
                  value={formData.existingPolicyNumber || ''}
                  onChangeText={(text) => updateField('existingPolicyNumber', text)}
                  placeholder="Enter existing policy number"
                />
              )}
            </Card>
          )}

          {policyType === 'accident' && (
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Occupation Details</Text>
              
              <Input
                label="Occupation"
                value={formData.occupation || ''}
                onChangeText={(text) => updateField('occupation', text)}
                placeholder="e.g., Delivery Driver, Cab Driver"
              />

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Employment Type</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={formData.employmentType}
                    onValueChange={(value) => updateField('employmentType', value)}
                    style={styles.picker}>
                    <Picker.Item label="Select employment type" value="" />
                    <Picker.Item label="Self-Employed" value="Self-Employed" />
                    <Picker.Item label="Contractor" value="Contractor" />
                    <Picker.Item label="Freelancer" value="Freelancer" />
                  </Picker>
                </View>
              </View>

              <Input
                label="Preferred Coverage Amount"
                value={formData.preferredCoverageAmount || ''}
                onChangeText={(text) => updateField('preferredCoverageAmount', text)}
                placeholder="e.g., ₹5 Lakh, ₹10 Lakh"
              />
            </Card>
          )}

          {policyType === 'income' && (
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Income Details</Text>
              
              <Input
                label="Monthly Income"
                value={formData.monthlyIncome || ''}
                onChangeText={(text) => updateField('monthlyIncome', text)}
                placeholder="Monthly income in ₹"
                keyboardType="number-pad"
              />

              <Input
                label="Occupation Details"
                value={formData.occupationDetails || ''}
                onChangeText={(text) => updateField('occupationDetails', text)}
                placeholder="Detailed occupation description"
                multiline
                numberOfLines={2}
              />

              <Input
                label="Disability History"
                value={formData.disabilityHistory || ''}
                onChangeText={(text) => updateField('disabilityHistory', text)}
                placeholder="None or describe"
                multiline
                numberOfLines={2}
              />
            </Card>
          )}

          {/* Nominee Information Section */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Nominee Information</Text>
            
            <Input
              label="Nominee Name *"
              value={formData.nomineeName || ''}
              onChangeText={(text) => updateField('nomineeName', text)}
              placeholder="Full name of nominee"
              error={errors.nomineeName}
            />

            <Input
              label="Relationship *"
              value={formData.nomineeRelationship || ''}
              onChangeText={(text) => updateField('nomineeRelationship', text)}
              placeholder="e.g., Spouse, Parent, Sibling"
              error={errors.nomineeRelationship}
            />

            <Input
              label="Nominee Date of Birth"
              value={formData.nomineeDateOfBirth || ''}
              onChangeText={(text) => updateField('nomineeDateOfBirth', text)}
              placeholder="YYYY-MM-DD"
            />

            <Input
              label="Nominee Phone Number"
              value={formData.nomineePhoneNumber || ''}
              onChangeText={(text) => updateField('nomineePhoneNumber', text)}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              maxLength={10}
            />

            <Input
              label="Nominee Address"
              value={formData.nomineeAddress || ''}
              onChangeText={(text) => updateField('nomineeAddress', text)}
              placeholder="Nominee's address"
              multiline
              numberOfLines={2}
            />
          </Card>

          {/* Payment Information Section */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Payment Information</Text>
            
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Payment Method *</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.paymentMethod}
                  onValueChange={(value) => updateField('paymentMethod', value)}
                  style={styles.picker}>
                  <Picker.Item label="Select payment method" value="" />
                  <Picker.Item label="UPI" value="UPI" />
                  <Picker.Item label="Card" value="Card" />
                  <Picker.Item label="Net Banking" value="Net Banking" />
                  <Picker.Item label="Bank Transfer" value="Bank Transfer" />
                </Picker>
              </View>
            </View>

            <Input
              label="Bank Account Number"
              value={formData.bankAccountNumber || ''}
              onChangeText={(text) => updateField('bankAccountNumber', text)}
              placeholder="Bank account number"
              keyboardType="number-pad"
            />

            <Input
              label="IFSC Code"
              value={formData.ifscCode || ''}
              onChangeText={(text) => updateField('ifscCode', text.toUpperCase())}
              placeholder="11-character IFSC code"
              autoCapitalize="characters"
              maxLength={11}
            />
          </Card>

          {/* Additional Details Section */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Additional Details</Text>
            
            <Input
              label="How did you hear about us?"
              value={formData.howDidYouHear || ''}
              onChangeText={(text) => updateField('howDidYouHear', text)}
              placeholder="Referral, Friend, Online Ad, etc."
            />

            <Input
              label="Additional Notes"
              value={formData.additionalNotes || ''}
              onChangeText={(text) => updateField('additionalNotes', text)}
              placeholder="Any additional information"
              multiline
              numberOfLines={3}
            />
          </Card>

          {/* Declaration Section */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Declaration</Text>
            
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>I agree to the terms and conditions *</Text>
              <Switch
                value={formData.declarationConsent ?? false}
                onValueChange={(value) => updateField('declarationConsent', value)}
                trackColor={{ false: colors.neutral.mediumGray, true: colors.primary.blue }}
                thumbColor={colors.neutral.white}
              />
            </View>
            {errors.declarationConsent && (
              <Text style={styles.errorText}>{errors.declarationConsent}</Text>
            )}

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>I consent to medical disclosure</Text>
              <Switch
                value={formData.medicalDisclosureConsent ?? false}
                onValueChange={(value) => updateField('medicalDisclosureConsent', value)}
                trackColor={{ false: colors.neutral.mediumGray, true: colors.primary.blue }}
                thumbColor={colors.neutral.white}
              />
            </View>
          </Card>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <Button
              title="Sign & Submit Application"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
            />
          </View>
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
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.size.h1,
    fontWeight: typography.weight.bold,
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
  },
  autoFillCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.primary.blue + '10',
  },
  autoFillHint: {
    fontSize: typography.size.caption,
    color: colors.neutral.mediumGray,
    marginTop: spacing.xs,
    textAlign: 'center',
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
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  switchLabel: {
    fontSize: typography.size.body,
    color: colors.neutral.black,
    flex: 1,
    marginRight: spacing.sm,
  },
  submitContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  errorText: {
    fontSize: typography.size.caption,
    color: colors.semantic.error,
    marginTop: spacing.xs,
  },
});

