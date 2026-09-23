import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Smartphone, Sun, Moon, MoonStar } from 'lucide-react-native';
import { useTheme, ThemePreference } from '../../../theme/ThemeContext';
import { SecondaryHeader } from '../../../components/navigation/SecondaryHeader';
import { RadioOptionRow } from '../../../components/profile/RadioOptionRow';
import { APP_CONFIG } from '../../../constants/config';

const THEME_OPTIONS: { key: ThemePreference; title: string; subtitle: string; icon: React.ComponentType<{ size: number; color: string }>; gradient: [string, string] }[] = [
  { key: 'system', title: 'System Default', subtitle: 'Follows your device appearance', icon: Smartphone, gradient: ['#64748B', '#0F1C3F'] },
  { key: 'light', title: 'Light Mode', subtitle: 'Official application theme', icon: Sun, gradient: ['#F97316', '#FFB877'] },
  { key: 'blackDark', title: 'Black Dark Mode', subtitle: 'Pure black', icon: Moon, gradient: ['#1A2340', '#000000'] },
  { key: 'dimDark', title: 'Dim Dark Mode', subtitle: 'Soft dark', icon: MoonStar, gradient: ['#6D5BD0', '#3B4CCA'] },
];

export default function SettingsScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { colors, spacing, typography, preference, setPreference } = useTheme();

  const [pushNotifications, setPushNotifications] = useState(true);
  const [alertSounds, setAlertSounds] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SecondaryHeader 
        title="Settings" 
        onBack={() => from ? router.replace(from as any) : router.back()} 
      />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted, fontSize: typography.size.xs, marginBottom: spacing.sm }]}>
          APPEARANCE
        </Text>
        {THEME_OPTIONS.map(({ key, title, subtitle, icon: Icon, gradient }) => (
          <RadioOptionRow
            key={key}
            icon={<Icon size={18} color="#FFFFFF" />}
            gradient={gradient}
            title={title}
            subtitle={subtitle}
            selected={preference === key}
            onPress={() => setPreference(key)}
          />
        ))}

        <Text
          style={[
            styles.sectionTitle,
            { color: colors.textMuted, fontSize: typography.size.xs, marginTop: spacing.xl, marginBottom: spacing.sm },
          ]}
        >
          NOTIFICATIONS & PRIVACY
        </Text>
        <View style={[styles.toggleCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12 }]}>
          <ToggleRow
            title="Push Notifications"
            subtitle="Receive alerts and updates"
            value={pushNotifications}
            onValueChange={setPushNotifications}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ToggleRow
            title="Alert Sounds"
            subtitle="Sound for emergency alerts"
            value={alertSounds}
            onValueChange={setAlertSounds}
          />
        </View>

        <View style={[styles.footerCard, { marginTop: spacing.xl }]}>
          <Text style={{ color: colors.brandOrange, fontSize: typography.size.md, fontWeight: '800' }}>
            FIRE<Text style={{ color: colors.textPrimary }}>SIGHT</Text>
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 4, textAlign: 'center' }}>
            Municipal Fire Safety System{'\n'}Version {APP_CONFIG.APP_VERSION} · Build 2026.07
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 8, textAlign: 'center' }}>
            Bureau of Fire Protection · {APP_CONFIG.DEFAULT_MUNICIPALITY}, {APP_CONFIG.DEFAULT_PROVINCE}
          </Text>
        </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const ToggleRow: React.FC<{
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}> = ({ title, subtitle, value, onValueChange }) => {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={[styles.toggleRow, { padding: spacing.md }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textPrimary, fontSize: typography.size.sm, fontWeight: '600' }}>{title}</Text>
        <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 1 }}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.brandOrange }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontWeight: '700' },
  sectionTitle: { fontWeight: '700', letterSpacing: 0.5 },
  toggleCard: { borderWidth: 1, overflow: 'hidden' },
  toggleRow: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: StyleSheet.hairlineWidth },
  footerCard: { alignItems: 'center' },
});