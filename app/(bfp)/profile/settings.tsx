import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, BackHandler } from 'react-native';
import { Smartphone, Sun, Moon, MoonStar } from 'lucide-react-native';
import { useTheme, ThemePreference } from '../../../theme/ThemeContext';
import { SecondaryHeader } from '../../../components/navigation/SecondaryHeader';
import { Card } from '../../../components/ui/Card';
import { RadioOptionRow } from '../../../components/profile/RadioOptionRow';

import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';

const THEME_OPTIONS: { key: ThemePreference; title: string; subtitle: string; icon: React.ComponentType<{ size: number; color: string }>; gradient: [string, string] }[] = [
  { key: 'system', title: 'System Default', subtitle: 'Follows your device appearance', icon: Smartphone, gradient: ['#64748B', '#0F1C3F'] },
  { key: 'light', title: 'Light Mode', subtitle: 'Official application theme', icon: Sun, gradient: ['#F97316', '#FFB877'] },
  { key: 'blackDark', title: 'Black Dark Mode', subtitle: 'Pure black', icon: Moon, gradient: ['#1A2340', '#000000'] },
  { key: 'dimDark', title: 'Dim Dark Mode', subtitle: 'Soft dark', icon: MoonStar, gradient: ['#6D5BD0', '#3B4CCA'] },
];

export default function BFPSettingsScreen() {
  const { colors, spacing, typography, preference, setPreference } = useTheme();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [realTimeAlerts, setRealTimeAlerts] = useState(true);
  const [alertSounds, setAlertSounds] = useState(true);

  const handleBack = useCallback(() => {
    if (from) {
      if (from.startsWith('/')) {
        router.replace(from as any);
      } else {
        router.replace(`/(bfp)/${from}` as any);
      }
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
      <SecondaryHeader title="Settings" onBack={handleBack} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}>
        <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, fontWeight: '700', marginBottom: spacing.sm }}>
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

        <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, fontWeight: '700', marginTop: spacing.xl, marginBottom: spacing.sm }}>
          ALERTS
        </Text>
        <Card padding={0}>
          <View style={{ paddingHorizontal: spacing.lg }}>
            <ToggleRow title="Real-Time Alerts" subtitle="Push notification on new incidents" value={realTimeAlerts} onValueChange={setRealTimeAlerts} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <ToggleRow title="Alert Sounds" subtitle="Sound for emergency alerts" value={alertSounds} onValueChange={setAlertSounds} />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const ToggleRow: React.FC<{ title: string; subtitle: string; value: boolean; onValueChange: (v: boolean) => void }> = ({
  title,
  subtitle,
  value,
  onValueChange,
}) => {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textPrimary, fontSize: typography.size.sm, fontWeight: '600' }}>{title}</Text>
        <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 1 }}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.border, true: colors.brandOrange }} thumbColor="#FFFFFF" />
    </View>
  );
};

const styles = StyleSheet.create({
  divider: { height: StyleSheet.hairlineWidth },
});