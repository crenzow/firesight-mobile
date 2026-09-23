import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/ui/Button';
import { APP_CONFIG } from '../../constants/config';

const firesightLogo = require('../../assets/images/firesight-logo.png');

export default function WelcomeScreen() {
  const { colors, spacing } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.brandNavy }]} edges={['top', 'bottom']}>

      {/* Centered brand unit */}
      <View style={styles.hero}>
        <Image source={firesightLogo} style={styles.logo} resizeMode="contain" />

        <Text style={styles.title}>
          FIRE<Text style={{ color: colors.brandOrange }}>SIGHT</Text>
        </Text>

        <Text style={styles.subtitle}>MUNICIPAL FIRE SAFETY SYSTEM</Text>

        <Text style={[styles.tagline, { color: 'rgba(255,255,255,0.35)', marginTop: 28 }]}>
          Official fire reporting & awareness app{'\n'}for {APP_CONFIG.DEFAULT_MUNICIPALITY}, {APP_CONFIG.DEFAULT_PROVINCE}
        </Text>
      </View>

      {/* Bottom CTA */}
      <View style={[styles.actions, { bottom: spacing.lg, paddingHorizontal: spacing.xl, alignItems: 'center' }]}>
        <Button
          label="Get Started"
          onPress={() => router.push('/(auth)/login')}
          icon={<ChevronRight size={18} color="#FFFFFF" />}
        />
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 16, textAlign: 'center' }}>
          © {new Date().getFullYear()} FIRESIGHT. All rights reserved.
        </Text>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80, // This shifts the whole hero content higher in the center
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: -20, // Negative margin to bring the text much closer to the logo
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.38)',
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: 8,
  },
  tagline: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});