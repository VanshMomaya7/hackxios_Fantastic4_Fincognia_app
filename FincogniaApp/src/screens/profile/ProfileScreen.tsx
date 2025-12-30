/**
 * Profile Screen
 * Display and edit user profile
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { useAuthStore } from '../../store/useAuthStore';
import { getUserProfile, updateUserProfile } from '../../services/userService';
import { Button, Card, Input } from '../../components/ui';
import { colors, typography, spacing } from '../../constants/designTokens';
import type { UserProfileData } from '../../services/userService';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    incomeType: 'gig' as 'gig' | 'freelance' | 'salaried' | 'mixed' | null,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const userProfile = await getUserProfile(user.id);
      if (userProfile) {
        setProfile(userProfile);
        setFormData({
          fullName: userProfile.fullName || '',
          incomeType: userProfile.incomeType || null,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      await updateUserProfile(user.id, {
        fullName: formData.fullName || null,
        incomeType: formData.incomeType,
      });
      await loadProfile();
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.blue} />
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{profile?.email || user?.email || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Member Since</Text>
            <Text style={styles.value}>
              {profile?.createdAt ? formatDate(profile.createdAt) : 'N/A'}
            </Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profile Details</Text>
            {!editing && (
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Text style={styles.editButton}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
            <>
              <Input
                label="Full Name"
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                placeholder="Enter your full name"
                containerStyle={styles.inputContainer}
              />

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Income Type</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={formData.incomeType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, incomeType: value })
                    }
                    style={styles.picker}>
                    <Picker.Item label="Select income type" value={null} />
                    <Picker.Item label="Gig Worker" value="gig" />
                    <Picker.Item label="Freelancer" value="freelance" />
                    <Picker.Item label="Salaried" value="salaried" />
                    <Picker.Item label="Mixed" value="mixed" />
                  </Picker>
                </View>
              </View>

              <View style={styles.buttonRow}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setEditing(false);
                    if (profile) {
                      setFormData({
                        fullName: profile.fullName || '',
                        incomeType: profile.incomeType || null,
                      });
                    }
                  }}
                  variant="secondary"
                  style={styles.button}
                />
                <Button
                  title="Save"
                  onPress={handleSave}
                  loading={saving}
                  style={styles.button}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Full Name</Text>
                <Text style={styles.value}>
                  {profile?.fullName || 'Not set'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Income Type</Text>
                <Text style={styles.value}>
                  {profile?.incomeType
                    ? profile.incomeType.charAt(0).toUpperCase() +
                      profile.incomeType.slice(1)
                    : 'Not set'}
                </Text>
              </View>
            </>
          )}
        </Card>

        <Card style={styles.card}>
          <Button
            title="Sign Out"
            onPress={handleLogout}
            variant="secondary"
            style={styles.logoutButton}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.screenPadding,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.h2,
    fontWeight: typography.weight.semiBold,
    color: colors.neutral.black,
    marginBottom: spacing.md,
  },
  editButton: {
    fontSize: typography.size.body,
    color: colors.primary.blue,
    fontWeight: typography.weight.semiBold,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  label: {
    fontSize: typography.size.body,
    color: colors.neutral.darkGray,
  },
  value: {
    fontSize: typography.size.body,
    color: colors.neutral.black,
    fontWeight: typography.weight.medium,
  },
  inputContainer: {
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
    borderRadius: 12,
    backgroundColor: colors.neutral.white,
  },
  picker: {
    height: 50,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
  },
  logoutButton: {
    marginTop: spacing.sm,
  },
});


