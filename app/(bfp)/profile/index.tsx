import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ShieldCheck, Settings as SettingsIcon, LogOut, Phone, Building2, IdCard, Edit3, Camera } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { GlassHeader } from '../../../components/glass/GlassHeader';
import { GlassCard } from '../../../components/glass/GlassCard';
import { ProfileMenuRow } from '../../../components/profile/ProfileMenuRow';
import { Button } from '../../../components/ui/Button';
import { getInitials, formatFullName } from '../../../utils/formatters';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';

export default function BFPProfileScreen() {
  const { colors, spacing, typography } = useTheme();
  const { user, logout, refreshUser } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [localImage, setLocalImage] = useState<string | null>(null);
  const pathname = usePathname();

  React.useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const pickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setLocalImage(result.assets[0].uri);
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
  const profileImageUri = localImage ?? user.profile_image ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GlassHeader title="Profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        {/* ── Premium Identity Hero Card ── */}
        <View style={[styles.heroShadow, { marginHorizontal: spacing.lg, marginTop: spacing.md }]}>
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
              style={styles.heroEditBtn}
              onPress={() => router.push({ pathname: '/(bfp)/profile/edit', params: { from: pathname } } as any)}
            >
              <Edit3 size={14} color="#FFFFFF" />
            </Pressable>

            {/* Avatar + name */}
            <View style={styles.heroTop}>
              <Pressable onPress={pickProfileImage} style={styles.avatarWrap}>
                <View style={styles.avatarClip}>
                  {profileImageUri ? (
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
        </View>

        <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, fontWeight: '700', marginTop: spacing.xl, marginBottom: spacing.sm, marginHorizontal: spacing.lg }}>
          ASSIGNMENT
        </Text>
        <View style={{ marginHorizontal: spacing.lg }}>
          <GlassCard>
            <InfoRow icon={<IdCard size={14} color={colors.brandOrange} />} label="RANK" value="Fire Officer II" />
            <InfoRow icon={<Building2 size={14} color={colors.brandOrange} />} label="STATION" value="BFP Lian Fire Station" />
            <InfoRow icon={<Phone size={14} color={colors.brandOrange} />} label="CONTACT" value={user.contact_number ?? 'Not set'} isLast />
          </GlassCard>
        </View>

        <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, fontWeight: '700', marginTop: spacing.xl, marginBottom: spacing.sm, marginHorizontal: spacing.lg }}>
          ACCOUNT
        </Text>
        <View style={{ marginHorizontal: spacing.lg }}>
          <GlassCard padding={0}>
            <View style={{ paddingHorizontal: spacing.lg }}>
              <ProfileMenuRow
                icon={<SettingsIcon size={18} color="#FFFFFF" />}
                gradient={['#64748B', '#0F1C3F']}
                label="App Settings"
                subtitle="Theme, notifications, preferences"
                onPress={() => router.push('/(bfp)/profile/settings?from=profile')}
              />
            </View>
          </GlassCard>
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
    </View>
  );
}

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string; isLast?: boolean }> = ({
  icon,
  label,
  value,
  isLast,
}) => {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: isLast ? 0 : spacing.md }}>
      <View style={[styles.infoIcon, { backgroundColor: `${colors.brandOrange}14` }]}>{icon}</View>
      <View style={{ marginLeft: spacing.sm }}>
        <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color: colors.textPrimary, fontSize: typography.size.sm, fontWeight: '600', marginTop: 1 }}>{value}</Text>
      </View>
    </View>
  );
};

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
  infoIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});