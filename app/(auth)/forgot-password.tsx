import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ChevronLeft,
  Mail,
  CheckCircle2,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Button } from '../../components/ui/Button';
import { isValidEmail } from '../../utils/validators';
import { getEmailSuggestion } from '../../utils/emailSuggester';
import { EmailSuggestionPill } from '../../components/ui/EmailSuggestionPill';
import { authService } from '../../services/api/authService';
import { ApiError } from '../../services/api/client';

type ResetStep = 'email' | 'otp' | 'password' | 'success';

export default function ForgotPasswordScreen() {
  const { colors, spacing, typography } = useTheme();

  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [bfpNotice, setBfpNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputRef = useRef<TextInput | null>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus OTP input when transitioning to OTP step
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 350);
    }
  }, [step]);

  // ── Step 1: Request OTP Code ──────────────────────────────────────────────
  const handleRequestOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError(null);
    setBfpNotice(null);
    setIsSubmitting(true);

    try {
      await authService.requestPasswordReset(cleanEmail);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setResendCooldown(60);
      setStep('otp');
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      if (err instanceof ApiError) {
        if (err.status === 403 || err.message.toLowerCase().includes('bfp')) {
          setBfpNotice(err.message);
        } else {
          setError(err.message);
        }
      } else {
        setError('Unable to send verification code. Please check your network connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 2: Verify 6-Digit OTP ────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await authService.verifyOtp(email.trim().toLowerCase(), cleanOtp);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setStep('password');
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setError(err instanceof ApiError ? err.message : 'Invalid or expired code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 3: Save New Password ─────────────────────────────────────────────
  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await authService.resetPasswordWithOtp(email.trim().toLowerCase(), otp.trim(), newPassword);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setStep('success');
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setError(err instanceof ApiError ? err.message : 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('email');
      setError(null);
    } else if (step === 'password') {
      setStep('otp');
      setError(null);
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.brandNavy }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={{ backgroundColor: colors.brandNavy }} edges={['top']} />

      {/* ── Top Navy Blue Header (Referencing Login & Registration UI) ── */}
      <View style={{ backgroundColor: colors.brandNavy, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl }}>
        {step !== 'success' && (
          <Pressable onPress={handleBack} hitSlop={12} style={{ marginBottom: spacing.md }}>
            <ChevronLeft size={24} color={colors.textInverse} strokeWidth={2.5} />
          </Pressable>
        )}

        <Text style={[styles.title, { color: colors.textInverse, fontSize: typography.size.xxl }]}>
          {step === 'email' && 'Forgot Password'}
          {step === 'otp' && 'Verification Code'}
          {step === 'password' && 'Create New Password'}
          {step === 'success' && 'Password Reset'}
        </Text>

        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: typography.size.sm, marginTop: 4 }}>
          {step === 'email' && 'Enter your email to receive a 6-digit verification code'}
          {step === 'otp' && `Code sent to ${email.trim()}`}
          {step === 'password' && 'Enter a secure password with at least 8 characters'}
          {step === 'success' && 'Your account has been updated successfully'}
        </Text>
      </View>

      {/* ── Curved Corner Divider between Navy Blue and Background ── */}
      <View style={{ height: 24, backgroundColor: colors.brandNavy }}>
        <View style={{ flex: 1, backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 }} />
      </View>

      {/* ── Scrollable Body on Background Surface ── */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxxl, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: colors.background, flex: 1 }}
      >
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* STEP 1: EMAIL ADDRESS                                         */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {step === 'email' && (
          <View>
            <Input
              label="Registered Email"
              required
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (error) setError(null);
                if (bfpNotice) setBfpNotice(null);
              }}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={error ?? undefined}
              leftIcon={<Mail size={18} color={colors.textMuted} />}
            />

            <EmailSuggestionPill
              suggestion={getEmailSuggestion(email)}
              onApply={(fixedEmail) => {
                setEmail(fixedEmail);
                if (error) setError(null);
              }}
            />

            {/* BFP Security Notice Card (Only shown if BFP account is entered) */}
            {bfpNotice && (
              <View style={[styles.bfpWarningCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                <ShieldAlert size={20} color="#DC2626" style={{ marginTop: 2, marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#991B1B', fontWeight: '700', fontSize: 13, marginBottom: 3 }}>
                    BFP Personnel Policy
                  </Text>
                  <Text style={{ color: '#B91C1C', fontSize: 12.5, lineHeight: 18 }}>
                    {bfpNotice}
                  </Text>
                </View>
              </View>
            )}

            <View style={{ marginTop: spacing.xl }}>
              <Button
                label="Send 6-Digit Code"
                onPress={handleRequestOtp}
                loading={isSubmitting}
              />
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* STEP 2: 6-DIGIT OTP VERIFICATION                             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {step === 'otp' && (
          <View>
            {/* Hidden text input capturing numerical keystrokes */}
            <TextInput
              ref={otpInputRef}
              value={otp}
              onChangeText={(t) => {
                const cleaned = t.replace(/[^0-9]/g, '').slice(0, 6);
                setOtp(cleaned);
                if (error) setError(null);
              }}
              keyboardType="number-pad"
              maxLength={6}
              style={styles.hiddenInput}
              autoFocus
            />

            {/* 6 Visual OTP Digits */}
            <Pressable
              onPress={() => otpInputRef.current?.focus()}
              style={styles.otpBoxesContainer}
            >
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const char = otp[idx] || '';
                const isCurrent = idx === otp.length;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.otpBox,
                      {
                        borderColor: isCurrent
                          ? colors.brandOrange
                          : char
                          ? colors.textPrimary
                          : colors.border,
                        backgroundColor: char ? 'rgba(244, 98, 43, 0.05)' : colors.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.otpBoxText,
                        { color: colors.textPrimary },
                      ]}
                    >
                      {char}
                    </Text>
                  </View>
                );
              })}
            </Pressable>

            {error && (
              <Text style={[styles.errorText, { color: colors.danger, marginTop: spacing.sm }]}>
                {error}
              </Text>
            )}

            {/* Resend Timer / Button */}
            <View style={styles.resendRow}>
              {resendCooldown > 0 ? (
                <Text style={{ color: colors.textMuted, fontSize: typography.size.sm }}>
                  Resend code in <Text style={{ fontWeight: '700', color: colors.brandOrange }}>0:{resendCooldown < 10 ? `0${resendCooldown}` : resendCooldown}</Text>
                </Text>
              ) : (
                <Pressable
                  onPress={handleRequestOtp}
                  disabled={isSubmitting}
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  <RotateCcw size={14} color={colors.brandOrange} style={{ marginRight: 5 }} />
                  <Text style={{ color: colors.brandOrange, fontWeight: '700', fontSize: typography.size.sm }}>
                    Resend Code
                  </Text>
                </Pressable>
              )}
            </View>

            <View style={{ marginTop: spacing.xl }}>
              <Button
                label="Verify Code"
                onPress={handleVerifyOtp}
                loading={isSubmitting}
                disabled={otp.length !== 6}
              />
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* STEP 3: NEW PASSWORD                                          */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {step === 'password' && (
          <View>
            <PasswordInput
              label="New Password"
              required
              value={newPassword}
              onChangeText={(t) => {
                setNewPassword(t);
                if (error) setError(null);
              }}
              placeholder="At least 8 characters"
              error={error ?? undefined}
            />

            <View style={{ marginTop: spacing.md }}>
              <PasswordInput
                label="Confirm New Password"
                required
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  if (error) setError(null);
                }}
                placeholder="Re-enter your new password"
              />
            </View>

            <View style={{ marginTop: spacing.xl }}>
              <Button
                label="Update Password & Sign In"
                onPress={handleResetPassword}
                loading={isSubmitting}
              />
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* STEP 4: SUCCESS CONFIRMATION                                  */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {step === 'success' && (
          <View style={styles.successState}>
            <View style={[styles.successIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <CheckCircle2 size={44} color="#10B981" />
            </View>
            <Text
              style={[
                styles.title,
                { color: colors.textPrimary, fontSize: typography.size.xl, marginTop: spacing.lg, textAlign: 'center' },
              ]}
            >
              Password Reset Successfully!
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: colors.textSecondary, fontSize: typography.size.base, marginTop: spacing.sm, textAlign: 'center' },
              ]}
            >
              Your account password has been updated. You can now sign in with your new credentials.
            </Text>
            <View style={{ marginTop: spacing.xl, width: '100%' }}>
              <Button
                label="Back to Sign In"
                onPress={() => router.replace('/(auth)/login')}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    lineHeight: 22,
  },
  bfpWarningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxText: {
    fontSize: 24,
    fontWeight: '800',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  resendRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  successState: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
