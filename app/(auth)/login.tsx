import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform, Animated, Easing } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Mail, CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useRegistration } from '../../context/RegistrationContext';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Button } from '../../components/ui/Button';
import { GoogleIcon } from '../../components/ui/GoogleIcon';
import { validateLogin } from '../../utils/validators';
import { ApiError } from '../../services/api/client';
import { APP_CONFIG } from '../../constants/config';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { login, loginWithGoogle, isSubmitting } = useAuth();
  const { updateForm } = useRegistration();

  const { email: paramEmail, verified: paramVerified } = useLocalSearchParams<{ email?: string; verified?: string }>();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState(paramEmail ? decodeURIComponent(paramEmail) : '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [signInLoading, setSignInLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Floating transient toast for verified status
  const [showToast, setShowToast] = useState(false);
  const toastY = useRef(new Animated.Value(-60)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (paramEmail) {
      setEmail(decodeURIComponent(paramEmail));
    }

    if (paramVerified === '1') {
      setShowToast(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      Animated.parallel([
        Animated.spring(toastY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 9,
        }),
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(toastY, {
            toValue: -40,
            duration: 250,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(toastOpacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => setShowToast(false));
      }, 3200);

      return () => clearTimeout(timer);
    }
  }, [paramEmail, paramVerified, toastY, toastOpacity]);

  const processGoogleLogin = async (idToken?: string, accessToken?: string) => {
    setGoogleLoading(true);
    setFormError(null);
    try {
      const res = await loginWithGoogle({
        id_token: idToken,
        access_token: accessToken,
      });

      if (!res.is_new_user && res.user) {
        if (res.user.role === 'bfp_personnel') {
          router.replace('/(bfp)/dashboard');
        } else {
          router.replace('/(resident)/home');
        }
      } else if (res.requires_completion || res.is_new_user) {
        if (res.google_user) {
          updateForm({
            firstName: res.google_user.first_name || '',
            lastName: res.google_user.last_name || '',
            email: res.google_user.email || '',
            googleId: res.google_user.google_id || '',
            mobileNumber: res.google_user.contact_number || '',
          });
        }
        router.push('/(auth)/register/complete-google');
      }
    } catch (err: any) {
      setFormError(err instanceof ApiError ? err.message : 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignIn = async () => {
    const validationErrors = validateLogin({ email, password });
    setErrors(validationErrors);
    setFormError(null);
    if (Object.keys(validationErrors).length > 0) return;

    setSignInLoading(true);
    try {
      const loggedInUser = await login({ email: email.trim(), password });
      if (loggedInUser && loggedInUser.role === 'bfp_personnel') {
        router.replace('/(bfp)/dashboard');
      } else {
        router.replace('/(resident)/home');
      }
    } catch (err: any) {
      const errorBody = err instanceof ApiError ? (err.body as any) : null;
      if (errorBody?.requires_verification) {
        router.push({
          pathname: '/(auth)/register/verify-email',
          params: { email: errorBody.email || email.trim() },
        });
        return;
      }
      setFormError(err instanceof ApiError ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setSignInLoading(false);
    }
  };

  const handleGooglePress = async () => {
    try {
      setFormError(null);
      setGoogleLoading(true);

      const clientId = APP_CONFIG.GOOGLE_CLIENT_ID;
      const redirectUri = 'https://auth.expo.io/@anonymous/firesight-mobile';
      const returnUrl = Linking.createURL('');

      // Build Google OAuth authorization URL
      const googleAuthUrl =
        'https://accounts.google.com/o/oauth2/v2/auth?' +
        new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: 'id_token',
          scope: 'openid email profile',
          nonce: Math.random().toString(36).substring(2),
          prompt: 'select_account',
        }).toString();

      // Wrap with Expo Auth proxy /start so auth.expo.io knows what returnUrl to bounce back to
      const proxyStartUrl =
        `${redirectUri}/start?` +
        new URLSearchParams({
          authUrl: googleAuthUrl,
          returnUrl: returnUrl,
        }).toString();

      const result = await WebBrowser.openAuthSessionAsync(proxyStartUrl, returnUrl);

      if (result.type === 'success' && result.url) {
        const fragment = result.url.includes('#') ? result.url.split('#')[1] : '';
        const query = result.url.includes('?') ? result.url.split('?')[1] : '';
        const searchParams = new URLSearchParams(fragment || query);
        const idToken = searchParams.get('id_token') || undefined;
        const accessToken = searchParams.get('access_token') || undefined;

        if (idToken || accessToken) {
          await processGoogleLogin(idToken, accessToken);
        } else {
          setFormError('No Google credential returned. Please try again.');
        }
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        // User closed the browser
      }
    } catch (err: any) {
      setFormError(err instanceof ApiError ? err.message : 'Google sign-in encountered an error.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.brandNavy }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={{ backgroundColor: colors.brandNavy }} edges={['top']} />

      {/* Floating Dynamic Island Style Toast */}
      {showToast ? (
        <Animated.View
          style={[
            styles.floatingToast,
            {
              top: insets.top + 12,
              opacity: toastOpacity,
              transform: [{ translateY: toastY }],
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.toastInner}>
            <View style={styles.toastIconWrap}>
              <CheckCircle2 size={15} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <Text style={styles.toastText}>Email verified successfully</Text>
          </View>
        </Animated.View>
      ) : null}
      
      <View style={{ backgroundColor: colors.brandNavy, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.xl }}>
        <Text style={[styles.title, { color: colors.textInverse, fontSize: typography.size.xxl }]}>
          Sign in to FireSight
        </Text>
      </View>

      <View style={{ height: 24, backgroundColor: colors.brandNavy }}>
        <View style={{ flex: 1, backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxxl, flexGrow: 1 }} keyboardShouldPersistTaps="handled" style={{ backgroundColor: colors.background, flex: 1 }}>
        <Input
            label="Email or Mobile Number"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
            }}
            placeholder="Enter email or mobile number"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
            leftIcon={<Mail size={18} color={colors.textMuted} />}
          />

          <PasswordInput
            label="Password"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
            }}
            placeholder="Enter your password"
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
            <Button
              label="Sign In"
              onPress={handleSignIn}
              loading={signInLoading}
              disabled={signInLoading || googleLoading}
            />
          </View>

          <View style={[styles.dividerRow, { marginVertical: spacing.xl }]}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 11,
                fontWeight: '600',
                letterSpacing: 1.2,
                marginHorizontal: spacing.md,
                textTransform: 'uppercase',
              }}
            >
              OR
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <Button
            label="Continue with Google"
            variant="neutral"
            icon={<GoogleIcon size={18} />}
            iconPosition="left"
            onPress={handleGooglePress}
            loading={googleLoading}
            disabled={signInLoading || googleLoading}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  brand: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 10,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {},
  errorBanner: {
    padding: 12,
  },
  floatingToast: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1C3F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  toastIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
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
