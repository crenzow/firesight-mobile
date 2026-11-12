import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Smartphone, Sun, Moon, MoonStar } from 'lucide-react-native';
import { useTheme, ThemePreference } from '../../../theme/ThemeContext';
import { SecondaryHeader } from '../../../components/navigation/SecondaryHeader';
import { RadioOptionRow } from '../../../components/profile/RadioOptionRow';

const THEME_OPTIONS: { key: ThemePreference; title: string; subtitle: string; icon: React.ComponentType<{ size: number; color: string }>; gradient: [string, string] }[] = [
  { key: 'system', title: 'System Default', subtitle: 'Follows your device appearance', icon: Smartphone, gradient: ['#64748B', '#0F1C3F'] },
  { key: 'light', title: 'Light Mode', subtitle: 'Official application theme', icon: Sun, gradient: ['#F97316', '#FFB877'] },
  { key: 'blackDark', title: 'Black Dark Mode', subtitle: 'Pure black', icon: Moon, gradient: ['#1A2340', '#000000'] },
  { key: 'dimDark', title: 'Dim Dark Mode', subtitle: 'Soft dark', icon: MoonStar, gradient: ['#6D5BD0', '#3B4CCA'] },
];

export default function SettingsScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { colors, spacing, typography, preference, setPreference } = useTheme();

  const handleBack = useCallback(() => {
    if (from && (from.includes('home') || from === '/(resident)/home')) {
      router.replace('/(resident)/home');
    } else {
      router.replace('/(resident)/profile');
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
        title="Appearance" 
        onBack={handleBack} 
      />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted, fontSize: typography.size.xs, marginBottom: spacing.sm }]}>
            THEME PREFERENCE
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
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontWeight: '700', letterSpacing: 0.5 },
});
