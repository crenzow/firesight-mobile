import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../theme/ThemeContext';
import { SecondaryHeader } from '../../../components/navigation/SecondaryHeader';
import { useAuth } from '../../../context/AuthContext';
import { Input } from '../../../components/ui/Input';
import { SelectField } from '../../../components/ui/SelectField';
import { Button } from '../../../components/ui/Button';
import { LIAN_BARANGAYS } from '../../../constants/barangays';
import { profileService } from '../../../services/api/profileService';
import { ApiError } from '../../../services/api/client';
import { getInitials } from '../../../utils/formatters';
import { getProfileImageUri } from '../../../utils/avatar';

import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { Save } from 'lucide-react-native';
import { PhotoOptionsModal } from '../../../components/profile/PhotoPickerModal';

export default function EditProfileScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { colors, spacing, typography } = useTheme();
  const { user, updateUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [middleName, setMiddleName] = useState(user?.middle_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [suffix, setSuffix] = useState(user?.suffix ?? '');
  const [contactNumber, setContactNumber] = useState(user?.contact_number ?? '');
  const [houseNoStreet, setHouseNoStreet] = useState(user?.address?.house_no_street ?? '');
  const [barangayId, setBarangayId] = useState<number | null>(user?.address?.barangay_id ?? null);
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [removePhotoSelected, setRemovePhotoSelected] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
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
    setShowConfirmModal(true);
  };

  const performSave = async () => {
    setShowConfirmModal(false);
    setIsSaving(true);
    try {
      const updatedUser = await profileService.update({
        first_name: firstName,
        middle_name: middleName.trim() ? middleName.trim() : null,
        last_name: lastName,
        suffix: suffix.trim() ? suffix.trim() : null,
        contact_number: contactNumber,
        house_no_street: houseNoStreet,
        barangay_id: barangayId ?? undefined,
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
        onBack={() => from ? router.replace(from as any) : router.back()} 
      />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">

          {/* Profile Photo */}
          <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
            <Pressable onPress={() => setShowPhotoOptions(true)} style={styles.photoWrap}>
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
              Tap to change photo
            </Text>
          </View>

          <Input label="First Name" value={firstName} onChangeText={setFirstName} />
          <Input label="Middle Name (optional)" value={middleName} onChangeText={setMiddleName} placeholder="e.g. Santos" />
          <Input label="Last Name" value={lastName} onChangeText={setLastName} />
          <Input label="Suffix (optional)" value={suffix} onChangeText={setSuffix} placeholder="e.g. Jr., III" />
          <Input label="Mobile Number" value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" />
          <Input label="House No. / Street" value={houseNoStreet} onChangeText={setHouseNoStreet} />
          <SelectField label="Barangay" value={barangayId} options={LIAN_BARANGAYS} onSelect={(id) => setBarangayId(typeof id === 'number' ? id : Number(id))} />

          {error ? <Text style={{ color: colors.danger, fontSize: typography.size.sm, marginBottom: spacing.md }}>{error}</Text> : null}

          <Button label="Save Changes" onPress={handleSavePress} loading={isSaving} />
        </ScrollView>
      </SafeAreaView>

      {/* Confirmation Dialog before saving */}
      <ConfirmationDialog
        visible={showConfirmModal}
        type="confirm"
        title="Save Changes?"
        message="Are you sure you want to update your profile information?"
        confirmText="Save Changes"
        cancelText="Cancel"
        onConfirm={performSave}
        onCancel={() => setShowConfirmModal(false)}
        icon={<Save size={28} color="#FFFFFF" strokeWidth={2.5} />}
      />

      {/* Success Dialog after saving */}
      <ConfirmationDialog
        visible={showSuccessModal}
        type="success"
        title="Profile Updated!"
        message="Your profile details have been saved successfully."
        confirmText="Done"
        showCancel={false}
        onConfirm={handleSuccessClose}
      />

      {/* Photo Picker Options Modal (Take Photo / Gallery / Remove) */}
      <PhotoOptionsModal
        visible={showPhotoOptions}
        onClose={() => setShowPhotoOptions(false)}
        onImageSelected={(uri) => {
          setLocalImage(uri);
          setRemovePhotoSelected(false);
        }}
        onRemovePhoto={() => {
          setLocalImage(null);
          setRemovePhotoSelected(true);
        }}
        hasExistingPhoto={Boolean(profileImageUri)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontWeight: '700' },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
});