import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Camera, Lock, Phone, Save, ShieldCheck, UserCheck } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../theme/ThemeContext';
import { SecondaryHeader } from '../../../components/navigation/SecondaryHeader';
import { useAuth } from '../../../context/AuthContext';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { profileService } from '../../../services/api/profileService';
import { ApiError } from '../../../services/api/client';
import { getInitials, formatFullName } from '../../../utils/formatters';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { Card } from '../../../components/ui/Card';
import { getProfileImageUri } from '../../../utils/avatar';
import { PhotoOptionsModal } from '../../../components/profile/PhotoPickerModal';
import { PhotoCropModal } from '../../../components/profile/PhotoCropModal';

export default function BFPEditProfileScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { colors, spacing, typography } = useTheme();
  const { user, updateUser } = useAuth();

  const [contactNumber, setContactNumber] = useState(user?.contact_number ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [removePhotoSelected, setRemovePhotoSelected] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropTargetUri, setCropTargetUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const profileImageUri = removePhotoSelected
    ? null
    : getProfileImageUri(localImage ?? user?.profile_image);
  const initials = getInitials(user?.first_name ?? '', user?.last_name ?? '');

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
        photoUri: localImage ?? undefined,
        remove_photo: removePhotoSelected,
      });
      await updateUser(updatedUser);
      setShowSuccessModal(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to save changes right now.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = useCallback(() => {
    if (showCropModal) {
      setShowCropModal(false);
      setCropTargetUri(null);
      return;
    }
    if (showPhotoOptions) {
      setShowPhotoOptions(false);
      return;
    }
    if (showConfirmModal) {
      setShowConfirmModal(false);
      return;
    }
    if (showSuccessModal) {
      setShowSuccessModal(false);
      if (from) {
        router.replace(from as any);
      } else {
        router.back();
      }
      return;
    }
    if (from) {
      router.replace(from as any);
    } else {
      router.back();
    }
  }, [showCropModal, showPhotoOptions, showConfirmModal, showSuccessModal, from]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [handleBack])
  );

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
        onBack={handleBack} 
      />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">

          {/* Profile Photo */}
          <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setShowPhotoOptions(true);
              }}
              style={({ pressed }) => [
                styles.photoWrap,
                {
                  transform: [{ scale: pressed ? 0.94 : 1 }],
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <View style={styles.photoClip}>
                {profileImageUri ? (
                  <Image source={{ uri: profileImageUri }} style={styles.photoImage} />
                ) : (
                  <View style={[styles.photoFallback, { backgroundColor: colors.brandOrange }]}>
                    <Text style={styles.photoInitials}>{initials}</Text>
                  </View>
                )}
              </View>
              <View style={[styles.photoCameraBadge, { borderColor: colors.background }]}>
                <Camera size={15} color="#FFFFFF" />
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
            <Card padding={spacing.md}>
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
            </Card>
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

      {/* Photo Options Modal */}
      <PhotoOptionsModal
        visible={showPhotoOptions}
        onClose={() => setShowPhotoOptions(false)}
        onImageSelected={(uri) => {
          setCropTargetUri(uri);
          setShowCropModal(true);
        }}
        onRemovePhoto={() => {
          setLocalImage(null);
          setRemovePhotoSelected(true);
        }}
        hasExistingPhoto={Boolean(profileImageUri)}
      />

      {/* Social-Media Style Interactive Crop & Adjust Modal */}
      <PhotoCropModal
        visible={showCropModal}
        imageUri={cropTargetUri}
        onClose={() => {
          setShowCropModal(false);
          setCropTargetUri(null);
        }}
        onCropComplete={(croppedUri) => {
          setLocalImage(croppedUri);
          setRemovePhotoSelected(false);
          setShowCropModal(false);
          setCropTargetUri(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  photoWrap: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  photoClip: {
    width: 100,
    height: 100,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
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
    bottom: -3,
    right: -3,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6D5BD0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
  },
});
