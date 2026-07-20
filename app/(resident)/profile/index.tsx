import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  FileText,
  Lock,
  Settings as SettingsIcon,
  LogOut,
  BadgeCheck,
  Phone,
  MapPin,
} from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { AppHeader } from '../../../components/navigation/AppHeader';
import { ProfileMenuRow } from '../../../components/profile/ProfileMenuRow';
import { Button } from '../../../components/ui/Button';
import { getInitials } from '../../../utils/formatters';

export default function ProfileScreen() {
  const { colors, spacing, typography, radius, shadow } = useTheme();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of FireSight?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          await logout();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  if (!user) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader variant="light" />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}>
          {/* Identity card */}
          <View
            style={[
              styles.identityCard,
              { backgroundColor: colors.surfaceElevated, borderRadius: radius.lg, padding: spacing.lg },
              shadow.card,
            ]}
          >
            <View style={[styles.avatar, { backgroundColor: colors.brandNavy }]}>
              <Text style={styles.avatarText}>{getInitials(user.first_name, user.last_name)}</Text>
            </View>
            <View style={{ marginLeft: spacing.md, flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: typography.size.lg, fontWeight: '800' }}>
                {user.first_name} {user.last_name}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 1 }}>{user.email}</Text>
              {user.is_verified ? (
                <View style={styles.verifiedRow}>
                  <BadgeCheck size={13} color={colors.success} />
                  <Text style={{ color: colors.success, fontSize: typography.size.xs, marginLeft: 4, fontWeight: '600' }}>
                    Verified Account
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Personal information */}
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.textMuted, fontSize: typography.size.xs, marginTop: spacing.xl, marginBottom: spacing.sm },
            ]}
          >
            PERSONAL INFORMATION
          </Text>
          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.surfaceElevated, borderRadius: radius.lg, padding: spacing.lg },
              shadow.card,
            ]}
          >
            <View style={styles.infoRow}>
              <Text style={{ color: colors.textMuted, fontSize: typography.size.xs }}>FULL NAME</Text>
              <Text style={{ color: colors.textPrimary, fontSize: typography.size.sm, marginTop: 2, fontWeight: '600' }}>
                {[user.first_name, user.middle_name, user.last_name, user.suffix].filter(Boolean).join(' ')}
              </Text>
            </View>

            <View style={[styles.infoRow, { marginTop: spacing.md }]}>
              <View style={styles.iconLabel}>
                <Phone size={12} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginLeft: 4 }}>MOBILE</Text>
              </View>
              <Text style={{ color: colors.textPrimary, fontSize: typography.size.sm, marginTop: 2, fontWeight: '600' }}>
                {user.contact_number ?? 'Not set'}
              </Text>
            </View>

            <View style={[styles.infoRow, { marginTop: spacing.md }]}>
              <View style={styles.iconLabel}>
                <MapPin size={12} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginLeft: 4 }}>ADDRESS</Text>
              </View>
              <Text style={{ color: colors.textPrimary, fontSize: typography.size.sm, marginTop: 2, fontWeight: '600' }}>
                {user.address
                  ? `${user.address.house_no_street ? user.address.house_no_street + ', ' : ''}${user.address.barangay_name ?? ''}, ${user.address.municipality}`
                  : 'Not set'}
              </Text>
            </View>
          </View>

          {/* Account section */}
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.textMuted, fontSize: typography.size.xs, marginTop: spacing.xl, marginBottom: spacing.sm },
            ]}
          >
            ACCOUNT
          </Text>
          <View
            style={[
              styles.menuCard,
              { backgroundColor: colors.surfaceElevated, borderRadius: radius.lg, paddingHorizontal: spacing.lg },
              shadow.card,
            ]}
          >
            <ProfileMenuRow
              icon={<FileText size={16} color={colors.brandOrange} />}
              label="My Reports"
              subtitle="View report history"
              onPress={() => router.push('/(resident)/profile')}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <ProfileMenuRow
              icon={<Lock size={16} color={colors.brandOrange} />}
              label="Privacy & Security"
              subtitle="Manage your data"
              onPress={() => router.push('/(resident)/profile/edit')}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <ProfileMenuRow
              icon={<SettingsIcon size={16} color={colors.brandOrange} />}
              label="App Settings"
              subtitle="Theme, notifications, preferences"
              onPress={() => router.push('/(resident)/profile/settings')}
            />
          </View>

          <View style={{ marginTop: spacing.xl }}>
            <Button
              label="Sign Out"
              variant="outline"
              onPress={handleSignOut}
              loading={isLoggingOut}
              icon={<LogOut size={16} color={colors.danger} />}
              style={{ borderColor: colors.danger }}
            />
          </View>

          <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, textAlign: 'center', marginTop: spacing.lg }}>
            FIRESIGHT · Lian, Batangas{'\n'}Version {APP_VERSION}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const APP_VERSION = '1.0.0 · Build 2026.07';

const styles = StyleSheet.create({
  identityCard: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  sectionTitle: { fontWeight: '700', letterSpacing: 0.5 },
  infoCard: {},
  infoRow: {},
  iconLabel: { flexDirection: 'row', alignItems: 'center' },
  menuCard: {},
  divider: { height: StyleSheet.hairlineWidth },
});