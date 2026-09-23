import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { useRegistration } from '../../../context/RegistrationContext';
import { useAuth } from '../../../context/AuthContext';
import { Input } from '../../../components/ui/Input';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { PasswordStrengthMeter } from '../../../components/ui/PasswordStrengthMeter';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Button } from '../../../components/ui/Button';
import { StepProgress } from '../../../components/ui/StepProgress';
import { validateRegisterStep3 } from '../../../utils/validators';
import { ApiError } from '../../../services/api/client';
import { LegalModal, LegalDocType } from '../../../components/ui/LegalModal';

export default function RegisterStep3() {
  const { colors, spacing, typography } = useTheme();
  const { form, updateForm, resetForm } = useRegistration();
  const { register, isSubmitting } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Document reading tracking states
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  const [legalDocType, setLegalDocType] = useState<LegalDocType | null>(null);

  const handleCreateAccount = async () => {
    const validationErrors = validateRegisterStep3({
      email: form.email,
      password: form.password,
      confirmPassword: form.confirmPassword,
      agreedToTerms: form.agreedToTerms,
      agreedToPrivacy: agreedToPrivacy,
    });
    
    setErrors(validationErrors);
    setFormError(null);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      await register({
        first_name: form.firstName,
        middle_name: form.middleName || undefined,
        last_name: form.lastName,
        suffix: form.suffix || undefined,
        mobile_number: form.mobileNumber,
        house_no_street: form.houseNoStreet || undefined,
        barangay_id: form.barangayId as number,
        municipality: form.municipality,
        province: form.province,
        email: form.email.trim(),
        password: form.password,
      });
      resetForm();
      router.replace('/(resident)/home');
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Unable to create your account. Please try again.');
    }
  };

  const handleToggleTermsCheckbox = () => {
    if (!hasReadTerms) {
      // Open modal to force reading to bottom
      setLegalDocType('terms');
    } else {
      updateForm({ agreedToTerms: !form.agreedToTerms });
      if (errors.agreedToTerms) setErrors((prev) => ({ ...prev, agreedToTerms: '' }));
    }
  };

  const handleTogglePrivacyCheckbox = () => {
    if (!hasReadPrivacy) {
      // Open modal to force reading to bottom
      setLegalDocType('privacy');
    } else {
      setAgreedToPrivacy(!agreedToPrivacy);
      if (errors.agreedToPrivacy) setErrors((prev) => ({ ...prev, agreedToPrivacy: '' }));
    }
  };

  const handleReadComplete = () => {
    if (legalDocType === 'terms') {
      setHasReadTerms(true);
      updateForm({ agreedToTerms: true });
      if (errors.agreedToTerms) setErrors((prev) => ({ ...prev, agreedToTerms: '' }));
    } else if (legalDocType === 'privacy') {
      setHasReadPrivacy(true);
      setAgreedToPrivacy(true);
      if (errors.agreedToPrivacy) setErrors((prev) => ({ ...prev, agreedToPrivacy: '' }));
    }
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
          Step 3 of 3 — Account Info
        </Text>
      </View>

      <View style={{ height: 24, backgroundColor: colors.brandNavy }}>
        <View style={{ flex: 1, backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxxl, flexGrow: 1 }} keyboardShouldPersistTaps="handled" style={{ backgroundColor: colors.background, flex: 1 }}>
        <View style={{ marginBottom: spacing.xl }}>
          <StepProgress currentStep={3} />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.size.lg }]}>
          Account Setup
        </Text>
        <Text
          style={[
            styles.sectionHint,
            { color: colors.textMuted, fontSize: typography.size.sm, marginBottom: spacing.lg },
          ]}
        >
          Set up your login credentials.
        </Text>

        <Input
          label="Email Address"
          required
          value={form.email}
          onChangeText={(t) => {
            updateForm({ email: t });
            if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
          }}
          placeholder="Enter email address"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.email}
          leftIcon={<Mail size={18} color={colors.textMuted} />}
        />

        <PasswordInput
          label="Password"
          required
          value={form.password}
          onChangeText={(t) => {
            updateForm({ password: t });
            if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
          }}
          placeholder="Create password (min. 8)"
          error={errors.password}
        />
        <PasswordStrengthMeter password={form.password} />

        <PasswordInput
          label="Confirm Password"
          required
          value={form.confirmPassword}
          onChangeText={(t) => {
            updateForm({ confirmPassword: t });
            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
          }}
          placeholder="Confirm password"
          error={errors.confirmPassword}
        />

        {/* Clean & Premium Checkboxes */}
        <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
          <Checkbox
            checked={form.agreedToTerms}
            onToggle={handleToggleTermsCheckbox}
            error={errors.agreedToTerms}
          >
            I agree to the{' '}
            <Text
              onPress={() => setLegalDocType('terms')}
              style={{ color: colors.brandOrange, fontWeight: '600', textDecorationLine: 'underline' }}
            >
              Terms of Service
            </Text>
          </Checkbox>

          <Checkbox
            checked={agreedToPrivacy}
            onToggle={handleTogglePrivacyCheckbox}
            error={errors.agreedToPrivacy}
          >
            I agree to the{' '}
            <Text
              onPress={() => setLegalDocType('privacy')}
              style={{ color: colors.brandOrange, fontWeight: '600', textDecorationLine: 'underline' }}
            >
              Privacy Policy
            </Text>
          </Checkbox>
        </View>

        {formError ? (
          <Text style={{ color: colors.danger, fontSize: typography.size.sm, marginTop: spacing.md }}>
            {formError}
          </Text>
        ) : null}

        <View style={[styles.row, { marginTop: spacing.xl }]}>
          <View style={styles.half}>
            <Button label="Back" variant="outline" onPress={() => router.back()} disabled={isSubmitting} />
          </View>
          <View style={styles.half}>
            <Button label="Create Account" onPress={handleCreateAccount} loading={isSubmitting} />
          </View>
        </View>
      </ScrollView>

      <LegalModal
        visible={!!legalDocType}
        type={legalDocType ?? 'terms'}
        onClose={() => setLegalDocType(null)}
        onReadComplete={handleReadComplete}
        alreadyRead={legalDocType === 'terms' ? hasReadTerms : hasReadPrivacy}
      />
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