import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform, Image, ActivityIndicator } from 'react-native';
import { router, usePathname } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ShieldCheck, Settings as SettingsIcon, LogOut, Phone, Building2, IdCard, Edit3, Camera } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { AppHeader } from '../../../components/navigation/AppHeader';
import { Card } from '../../../components/ui/Card';
import { ProfileMenuRow } from '../../../components/profile/ProfileMenuRow';
import { Button } from '../../../components/ui/Button';
import { getInitials, formatFullName } from '../../../utils/formatters';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { getProfileImageUri } from '../../../utils/avatar';
import { profileService } from '../../../services/api/profileService';
import { ApiError } from '../../../services/api/client';
import { PhotoOptionsModal, PhotoPreviewModal } from '../../../components/profile/PhotoPickerModal';
import { PhotoCropModal } from '../../../components/profile/PhotoCropModal';

export default function BFPProfileScreen() {
  const { colors, spacing, typography } = useTheme();
  const { user, logout, refreshUser, updateUser } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropTargetUri, setCropTargetUri] = useState<string | null>(null);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const handleImageSelected = (uri: string) => {
    setCropTargetUri(uri);
    setShowCropModal(true);
  };

  const handleCropComplete = (croppedUri: string) => {
    setPendingPhotoUri(croppedUri);
    setShowPhotoPreview(true);
  };

  const handleConfirmUpload = async () => {
    if (!pendingPhotoUri) return;
    setIsUploadingPhoto(true);
    try {
      const updated = await profileService.uploadPhoto(pendingPhotoUri);
      await updateUser(updated);
      setLocalImage(pendingPhotoUri);
      setShowPhotoPreview(false);
      setPendingPhotoUri(null);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Unable to upload profile photo. Please try again.';
      Alert.alert('Upload Failed', msg);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      const updated = await profileService.deletePhoto();
      await updateUser(updated);
      setLocalImage(null);
    } catch {
      Alert.alert('Error', 'Unable to remove profile photo. Please try again.');
    }
  };

  const handleSignOutPress = () => {
    setShowLogoutModal(true);
  };

  const confirmSignOut = async () => {
    setShowLogoutModal(false);
    setIsLoggingOut(true);
    await logout();
    router.replace('/(auth)/welcome');
  };

  if (!user) return null;

  const initials = getInitials(user.first_name, user.last_name);
  const profileImageUri = getProfileImageUri(localImage ?? user.profile_image);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader variant="dark" />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        {/* ── Premium Identity Hero Card ── */}
        <View style={[styles.heroCard, { marginHorizontal: spacing.lg, marginTop: spacing.md }]}>
          {/* Edit button */}
          <Pressable
            style={({ pressed }) => [
              styles.heroEditBtn,
              {
                transform: [{ scale: pressed ? 0.90 : 1 }],
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              router.push({ pathname: '/(bfp)/profile/edit', params: { from: pathname } } as any);
            }}
          >
            <Edit3 size={14} color="#FFFFFF" />
          </Pressable>

          {/* Avatar + name */}
          <View style={styles.heroTop}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setShowPhotoOptions(true);
                }}
                disabled={isUploadingPhoto}
                style={({ pressed }) => [
                  styles.avatarWrap,
                  {
                    transform: [{ scale: pressed && !isUploadingPhoto ? 0.95 : 1 }],
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <View style={styles.avatarClip}>
                  {isUploadingPhoto ? (
                    <View style={[styles.avatarInner, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    </View>
                  ) : profileImageUri ? (
                    <Image source={{ uri: profileImageUri }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarInner}>
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                  )}
                </View>
                {/* Camera badge sitting cleanly on bottom-right corner without clipping */}
                <View style={styles.cameraBadge}>
                  <Camera size={13} color="#FFFFFF" />
                </View>
              </Pressable>

              <View style={styles.heroMeta}>
                <Text style={styles.heroName}>
                  {formatFullName(user.first_name, user.last_name, user.middle_name, user.suffix)}
                </Text>
                <Text style={styles.heroEmail} numberOfLines={1}>
                  {user.email}
                </Text>
                <View style={styles.heroBadgeRow}>
                  <View style={styles.heroBadge}>
                    <ShieldCheck size={12} color="#FED7AA" />
                    <Text style={styles.heroBadgeText}>BFP Personnel</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

        <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, fontWeight: '700', marginTop: spacing.xl, marginBottom: spacing.sm, marginHorizontal: spacing.lg }}>
          ASSIGNMENT
        </Text>
        <View style={{ marginHorizontal: spacing.lg }}>
          <Card>
            <InfoRow
              icon={<IdCard size={18} color="#FFFFFF" />}
              label="RANK"
              value={user.personnel_details?.rank || 'Fire Officer II'}
            />
            <InfoRow
              icon={<Building2 size={18} color="#FFFFFF" />}
              label="STATION"
              value={user.personnel_details?.station_assigned || 'BFP Lian Fire Station'}
            />
            {user.personnel_details?.employee_number ? (
              <InfoRow
                icon={<ShieldCheck size={18} color="#FFFFFF" />}
                label="BADGE #"
                value={user.personnel_details.employee_number}
              />
            ) : null}
            <InfoRow icon={<Phone size={18} color="#FFFFFF" />} label="CONTACT" value={user.contact_number ?? 'Not set'} isLast />
          </Card>
        </View>

        <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, fontWeight: '700', marginTop: spacing.xl, marginBottom: spacing.sm, marginHorizontal: spacing.lg }}>
          ACCOUNT
        </Text>
        <View style={{ marginHorizontal: spacing.lg }}>
          <Card padding={0}>
            <ProfileMenuRow
              isFirst
              isLast
              icon={<SettingsIcon size={18} color="#FFFFFF" />}
              gradient={['#64748B', '#0F1C3F']}
              label="App Settings"
              subtitle="Theme, notifications, preferences"
              onPress={() => router.push('/(bfp)/profile/settings?from=profile')}
            />
          </Card>
        </View>

        <View style={{ marginTop: spacing.xl, marginHorizontal: spacing.lg }}>
          <Button
            label="Sign Out"
            variant="outline"
            onPress={handleSignOutPress}
            loading={isLoggingOut}
            icon={<LogOut size={16} color={colors.danger} />}
            style={{ borderColor: colors.danger }}
          />
        </View>

        <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, textAlign: 'center', marginTop: spacing.lg }}>
          FIRESIGHT · BFP Lian Fire Station{'\n'}Version 1.0.0
        </Text>
      </ScrollView>

      <ConfirmationDialog
        visible={showLogoutModal}
        type="danger"
        title="Sign Out"
        message="Are you sure you want to sign out of FireSight?"
        confirmText="Sign Out"
        cancelText="Cancel"
        onConfirm={confirmSignOut}
        onCancel={() => setShowLogoutModal(false)}
        icon={<LogOut size={28} color="#FFFFFF" strokeWidth={2.5} />}
      />

      {/* Photo Picker Options Modal (Take Photo / Gallery / Remove) */}
      <PhotoOptionsModal
        visible={showPhotoOptions}
        onClose={() => setShowPhotoOptions(false)}
        onImageSelected={handleImageSelected}
        onRemovePhoto={handleRemovePhoto}
        hasExistingPhoto={Boolean(profileImageUri)}
      />

      {/* Social-Media Style Interactive Crop & Adjust Modal */}
      <PhotoCropModal
        visible={showCropModal}
        imageUri={cropTargetUri}
        onClose={() => {
          setShowCropModal(false);
          setCropTargetUri(null);
        }}
        onCropComplete={handleCropComplete}
      />

      {/* Photo Preview & Confirmation Modal */}
      <PhotoPreviewModal
        visible={showPhotoPreview}
        imageUri={pendingPhotoUri}
        onClose={() => {
          if (!isUploadingPhoto) {
            setShowPhotoPreview(false);
            setPendingPhotoUri(null);
          }
        }}
        onChooseAnother={() => {
          if (!isUploadingPhoto) {
            setShowPhotoPreview(false);
            setPendingPhotoUri(null);
            setShowPhotoOptions(true);
          }
        }}
        onConfirm={handleConfirmUpload}
        isLoading={isUploadingPhoto}
      />
    </View>
  );
}

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string; isLast?: boolean }> = ({
  icon,
  label,
  value,
  isLast,
}) => {
  const { colors, spacing, typography, isDark } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: isLast ? 0 : spacing.md }}>
      <View
        style={[
          styles.infoIcon,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#0F1C3F',
          },
        ]}
      >
        {icon}
      </View>
      <View style={{ marginLeft: spacing.sm }}>
        <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color: colors.textPrimary, fontSize: typography.size.sm, fontWeight: '600', marginTop: 1 }}>{value}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Hero card
  heroCard: {
    borderRadius: 24,
    padding: 22,
    backgroundColor: '#0F1C3F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroEditBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.22)',
    zIndex: 3,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrap: {
    width: 76,
    height: 76,
    position: 'relative',
  },
  avatarClip: {
    width: 76,
    height: 76,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F4622B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6D5BD0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#0F1C3F',
  },
  heroMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: -0.4,
  },
  heroEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
    fontWeight: '400',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FED7AA',
  },
  infoIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});