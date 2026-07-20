import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/ui/Button';
import { EyeLogo } from '../../components/ui/EyeLogo';
import { APP_CONFIG } from '../../constants/config';

export default function WelcomeScreen() {
  const { colors, spacing, typography } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.brandNavy }]} edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <View style={[styles.logoCircle, { borderColor: colors.brandOrange }]}>
          <EyeLogo size={48} />
        </View>
        <Text style={[styles.title, { color: colors.textInverse, fontSize: typography.size.xxxl }]}>
          FIRE<Text style={{ color: colors.brandOrange }}>SIGHT</Text>
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted, marginTop: spacing.xs }]}>
          Municipal Fire Safety System
        </Text>
        <Text style={[styles.tagline, { color: colors.textMuted, marginTop: spacing.lg }]}>
          Official fire reporting & awareness app{'\n'}for {APP_CONFIG.DEFAULT_MUNICIPALITY}, {APP_CONFIG.DEFAULT_PROVINCE}
        </Text>
      </View>

      <View style={[styles.actions, { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }]}>
        <Button
          label="Get Started"
          onPress={() => router.push('/(auth)/login')}
          icon={<ChevronRight size={18} color={colors.textInverse} />}
        />
        <Text style={[styles.legal, { color: colors.textMuted, marginTop: spacing.lg }]}>
          By continuing, you agree to FireSight's Terms of Service and Privacy Policy.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontWeight: '800',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  tagline: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  actions: {},
  legal: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});