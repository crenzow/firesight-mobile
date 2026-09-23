import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { isValidEmail } from '../../utils/validators';
import { authService } from '../../services/api/authService';
import { ApiError } from '../../services/api/client';

export default function ForgotPasswordScreen() {
  const { colors, spacing, typography } = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await authService.requestPasswordReset(email.trim());
      setIsSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to send reset instructions right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginBottom: spacing.lg }}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>

        {isSent ? (
          <View style={styles.successState}>
            <View style={[styles.successIcon, { backgroundColor: `${colors.success}1A` }]}>
              <CheckCircle2 size={40} color={colors.success} />
            </View>
            <Text
              style={[
                styles.title,
                { color: colors.textPrimary, fontSize: typography.size.xl, marginTop: spacing.lg },
              ]}
            >
              Check your email
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: colors.textSecondary, fontSize: typography.size.base, marginTop: spacing.sm },
              ]}
            >
              We've sent password reset instructions to {email.trim()}. Please check your inbox and spam folder.
            </Text>
            <View style={{ marginTop: spacing.xl, width: '100%' }}>
              <Button label="Back to Sign In" onPress={() => router.replace('/(auth)/login')} />
            </View>
          </View>
        ) : (
          <>
            <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.size.xl }]}>
              Forgot your password?
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: colors.textSecondary, fontSize: typography.size.base, marginBottom: spacing.xl },
              ]}
            >
              Enter the email address linked to your account and we'll send you instructions to reset your password.
            </Text>

            <Input
              label="Email Address"
              required
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (error) setError(null);
              }}
              placeholder="Enter your email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={error ?? undefined}
              leftIcon={<Mail size={18} color={colors.textMuted} />}
            />

            <View style={{ marginTop: spacing.lg }}>
              <Button label="Send Reset Instructions" onPress={handleSubmit} loading={isSubmitting} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '700',
  },
  subtitle: {
    lineHeight: 21,
  },
  successState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});