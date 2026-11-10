import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, CheckCircle2, Phone, MapPin } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { useRegistration } from '../../../context/RegistrationContext';
import { useAuth } from '../../../context/AuthContext';
import { Input } from '../../../components/ui/Input';
import { SelectField } from '../../../components/ui/SelectField';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Button } from '../../../components/ui/Button';
import { LegalModal, LegalDocType } from '../../../components/ui/LegalModal';
import { LIAN_BARANGAYS } from '../../../constants/barangays';
import { isValidPHMobile } from '../../../utils/validators';
import { ApiError } from '../../../services/api/client';

export default function CompleteGoogleProfileScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { form, updateForm, resetForm } = useRegistration();
  const { register, isSubmitting } = useAuth();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [legalDocType, setLegalDocType] = useState<LegalDocType | null>(null);

  const handleToggleTermsCheckbox = () => {
    if (!hasReadTerms) {
      setLegalDocType('terms');
    } else {
      updateForm({ agreedToTerms: !form.agreedToTerms });
      if (errors.agreedToTerms) setErrors((prev) => ({ ...prev, agreedToTerms: '' }));
    }
  };

  const handleTogglePrivacyCheckbox = () => {
    if (!hasReadPrivacy) {
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
    setLegalDocType(null);
  };

  const handleDeclineLegal = () => {
    if (legalDocType === 'terms') {
      updateForm({ agreedToTerms: false });
    } else if (legalDocType === 'privacy') {
      setAgreedToPrivacy(false);
    }
    setLegalDocType(null);
  };

  const handleComplete = async () => {
    const errs: Record<string, string> = {};

    if (!form.mobileNumber || !form.mobileNumber.trim()) {
      errs.mobileNumber = 'Mobile number is required for dispatch calls.';
    } else if (!isValidPHMobile(form.mobileNumber.trim())) {
      errs.mobileNumber = 'Please enter a valid Philippine mobile number (e.g. 09XX XXX XXXX).';
    }

    if (!form.barangayId) {
      errs.barangayId = 'Please select your barangay in Lian.';
    }

    if (!form.agreedToTerms) {
      errs.agreedToTerms = 'You must agree to the Terms of Service.';
    }

    if (!agreedToPrivacy) {
      errs.agreedToPrivacy = 'You must agree to the Privacy Policy.';
    }

    setErrors(errs);
    setFormError(null);
    if (Object.keys(errs).length > 0) return;

    try {
      await register({
        first_name: form.firstName || 'Resident',
        middle_name: form.middleName || undefined,
        last_name: form.lastName || 'User',
        suffix: form.suffix || undefined,
        mobile_number: form.mobileNumber.trim(),
        house_no_street: form.houseNoStreet ? form.houseNoStreet.trim() : undefined,
        barangay_id: form.barangayId as number,
        municipality: form.municipality || 'Lian',
        province: form.province || 'Batangas',
        email: form.email.trim(),
        google_id: form.googleId,
      });

      resetForm();
      router.replace('/(resident)/home');
    } catch (err: any) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : 'Unable to complete your registration right now. Please try again.'
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.brandNavy }}>
      <SafeAreaView style={{ backgroundColor: colors.brandNavy }} edges={['top']} />

      <View
        style={{
          backgroundColor: colors.brandNavy,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.lg,
          paddingBottom: spacing.xl,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginBottom: spacing.lg }}>
          <ChevronLeft size={24} color={colors.textInverse} strokeWidth={2.5} />
        </Pressable>

        <Text style={[styles.title, { color: colors.textInverse, fontSize: typography.size.xl }]}>
          Complete Your Profile
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: typography.size.sm, marginTop: 4 }}>
          Emergency Contact & Address Details
        </Text>
      </View>

      <View style={{ height: 24, backgroundColor: colors.brandNavy }}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: spacing.xxxl,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: colors.background, flex: 1 }}
      >
        {/* Google User Info Badge Card */}
        <View
          style={[
            styles.googleBadgeCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
              padding: spacing.md,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 }}>
            <CheckCircle2 size={18} color={colors.success} />
            <Text style={{ color: colors.textPrimary, fontSize: typography.size.sm, fontWeight: '700' }}>
              Connected with Google
            </Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs }}>
            {form.firstName} {form.lastName} • {form.email}
          </Text>
        </View>

        {/* Mobile Number for Emergency Response */}
        <Input
          label="Mobile Number"
          required
          value={form.mobileNumber}
          onChangeText={(t) => {
            updateForm({ mobileNumber: t });
            if (errors.mobileNumber) setErrors((prev) => ({ ...prev, mobileNumber: '' }));
          }}
          placeholder="0917 123 4567"
          keyboardType="phone-pad"
          error={errors.mobileNumber}
          leftIcon={<Phone size={18} color={colors.textMuted} />}
        />

        {/* House / Street / Purok */}
        <Input
          label="House No. / Street / Purok"
          value={form.houseNoStreet}
          onChangeText={(t) => updateForm({ houseNoStreet: t })}
          placeholder="House No., Street, or Purok"
          leftIcon={<MapPin size={18} color={colors.textMuted} />}
        />

        {/* Barangay Dropdown */}
        <SelectField
          label="Barangay"
          required
          placeholder="Select your barangay in Lian"
          value={form.barangayId}
          options={LIAN_BARANGAYS}
          onSelect={(id) => {
            updateForm({ barangayId: Number(id) });
            if (errors.barangayId) setErrors((prev) => ({ ...prev, barangayId: '' }));
          }}
          error={errors.barangayId}
        />

        {/* Read-Only Municipality & Province */}
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Input label="Municipality" value="Lian" editable={false} />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Province" value="Batangas" editable={false} />
          </View>
        </View>

        {/* Legal agreements */}
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
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: `${colors.danger}1A`, borderRadius: radius.md, marginTop: spacing.lg },
            ]}
          >
            <Text style={{ color: colors.danger, fontSize: typography.size.sm }}>{formError}</Text>
          </View>
        ) : null}

        <View style={{ marginTop: spacing.xl }}>
          <Button
            label="Complete Profile"
            onPress={handleComplete}
            loading={isSubmitting}
          />
        </View>
      </ScrollView>

      {legalDocType && (
        <LegalModal
          visible={!!legalDocType}
          type={legalDocType}
          onClose={() => setLegalDocType(null)}
          onReadComplete={handleReadComplete}
          onDecline={handleDeclineLegal}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '700',
  },
  googleBadgeCard: {
    borderWidth: 1,
  },
  errorBanner: {
    padding: 12,
  },
});
