import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Linking, Platform, AppState, AppStateStatus, BackHandler, Animated, Easing } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Mail, CheckCircle2, AlertCircle, ExternalLink, ChevronLeft } from 'lucide-react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/Button';
import { authService } from '../../../services/api/authService';
import { ApiError } from '../../../services/api/client';

export default function VerifyEmailScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { user, refreshUser, logout } = useAuth();
  const { email: paramEmail } = useLocalSearchParams<{ email?: string }>();
  const insets = useSafeAreaInsets();

  const activeEmail = user?.email || paramEmail || '';

  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Floating transient toast (Dynamic Island style)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const toastY = useRef(new Animated.Value(-60)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFloatingToast = useCallback((type: 'success' | 'error', message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ type, message });

    Haptics.notificationAsync(
      type === 'success'
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning
    ).catch(() => {});

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

    toastTimerRef.current = setTimeout(() => {
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
      ]).start(() => setToast(null));
    }, 3200);
  }, [toastY, toastOpacity]);

  const isNavigatingRef = useRef(false);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Navigate to login after successful verification (Option A)
  const onVerificationSuccess = useCallback(async () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    showFloatingToast('success', 'Email verified! Redirecting to sign in...');

    setTimeout(() => {
      if (user) {
        refreshUser().catch(() => {});
      }
      router.replace({
        pathname: '/(auth)/login',
        params: { email: activeEmail, verified: '1' },
      });
    }, 1200);
  }, [activeEmail, user, refreshUser, showFloatingToast]);

  // Handle checking verification status silently
  const handleCheckVerification = useCallback(async () => {
    if (!activeEmail || isNavigatingRef.current) return;
    try {
      const res = await authService.checkVerificationStatus(activeEmail);
      if (res.is_verified) {
        await onVerificationSuccess();
      }
    } catch {
      // Ignore background poll errors
    }
  }, [activeEmail, onVerificationSuccess]);

  // Handle navigation back to login
  const handleBackToLogin = useCallback(() => {
    router.replace('/(auth)/login');
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBackToLogin();
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [handleBackToLogin])
  );

  // Auto-detect when user returns from email app or browser
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        handleCheckVerification();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [handleCheckVerification]);

  // Launch external mail client directly to the Inbox (outside Expo task)
  const handleOpenEmailApp = async () => {
    try {
      if (Platform.OS === 'android') {
        try {
          // Launch external email app in its own separate task (FLAG_ACTIVITY_NEW_TASK = 268435456)
          await IntentLauncher.startActivityAsync('android.intent.action.MAIN', {
            category: 'android.intent.category.APP_EMAIL',
            flags: 268435456,
          });
          return;
        } catch {
          try {
            await IntentLauncher.openApplication('com.google.android.gm');
            return;
          } catch {
            // Standard mailto: which Android handles by opening external email apps outside Expo
            await Linking.openURL('mailto:');
            return;
          }
        }
      }

      if (Platform.OS === 'ios') {
        const canOpenMail = await Linking.canOpenURL('message://');
        if (canOpenMail) {
          await Linking.openURL('message://');
          return;
        }
        const canOpenGmail = await Linking.canOpenURL('googlegmail://');
        if (canOpenGmail) {
          await Linking.openURL('googlegmail://');
          return;
        }
        await Linking.openURL('mailto:');
        return;
      }

      await Linking.openURL('mailto:');
    } catch {
      Alert.alert(
        'Open Email App',
        'Could not open your email inbox automatically. Please switch to your email app to verify.',
        [{ text: 'OK' }]
      );
    }
  };

  // Handle resending verification email
  const handleResend = async () => {
    if (cooldown > 0 || resending || isNavigatingRef.current) return;

    setResending(true);
    try {
      const res = await authService.resendVerification(activeEmail);
      if (res.already_verified) {
        await onVerificationSuccess();
        return;
      }
      setCooldown(60);
      showFloatingToast('success', 'Verification link sent to your inbox');
    } catch (err: any) {
      showFloatingToast('error', err instanceof ApiError ? err.message : 'Failed to resend verification link.');
    } finally {
      setResending(false);
    }
  };

  // Cancel pending registration
  const handleCancelRegistration = async () => {
    Alert.alert(
      'Cancel Registration',
      'Are you sure you want to cancel this registration? The pending signup will be removed, and you can register again anytime.',
      [
        { text: 'Keep Waiting', style: 'cancel' },
        {
          text: 'Cancel & Start Over',
          style: 'destructive',
          onPress: async () => {
            try {
              if (activeEmail) {
                await authService.cancelRegistration(activeEmail);
              }
              if (user) {
                await logout();
              }
            } catch {
              // Ignore network failure when cancelling
            } finally {
              router.replace('/(auth)/login');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.brandNavy }}>
      <SafeAreaView style={{ backgroundColor: colors.brandNavy }} edges={['top']} />

      {/* Floating Dynamic Island Style Toast */}
      {toast ? (
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
          <View
            style={[
              styles.toastInner,
              {
                borderColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.45)' : 'rgba(239, 68, 68, 0.45)',
              },
            ]}
          >
            <View
              style={[
                styles.toastIconWrap,
                {
                  backgroundColor: toast.type === 'success' ? '#10B981' : '#EF4444',
                },
              ]}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 size={14} color="#FFFFFF" strokeWidth={2.5} />
              ) : (
                <AlertCircle size={14} color="#FFFFFF" strokeWidth={2.5} />
              )}
            </View>
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        </Animated.View>
      ) : null}

      {/* Navy Header Section */}
      <View
        style={{
          backgroundColor: colors.brandNavy,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxl,
        }}
      >
        <Pressable
          onPress={handleBackToLogin}
          hitSlop={8}
          style={{ alignSelf: 'flex-start', marginBottom: spacing.md }}
          accessibilityRole="button"
          accessibilityLabel="Back to sign in"
        >
          <ChevronLeft size={24} color={colors.textInverse} strokeWidth={2.5} />
        </Pressable>

        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: `${colors.brandOrange}20`,
              borderWidth: 2,
              borderColor: `${colors.brandOrange}40`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.lg,
            }}
          >
            <Mail size={36} color={colors.brandOrange} strokeWidth={2} />
          </View>

          <Text style={[styles.title, { color: colors.textInverse, fontSize: typography.size.xxl }]}>
            Verify Your Email
          </Text>
          <Text
            style={{
              color: 'rgba(255, 255, 255, 0.75)',
              fontSize: typography.size.sm,
              textAlign: 'center',
              marginTop: 6,
            }}
          >
            Tap below to open your email app and activate your account.
          </Text>
        </View>
      </View>

      {/* Curved Container Transition */}
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

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxxl,
          flexGrow: 1,
        }}
        style={{ backgroundColor: colors.background, flex: 1 }}
      >
        {/* Primary Action Button */}
        <View style={{ marginTop: spacing.md }}>
          <Button
            label="Open Email App"
            onPress={handleOpenEmailApp}
            icon={<ExternalLink size={18} color="#FFFFFF" />}
          />
        </View>

        {/* Minimal Secondary Text Links */}
        <View style={{ marginTop: spacing.xl, alignItems: 'center', gap: spacing.md }}>
          <Pressable
            onPress={handleResend}
            disabled={cooldown > 0 || resending}
            hitSlop={8}
          >
            <Text
              style={{
                color: cooldown > 0 ? colors.textMuted : colors.brandOrange,
                fontSize: typography.size.sm,
                fontWeight: '600',
              }}
            >
              {cooldown > 0 ? `Resend link in ${cooldown}s` : "Didn't receive the email? Resend"}
            </Text>
          </Pressable>

          <Pressable onPress={handleCancelRegistration} hitSlop={8}>
            <Text style={{ color: colors.textMuted, fontSize: typography.size.xs }}>
              Cancel registration
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '700',
    textAlign: 'center',
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
});
