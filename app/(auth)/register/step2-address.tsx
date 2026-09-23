import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { useRegistration } from '../../../context/RegistrationContext';
import { Input } from '../../../components/ui/Input';
import { SelectField } from '../../../components/ui/SelectField';
import { Button } from '../../../components/ui/Button';
import { StepProgress } from '../../../components/ui/StepProgress';
import { LIAN_BARANGAYS } from '../../../constants/barangays';
import { validateRegisterStep2 } from '../../../utils/validators';

export default function RegisterStep2() {
  const { colors, spacing, typography } = useTheme();
  const { form, updateForm } = useRegistration();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNext = () => {
    const validationErrors = validateRegisterStep2({
      barangayId: form.barangayId,
      municipality: form.municipality,
      province: form.province,
    });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    router.push('/(auth)/register/step3-account');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.brandNavy }}>
      <SafeAreaView style={{ backgroundColor: colors.brandNavy }} edges={['top']} />
      
      <View style={{ backgroundColor: colors.brandNavy, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, paddingBottom: spacing.xl }}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginBottom: spacing.lg }}>
          <ArrowLeft size={22} color={colors.textInverse} />
        </Pressable>

        <Text style={[styles.title, { color: colors.textInverse, fontSize: typography.size.xl }]}>
          Create Account
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: 'rgba(255,255,255,0.7)', fontSize: typography.size.sm },
          ]}
        >
          Step 2 of 3 — Address Info
        </Text>
      </View>

      <View style={{ height: 24, backgroundColor: colors.brandNavy }}>
        <View style={{ flex: 1, backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxxl, flexGrow: 1 }} keyboardShouldPersistTaps="handled" style={{ backgroundColor: colors.background, flex: 1 }}>
        <View style={{ marginBottom: spacing.xl }}>
          <StepProgress currentStep={2} />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.size.lg }]}>
          Address Information
        </Text>
        <Text
          style={[
            styles.sectionHint,
            { color: colors.textMuted, fontSize: typography.size.sm, marginBottom: spacing.lg },
          ]}
        >
          Where are you located in the municipality?
        </Text>

        <Input
          label="House No. / Street"
          value={form.houseNoStreet}
          onChangeText={(t) => updateForm({ houseNoStreet: t })}
          placeholder="123 Rizal Street"
        />

        <SelectField
          label="Barangay"
          required
          value={form.barangayId}
          options={LIAN_BARANGAYS}
          onSelect={(id) => {
            updateForm({ barangayId: id });
            if (errors.barangayId) setErrors((prev) => ({ ...prev, barangayId: '' }));
          }}
          placeholder="Select your barangay"
          error={errors.barangayId}
        />

        <Input
          label="Municipality / City"
          required
          value={form.municipality}
          onChangeText={(t) => updateForm({ municipality: t })}
          error={errors.municipality}
        />

        <Input
          label="Province"
          required
          value={form.province}
          onChangeText={(t) => updateForm({ province: t })}
          error={errors.province}
        />

        <View style={[styles.row, { marginTop: spacing.lg }]}>
          <View style={styles.half}>
            <Button label="Back" variant="outline" onPress={() => router.back()} />
          </View>
          <View style={styles.half}>
            <Button label="Next" onPress={handleNext} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: '700' },
  subtitle: {},
  sectionTitle: { fontWeight: '700', marginBottom: 2 },
  sectionHint: {},
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
});