import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  FileText,
  Lock,
  Settings as SettingsIcon,
  LogOut,
  MapPin,
  ShieldCheck,
  Edit3,
  Mail,
  Phone,
  Camera,
  User,
} from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { AppHeader } from '../../../components/navigation/AppHeader';
import { ProfileMenuRow } from '../../../components/profile/ProfileMenuRow';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { getInitials, formatFullName } from '../../../utils/formatters';
import { getProfileImageUri } from '../../../utils/avatar';
import { profileService } from '../../../services/api/profileService';
import { ApiError } from '../../../services/api/client';
import { PhotoOptionsModal, PhotoPreviewModal } from '../../../components/profile/PhotoPickerModal';
import { PhotoCropModal } from '../../../components/profile/PhotoCropModal';

export default function ProfileScreen() {
  const { colors, spacing, typography } = useTheme();
  const { user, logout, refreshUser, updateUser } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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

  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
  const barangayName = user.address?.barangay_name ?? 'Lian, Batangas';
  const profileImageUri = getProfileImageUri(localImage ?? user.profile_image);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader variant="dark" />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>

          {/* ── Premium Identity Hero Card ── */}
          <View style={[styles.heroShadow, { marginHorizontal: spacing.lg, marginTop: spacing.sm }]}>
            <View style={styles.heroCard}>
              {/* Gradient background */}
              <LinearGradient
                colors={['#0F1C3F', '#1B2A5A', 'rgba(244,98,43,0.45)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Edit button */}
              <Pressable
                style={({ pressed }) => [
                  styles.heroEditBtn,
                  {
                    backgroundColor: pressed ? colors.brandOrange : 'rgba(255, 255, 255, 0.2)',
                    borderColor: pressed ? colors.brandOrange : 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 1,
                    transform: [{ scale: pressed ? 0.90 : 1 }],
                  },
                ]}
                onPress={() => router.push({ pathname: '/(resident)/profile/edit', params: { from: pathname } } as any)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Edit Profile"
              >
                <Edit3 size={14} color="#FFFFFF" />
              </Pressable>

              {/* Avatar + name */}
              <View style={styles.heroTop}>
                <Pressable
                  onPress={() => setShowPhotoOptions(true)}
                  disabled={isUploadingPhoto}
                  style={({ pressed }) => [
                    styles.avatarWrap,
                    {
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                      opacity: pressed ? 0.88 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Change profile photo"
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
                </View>
              </View>
            </View>
          </View>

          {/* ── Personal Information ── */}
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.textMuted,
                fontSize: typography.size.xs,
                marginTop: spacing.xl,
                marginBottom: spacing.sm,
                marginHorizontal: spacing.lg,
              },
            ]}
          >
            PERSONAL INFORMATION
          </Text>
          <View style={{ marginHorizontal: spacing.lg }}>
            <Card padding={spacing.lg}>
              <InfoRow label="USERNAME" icon={<User size={18} color="#FFFFFF" />}>
                {user.email.split('@')[0]}
              </InfoRow>

              <InfoRow label="EMAIL" icon={<Mail size={18} color="#FFFFFF" />}>
                {user.email}
              </InfoRow>

              <InfoRow label="MOBILE" icon={<Phone size={18} color="#FFFFFF" />}>
                {user.contact_number ?? 'Not set'}
              </InfoRow>

              <InfoRow label="ADDRESS" icon={<MapPin size={18} color="#FFFFFF" />} isLast>
                {user.address
                  ? `${user.address.house_no_street ? user.address.house_no_street + ', ' : ''}${user.address.barangay_name ?? ''}, ${user.address.municipality}`
                  : 'Not set'}
              </InfoRow>
            </Card>
          </View>

          {/* ── Account ── */}
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.textMuted,
                fontSize: typography.size.xs,
                marginTop: spacing.xl,
                marginBottom: spacing.sm,
                marginHorizontal: spacing.lg,
              },
            ]}
          >
            ACCOUNT
          </Text>
          <View style={{ marginHorizontal: spacing.lg }}>
            <Card padding={0}>
              <View style={{ paddingHorizontal: spacing.lg }}>
                <ProfileMenuRow
                  icon={<FileText size={18} color="#FFFFFF" />}
                  gradient={['#F97316', '#FFB877']}
                  label="My Reports"
                  subtitle="View report history"
                  onPress={() => router.push({ pathname: '/(resident)/reports', params: { from: pathname } } as any)}
                />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <ProfileMenuRow
                  icon={<Lock size={18} color="#FFFFFF" />}
                  gradient={['#6D5BD0', '#3B4CCA']}
                  label="Privacy & Security"
                  subtitle="Manage your data"
                  onPress={() => router.push({ pathname: '/(resident)/profile/security', params: { from: pathname } } as any)}
                />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <ProfileMenuRow
                  icon={<SettingsIcon size={18} color="#FFFFFF" />}
                  gradient={['#64748B', '#0F1C3F']}
                  label="App Settings"
                  subtitle="Theme, notifications, preferences"
                  onPress={() => router.push({ pathname: '/(resident)/profile/settings', params: { from: pathname } } as any)}
                />
              </View>
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

          <Text
            style={{
              color: colors.textMuted,
              fontSize: typography.size.xs,
              textAlign: 'center',
              marginTop: spacing.lg,
              marginBottom: spacing.sm,
            }}
          >
            FIRESIGHT · Lian, Batangas{'\n'}Version {APP_VERSION}
          </Text>
        </ScrollView>
      </SafeAreaView>

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

// ── Small helper component ──
function InfoRow({
  label,
  icon,
  children,
  isLast,
}: {
  label: string;
  icon?: React.ReactNode;
  children: string;
  isLast?: boolean;
}) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: isLast ? 0 : spacing.md }}>
      <LinearGradient
        colors={['#64748B', '#0F1C3F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.infoIcon}
      >
        {icon}
      </LinearGradient>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, fontWeight: '700', letterSpacing: 0.3 }}>
          {label}
        </Text>
        <Text style={[styles.infoValue, { color: colors.textPrimary, fontSize: typography.size.sm }]}>
          {children}
        </Text>
      </View>
    </View>
  );
}

const APP_VERSION = '1.0.0 · Build 2026.07';

const styles = StyleSheet.create({
  // Hero card
  heroShadow: {
    borderRadius: 30,
    backgroundColor: '#0F1C3F',
    ...Platform.select({
      ios: {
        shadowColor: '#0F1C3F',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.28,
        shadowRadius: 26,
      },
      android: { elevation: 8 },
    }),
  },
  heroCard: {
    borderRadius: 30,
    padding: 22,
    overflow: 'hidden',
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
  locationPinBtn: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
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

  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // Info rows
  infoValue: { fontWeight: '600', marginTop: 2 },

  // Divider
  divider: { height: StyleSheet.hairlineWidth },

  // Section
  sectionTitle: { fontWeight: '700', letterSpacing: 0.5 },
});