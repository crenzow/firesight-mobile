import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  BackHandler,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Lock, Shield, FileText, KeyRound, X, FileCheck2, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../theme/ThemeContext';
import { SecondaryHeader } from '../../../components/navigation/SecondaryHeader';
import { ProfileMenuRow } from '../../../components/profile/ProfileMenuRow';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { LegalModal } from '../../../components/ui/LegalModal';
import { profileService } from '../../../services/api/profileService';
import { useAuth } from '../../../context/AuthContext';

export default function SecurityScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { colors, spacing, typography, radius, shadow, isDark } = useTheme();
  const { logout } = useAuth();

  // Navigation back handler
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else if (from && (from.includes('home') || from === '/(resident)/home')) {
      router.navigate('/(resident)/home');
    } else {
      router.navigate('/(resident)/profile');
    }
  }, [from]);

  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);

  // Legal modal state
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);

  // Delete account confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleClosePasswordModal = useCallback(() => {
    if (isUpdatingPassword) return;
    setShowPasswordModal(false);
    setCurrentPassword('');
    setCurrentPasswordError(null);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
  }, [isUpdatingPassword]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (showPasswordModal) {
          handleClosePasswordModal();
          return true;
        }
        if (legalModalType !== null) {
          setLegalModalType(null);
          return true;
        }
        if (showDeleteDialog) {
          setShowDeleteDialog(false);
          return true;
        }
        if (showPasswordSuccess) {
          setShowPasswordSuccess(false);
          return true;
        }
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [handleBack, showPasswordModal, legalModalType, showDeleteDialog, showPasswordSuccess, handleClosePasswordModal])
  );

  const handleOpenPasswordModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setCurrentPassword('');
    setCurrentPasswordError(null);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setShowPasswordModal(true);
  };

  const handleSavePassword = async () => {
    setCurrentPasswordError(null);
    setPasswordError(null);

    if (!currentPassword.trim()) {
      setCurrentPasswordError('Please enter your current password.');
      return;
    }
    if (!newPassword.trim()) {
      setPasswordError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from your current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await profileService.update({
        current_password: currentPassword.trim(),
        password: newPassword.trim(),
      });
      setShowPasswordModal(false);
      setShowPasswordSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to update password. Please try again.';
      if (msg.toLowerCase().includes('current password')) {
        setCurrentPasswordError(msg);
      } else {
        setPasswordError(msg);
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await profileService.deleteAccount();
    } catch {
      // Continue with logout even if network error
    } finally {
      setShowDeleteDialog(false);
      setIsDeletingAccount(false);
      await logout();
      router.replace('/(auth)/welcome');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SecondaryHeader title="Privacy & Security" onBack={handleBack} />

      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}>
          {/* ── ACCOUNT SECURITY ─────────────────────────────────── */}
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.textMuted, fontSize: typography.size.xs, marginBottom: spacing.sm },
            ]}
          >
            ACCOUNT SECURITY
          </Text>
          <Card padding={0}>
            <ProfileMenuRow
              isFirst
              isLast
              icon={<Lock size={18} color="#FFFFFF" />}
              gradient={['#1A2340', '#000000']}
              label="Change Password"
              subtitle="Update your account login password"
              onPress={handleOpenPasswordModal}
            />
          </Card>

          {/* ── DATA & PRIVACY ───────────────────────────────────── */}
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.textMuted,
                fontSize: typography.size.xs,
                marginTop: spacing.xl,
                marginBottom: spacing.sm,
              },
            ]}
          >
            DATA & PRIVACY
          </Text>
          <Card padding={0}>
            <ProfileMenuRow
              isFirst
              icon={<FileText size={18} color="#FFFFFF" />}
              gradient={['#64748B', '#0F1C3F']}
              label="Privacy Policy"
              subtitle="How your information is protected and used"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setLegalModalType('privacy');
              }}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <ProfileMenuRow
              icon={<FileCheck2 size={18} color="#FFFFFF" />}
              gradient={['#3B82F6', '#1D4ED8']}
              label="Terms of Service"
              subtitle="User agreement and platform terms"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setLegalModalType('terms');
              }}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <ProfileMenuRow
              isLast
              icon={<Trash2 size={18} color="#FFFFFF" strokeWidth={2.2} />}
              gradient={['#EF4444', '#DC2626']}
              label="Delete Account"
              subtitle="Permanently remove your account and data"
              destructive
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setShowDeleteDialog(true);
              }}
            />
          </Card>
        </ScrollView>
      </SafeAreaView>

      {/* ── CHANGE PASSWORD MODAL ──────────────────────────────── */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={handleClosePasswordModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        >
          <View
            style={[
              styles.passwordCard,
              {
                backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              },
              !isDark && shadow.card,
            ]}
          >
            {/* Top close button */}
            <Pressable
              onPress={handleClosePasswordModal}
              hitSlop={10}
              style={({ pressed }) => [
                styles.closeButton,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <X size={16} color={colors.textSecondary} />
            </Pressable>

            {/* Icon Header */}
            <LinearGradient
              colors={[colors.brandOrange, colors.brandOrangeDeep]}
              style={styles.iconBadge}
            >
              <KeyRound size={26} color="#FFFFFF" strokeWidth={2.4} />
            </LinearGradient>

            <Text
              style={[
                styles.modalTitle,
                { color: colors.textPrimary, fontSize: typography.size.lg },
              ]}
            >
              Change Password
            </Text>
            <Text
              style={[
                styles.modalSubtitle,
                { color: colors.textSecondary, fontSize: typography.size.xs },
              ]}
            >
              Create a strong new password with at least 8 characters.
            </Text>

            {/* Inputs */}
            <View style={{ width: '100%', marginTop: spacing.md, gap: spacing.sm }}>
              <PasswordInput
                label="Current Password"
                value={currentPassword}
                onChangeText={(t) => {
                  setCurrentPassword(t);
                  if (currentPasswordError) setCurrentPasswordError(null);
                }}
                placeholder="Enter current password"
                error={currentPasswordError ?? undefined}
              />

              <PasswordInput
                label="New Password"
                value={newPassword}
                onChangeText={(t) => {
                  setNewPassword(t);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder="At least 8 characters"
                error={passwordError ?? undefined}
              />

              <PasswordInput
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder="Re-enter new password"
              />
            </View>

            {/* Actions */}
            <View style={[styles.modalActionsRow, { marginTop: spacing.lg }]}>
              <View style={{ flex: 1 }}>
                <Button
                  label="Cancel"
                  variant="outline"
                  onPress={handleClosePasswordModal}
                  disabled={isUpdatingPassword}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Update"
                  onPress={handleSavePassword}
                  loading={isUpdatingPassword}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── PASSWORD SUCCESS DIALOG ────────────────────────────── */}
      <ConfirmationDialog
        visible={showPasswordSuccess}
        type="success"
        title="Password Updated!"
        message="Your account login password has been changed successfully. You can now use your new password next time you sign in."
        confirmText="Done"
        showCancel={false}
        onConfirm={() => setShowPasswordSuccess(false)}
      />

      {/* ── DELETE ACCOUNT CONFIRMATION DIALOG ─────────────────── */}
      <ConfirmationDialog
        visible={showDeleteDialog}
        type="danger"
        title="Delete Account?"
        message={`Your account will be deactivated immediately and scheduled for permanent deletion in 30 days.\n\nIf you change your mind, you can cancel this request at any time by simply signing back in before the 30 days are up.\n\nPast submitted fire incident reports will remain securely archived with the Bureau of Fire Protection (BFP) Lian Fire Station for public safety records.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={isDeletingAccount}
        onConfirm={handleConfirmDeleteAccount}
        onCancel={() => setShowDeleteDialog(false)}
        icon={<Trash2 size={28} color="#FFFFFF" strokeWidth={2.4} />}
      />

      {/* ── LEGAL MODAL (Privacy Policy / Terms of Service) ───── */}
      {legalModalType !== null ? (
        <LegalModal
          visible={true}
          type={legalModalType}
          mode="review"
          onClose={() => setLegalModalType(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 62,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  passwordCard: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  modalSubtitle: {
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
});
