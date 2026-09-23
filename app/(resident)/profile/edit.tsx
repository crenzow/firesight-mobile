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

import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { Save } from 'lucide-react-native';

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
              Tap to change photo
            </Text>
          </View>

          <Input label="First Name" value={firstName} onChangeText={setFirstName} />
          <Input label="Middle Name (optional)" value={middleName} onChangeText={setMiddleName} placeholder="e.g. Santos" />
          <Input label="Last Name" value={lastName} onChangeText={setLastName} />
          <Input label="Suffix (optional)" value={suffix} onChangeText={setSuffix} placeholder="e.g. Jr., III" />
          <Input label="Mobile Number" value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" />
          <Input label="House No. / Street" value={houseNoStreet} onChangeText={setHouseNoStreet} />
          <SelectField label="Barangay" value={barangayId} options={LIAN_BARANGAYS} onSelect={setBarangayId} />

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
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontWeight: '700' },
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