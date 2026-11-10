import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, LogOut } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/Button';
import { authService } from '../../../services/api/authService';
import { ApiError } from '../../../services/api/client';

export default function VerifyEmailScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { user, refreshUser, logout } = useAuth();
  const { email: paramEmail } = useLocalSearchParams<{ email?: string }>();

  const activeEmail = user?.email || paramEmail || '';

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [notice, setNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle checking verification status
  const handleCheckVerification = async () => {
    setChecking(true);
    setNotice(null);
    try {
      const res = await authService.checkVerificationStatus(activeEmail);
      if (res.is_verified) {
        if (user) {
          await refreshUser();
          setNotice({ type: 'success', text: 'Email verified successfully! Redirecting...' });
          setTimeout(() => {
            router.replace('/(resident)/home');
          }, 1200);
        } else {
          setNotice({ type: 'success', text: 'Email verified successfully! You can now sign in.' });
          setTimeout(() => {
            router.replace('/(auth)/login');
          }, 1400);
        }
      } else {
        setNotice({
          type: 'error',
          text: "Your email hasn't been verified yet. Please check your inbox and click the verification link first.",
        });
      }
    } catch (err: any) {
      setNotice({
        type: 'error',
        text: err instanceof ApiError ? err.message : 'Unable to check verification status. Please try again.',
      });
    } finally {
      setChecking(false);
    }
  };

  // Handle resending verification email
  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    setResending(true);
    setNotice(null);
    try {
      const res = await authService.resendVerification(activeEmail);
      if (res.already_verified) {
        if (user) {
          await refreshUser();
          router.replace('/(resident)/home');
        } else {
          router.replace('/(auth)/login');
        }
        return;
      }
      setCooldown(60);
      setNotice({
        type: 'success',
        text: 'A new verification link has been sent to your email. Please check your inbox.',
      });
    } catch (err: any) {
      setNotice({
        type: 'error',
        text: err instanceof ApiError ? err.message : 'Failed to resend verification link. Please try again later.',
      });
    } finally {
      setResending(false);
    }
  };

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

      {/* Navy Header Section */}
      <View
        style={{
          backgroundColor: colors.brandNavy,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.xl,
          paddingBottom: spacing.xxl,
          alignItems: 'center',
        }}
      >
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
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: typography.size.sm,
            textAlign: 'center',
            marginTop: 6,
            lineHeight: 20,
          }}
        >
          We sent a verification link to activate your account.
        </Text>
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
          paddingTop: spacing.md,
          paddingBottom: spacing.xxxl,
          flexGrow: 1,
        }}
        style={{ backgroundColor: colors.background, flex: 1 }}
      >
        {/* Email Pill Badge */}
        <View
          style={[
            styles.emailBadge,
            {
              backgroundColor: `${colors.brandNavy}0A`,
              borderColor: colors.border,
              borderRadius: radius.md,
              padding: spacing.md,
            },
          ]}
        >
          <Mail size={16} color={colors.brandOrange} style={{ marginRight: 8 }} />
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.size.sm,
              fontWeight: '700',
              flexShrink: 1,
            }}
            numberOfLines={1}
          >
            {activeEmail || 'your registered email'}
          </Text>
        </View>

        {/* Status Notice Banner */}
        {notice ? (
          <View
            style={[
              styles.noticeCard,
              {
                backgroundColor: notice.type === 'success' ? '#ecfdf5' : '#fef2f2',
                borderColor: notice.type === 'success' ? '#10b981' : '#ef4444',
                borderRadius: radius.md,
                marginTop: spacing.md,
              },
            ]}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 size={18} color="#10b981" style={{ marginRight: 8 }} />
            ) : (
              <AlertCircle size={18} color="#ef4444" style={{ marginRight: 8 }} />
            )}
            <Text
              style={{
                color: notice.type === 'success' ? '#065f46' : '#991b1b',
                fontSize: typography.size.sm,
                flex: 1,
                lineHeight: 20,
              }}
            >
              {notice.text}
            </Text>
          </View>
        ) : null}

        {/* Step Guide Card */}
        <View
          style={[
            styles.guideCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
              padding: spacing.lg,
              marginTop: spacing.lg,
            },
          ]}
        >
          <Text style={{ color: colors.textPrimary, fontSize: typography.size.base, fontWeight: '700', marginBottom: spacing.md }}>
            Quick instructions:
          </Text>

          <View style={styles.stepRow}>
            <View style={[styles.stepNum, { backgroundColor: `${colors.brandOrange}1A` }]}>
              <Text style={{ color: colors.brandOrange, fontWeight: '700', fontSize: 12 }}>1</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              Check your inbox for an email from <Text style={{ fontWeight: '700', color: colors.textPrimary }}>FireSight</Text>.
            </Text>
          </View>

          <View style={styles.stepRow}>
            <View style={[styles.stepNum, { backgroundColor: `${colors.brandOrange}1A` }]}>
              <Text style={{ color: colors.brandOrange, fontWeight: '700', fontSize: 12 }}>2</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              Tap the <Text style={{ fontWeight: '700', color: colors.brandOrange }}>"Verify Email Address"</Text> button in the message.
            </Text>
          </View>

          <View style={styles.stepRow}>
            <View style={[styles.stepNum, { backgroundColor: `${colors.brandOrange}1A` }]}>
              <Text style={{ color: colors.brandOrange, fontWeight: '700', fontSize: 12 }}>3</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              Return to this screen and tap the button below.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
          <Button
            label="I've Verified My Email"
            onPress={handleCheckVerification}
            loading={checking}
            disabled={checking}
          />

          <Button
            label={cooldown > 0 ? `Resend Link in ${cooldown}s` : 'Resend Verification Link'}
            variant="neutral"
            onPress={handleResend}
            loading={resending}
            disabled={cooldown > 0 || resending || checking}
          />
        </View>

        {/* Cancel / Wrong Email Option */}
        <View style={{ marginTop: spacing.xxl, alignItems: 'center' }}>
          <Pressable onPress={handleCancelRegistration} style={styles.signOutBtn} hitSlop={8}>
            <LogOut size={16} color={colors.textMuted} style={{ marginRight: 6 }} />
            <Text style={{ color: colors.textMuted, fontSize: typography.size.sm, fontWeight: '600' }}>
              Wrong email or want to cancel? Cancel registration
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
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
  },
  guideCard: {
    borderWidth: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
