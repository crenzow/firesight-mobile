import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Button } from '../../components/ui/Button';
import { validateLogin } from '../../utils/validators';
import { ApiError } from '../../services/api/client';

export default function LoginScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { login, isSubmitting } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const handleSignIn = async () => {
    const validationErrors = validateLogin({ email, password });
    setErrors(validationErrors);
    setFormError(null);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      await login({ email: email.trim(), password });
      router.replace('/(resident)/home');
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Unable to sign in. Please try again.');
    }
  };

  // Simple backend bypass for testing layout and home screen
  const handleBypassLogin = () => {
    router.replace('/(resident)/home');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <Text style={[styles.brand, { color: colors.brandOrange, fontSize: typography.size.sm }]}>FIRESIGHT</Text>
          <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.size.xxl }]}>
            Welcome back
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: colors.textSecondary, fontSize: typography.size.base, marginBottom: spacing.xl },
            ]}
          >
            Sign in to access fire safety services
          </Text>

          <Input
            label="Email Address"
            required
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
            }}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
            leftIcon={<Mail size={18} color={colors.textMuted} />}
          />

          <PasswordInput
            label="Password"
            required
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
            }}
            error={errors.password}
          />

          <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={{ alignSelf: 'flex-end' }}>
            <Text style={{ color: colors.brandOrange, fontSize: typography.size.sm, fontWeight: '600' }}>
              Forgot Password?
            </Text>
          </Pressable>

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

          {/* Action Buttons Section */}
          <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
            <Button label="Sign In" onPress={handleSignIn} loading={isSubmitting} />
            
            {/* Dev Mode Bypass Button */}
      {/*      <Button 
              label="Bypass Login (Dev Mode)" 
              variant="outline" 
              onPress={handleBypassLogin} 
              style={{ borderColor: colors.brandOrange }}
            />       */}
          </View>

          <View style={[styles.dividerRow, { marginVertical: spacing.xl }]}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginHorizontal: spacing.md }}>
              or continue with
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <Button
            label="Continue with Google"
            variant="outline"
            onPress={() => {
              // Google auth requires additional native configuration
              // (expo-auth-session + Google OAuth client IDs). Wired here so
              // the flow is ready to enable once those credentials exist.
            }}
          />

          <View style={[styles.footerRow, { marginTop: spacing.xxl }]}>
            <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm }}>
              Don&apos;t have an account?{' '}
            </Text>
            <Pressable onPress={() => router.push('/(auth)/register/step1-personal')}>
              <Text style={{ color: colors.brandOrange, fontSize: typography.size.sm, fontWeight: '700' }}>
                Create Account
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  brand: {
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {},
  errorBanner: {
    padding: 12,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});