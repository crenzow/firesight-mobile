import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { useRegistration } from '../../../context/RegistrationContext';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { StepProgress } from '../../../components/ui/StepProgress';
import { validateRegisterStep1 } from '../../../utils/validators';

export default function RegisterStep1() {
  const { colors, spacing, typography } = useTheme();
  const { form, updateForm } = useRegistration();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNext = () => {
    const validationErrors = validateRegisterStep1({
      firstName: form.firstName,
      lastName: form.lastName,
      mobileNumber: form.mobileNumber,
    });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    router.push('/(auth)/register/step2-address');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginBottom: spacing.lg }}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>

        <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.size.xl }]}>
          Create Account
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: colors.textSecondary, fontSize: typography.size.sm, marginBottom: spacing.lg },
          ]}
        >
          Step 1 of 3 — Personal Info
        </Text>

        <View style={{ marginBottom: spacing.xl }}>
          <StepProgress currentStep={1} />
        </View>

        <Text
          style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.size.lg, marginBottom: 2 }]}
        >
          Personal Information
        </Text>
        <Text
          style={[
            styles.sectionHint,
            { color: colors.textMuted, fontSize: typography.size.sm, marginBottom: spacing.lg },
          ]}
        >
          Enter your name and contact number.
        </Text>

        <View style={styles.row}>
          <View style={styles.half}>
            <Input
              label="First Name"
              required
              value={form.firstName}
              onChangeText={(t) => {
                updateForm({ firstName: t });
                if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: '' }));
              }}
              placeholder="Juan"
              error={errors.firstName}
            />
          </View>
          <View style={styles.half}>
            <Input
              label="Last Name"
              required
              value={form.lastName}
              onChangeText={(t) => {
                updateForm({ lastName: t });
                if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: '' }));
              }}
              placeholder="Dela Cruz"
              error={errors.lastName}
            />
          </View>
        </View>

        <Input
          label="Middle Name (optional)"
          value={form.middleName}
          onChangeText={(t) => updateForm({ middleName: t })}
          placeholder="Santos"
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <Input
              label="Suffix (opt.)"
              value={form.suffix}
              onChangeText={(t) => updateForm({ suffix: t })}
              placeholder="Jr."
            />
          </View>
          <View style={styles.half}>
            <Input
              label="Mobile No."
              required
              value={form.mobileNumber}
              onChangeText={(t) => {
                updateForm({ mobileNumber: t });
                if (errors.mobileNumber) setErrors((prev) => ({ ...prev, mobileNumber: '' }));
              }}
              placeholder="09XX XXX XXXX"
              keyboardType="phone-pad"
              error={errors.mobileNumber}
            />
          </View>
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <Button label="Next" onPress={handleNext} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: '700' },
  subtitle: {},
  sectionTitle: { fontWeight: '700' },
  sectionHint: {},
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
});