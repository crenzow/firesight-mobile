import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Lock, Shield, FileText } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { SecondaryHeader } from '../../../components/navigation/SecondaryHeader';
import { ProfileMenuRow } from '../../../components/profile/ProfileMenuRow';
import { Card } from '../../../components/ui/Card';

export default function SecurityScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { colors, spacing, typography } = useTheme();

  const handleBack = useCallback(() => {
    if (from) {
      router.replace(from as any);
    } else {
      router.back();
    }
  }, [from]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [handleBack])
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SecondaryHeader 
        title="Privacy & Security" 
        onBack={handleBack} 
      />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}>
          
          <Text style={[styles.sectionTitle, { color: colors.textMuted, fontSize: typography.size.xs, marginBottom: spacing.sm }]}>
            ACCOUNT SECURITY
          </Text>
          <Card padding={0}>
            <View style={{ paddingHorizontal: spacing.lg }}>
              <ProfileMenuRow
                icon={<Lock size={18} color="#FFFFFF" />}
                gradient={['#1A2340', '#000000']}
                label="Change Password"
                subtitle="Update your account password"
                onPress={() => {
                  // TODO: Implement change password flow
                }}
              />
            </View>
          </Card>

          <Text style={[styles.sectionTitle, { color: colors.textMuted, fontSize: typography.size.xs, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
            DATA & PRIVACY
          </Text>
          <Card padding={0}>
            <View style={{ paddingHorizontal: spacing.lg }}>
              <ProfileMenuRow
                icon={<FileText size={18} color="#FFFFFF" />}
                gradient={['#64748B', '#0F1C3F']}
                label="Privacy Policy"
                subtitle="How your data is collected and used"
                onPress={() => {
                  // TODO: Show privacy policy modal or screen
                }}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <ProfileMenuRow
                icon={<Shield size={18} color="#FFFFFF" />}
                gradient={['#EF4444', '#991B1B']}
                label="Delete Account"
                subtitle="Permanently remove your data"
                destructive
                onPress={() => {
                  // TODO: Implement account deletion request
                }}
              />
            </View>
          </Card>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontWeight: '700', letterSpacing: 0.5 },
  divider: { height: StyleSheet.hairlineWidth },
});
