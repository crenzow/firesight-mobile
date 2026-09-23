import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera, Lock, Phone, Save, ShieldCheck, UserCheck } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../theme/ThemeContext';
import { SecondaryHeader } from '../../../components/navigation/SecondaryHeader';
import { useAuth } from '../../../context/AuthContext';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { profileService } from '../../../services/api/profileService';
import { ApiError } from '../../../services/api/client';
import { getInitials, formatFullName } from '../../../utils/formatters';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { ShinyCard } from '../../../components/ui/ShinyCard';

export default function BFPEditProfileScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { colors, spacing, typography } = useTheme();
  const { user, updateUser } = useAuth();

  const [contactNumber, setContactNumber] = useState(user?.contact_number ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const profileImageUri = localImage ?? user?.profile_image ?? null;
  const initials = getInitials(user?.first_name ?? '', user?.last_name ?? '');

  const pickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setLocalImage(result.assets[0].uri);
    }
  };

  const handleSavePress = () => {
    setError(null);

    if (password) {
      if (password.length < 8) {
        setError('New password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('New password and confirmation do not match.');
        return;
      }
    }

    setShowConfirmModal(true);
  };

  const performSave = async () => {
    setShowConfirmModal(false);
    setIsSaving(true);
    try {
      const updatedUser = await profileService.update({
        contact_number: contactNumber.trim(),
        ...(password.trim() ? { password: password.trim() } : {}),
      });
      await updateUser(updatedUser);
      setShowSuccessModal(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to save changes right now.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    if (from) {
      router.replace(from as any);
    } else {
      router.back();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SecondaryHeader 
        title="Edit Profile" 
        onBack={() => (from ? router.replace(from as any) : router.back())} 
      />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">

          {/* Profile Photo */}
          <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
            <Pressable onPress={pickProfileImage} style={styles.photoWrap}>
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={styles.photoImage} />
              ) : (
                <View style={[styles.photoFallback, { backgroundColor: colors.brandOrange }]}>
                  <Text style={styles.photoInitials}>{initials}</Text>
                </View>
              )}
              <View style={styles.photoCameraBadge}>
                <Camera size={14} color="#FFFFFF" />
              </View>
            </Pressable>
            <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: spacing.sm }}>
              Tap to change profile picture
            </Text>
          </View>

          {/* Locked / Read-Only Personnel Summary Card */}
          <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, fontWeight: '700', marginBottom: spacing.xs }}>
            OFFICER IDENTIFICATION (LOCKED)
          </Text>
          <View style={{ marginBottom: spacing.lg }}>
            <ShinyCard padding={spacing.md}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <UserCheck size={18} color={colors.brandOrange} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: typography.size.sm, fontWeight: '700' }}>
                    {formatFullName(user?.first_name ?? '', user?.last_name ?? '', user?.middle_name, user?.suffix)}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 1 }}>
                    {user?.email} · Fire Officer II
                  </Text>
                </View>
                <ShieldCheck size={16} color={colors.success} />
              </View>
            </ShinyCard>
          </View>

          {/* Editable Fields */}
          <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, fontWeight: '700', marginBottom: spacing.sm }}>
            EDITABLE INFORMATION
          </Text>

          <Input
            label="Mobile Contact Number"
            value={contactNumber}
            onChangeText={setContactNumber}
            keyboardType="phone-pad"
            placeholder="09171234567"
          />

          <View style={{ marginTop: spacing.md }}>
            <Input
              label="New Password (optional)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Min 8 characters"
            />
          </View>

          <View style={{ marginTop: spacing.xs }}>
            <Input
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Re-enter new password"
            />
          </View>

          <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 2, marginBottom: spacing.lg }}>
            Leave password blank if you do not wish to change it.
          </Text>

          {error ? (
            <Text style={{ color: colors.danger, fontSize: typography.size.sm, marginBottom: spacing.md }}>{error}</Text>
          ) : null}

          <Button label="Save Changes" onPress={handleSavePress} loading={isSaving} icon={<Save size={16} color="#FFFFFF" />} />
        </ScrollView>
      </SafeAreaView>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        visible={showConfirmModal}
        type="confirm"
        title="Save Profile Changes?"
        message="Are you sure you want to update your profile photo, contact number, or password?"
        confirmText="Save Changes"
        cancelText="Cancel"
        onConfirm={performSave}
        onCancel={() => setShowConfirmModal(false)}
        icon={<Save size={28} color="#FFFFFF" strokeWidth={2.5} />}
      />

      {/* Success Dialog */}
      <ConfirmationDialog
        visible={showSuccessModal}
        type="success"
        title="Profile Updated!"
        message="Your BFP personnel details have been updated successfully."
        confirmText="Done"
        showCancel={false}
        onConfirm={handleSuccessClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  photoWrap: {
    width: 100,
    height: 100,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitials: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  photoCameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#6D5BD0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
