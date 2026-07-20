import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { Input } from '../../../components/ui/Input';
import { SelectField } from '../../../components/ui/SelectField';
import { Button } from '../../../components/ui/Button';
import { LIAN_BARANGAYS } from '../../../constants/barangays';
import { profileService } from '../../../services/api/profileService';
import { ApiError } from '../../../services/api/client';

export default function EditProfileScreen() {
  const { colors, spacing, typography } = useTheme();
  const { user } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [contactNumber, setContactNumber] = useState(user?.contact_number ?? '');
  const [houseNoStreet, setHouseNoStreet] = useState(user?.address?.house_no_street ?? '');
  const [barangayId, setBarangayId] = useState<number | null>(user?.address?.barangay_id ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    setIsSaving(true);
    try {
      await profileService.update({
        first_name: firstName,
        last_name: lastName,
        contact_number: contactNumber,
        house_no_street: houseNoStreet,
        barangay_id: barangayId ?? undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to save changes right now.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: typography.size.md }]}>Edit Profile</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Input label="First Name" value={firstName} onChangeText={setFirstName} />
        <Input label="Last Name" value={lastName} onChangeText={setLastName} />
        <Input label="Mobile Number" value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" />
        <Input label="House No. / Street" value={houseNoStreet} onChangeText={setHouseNoStreet} />
        <SelectField label="Barangay" value={barangayId} options={LIAN_BARANGAYS} onSelect={setBarangayId} />

        {error ? <Text style={{ color: colors.danger, fontSize: typography.size.sm, marginBottom: spacing.md }}>{error}</Text> : null}
        {success ? (
          <Text style={{ color: colors.success, fontSize: typography.size.sm, marginBottom: spacing.md }}>
            Profile updated successfully.
          </Text>
        ) : null}

        <Button label="Save Changes" onPress={handleSave} loading={isSaving} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontWeight: '700' },
});