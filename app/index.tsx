import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { APP_CONFIG } from '../constants/config';
import { EyeLogo } from '../components/ui/EyeLogo';

/**
 * First screen shown on launch. Waits for the AuthContext to finish
 * checking secure storage for a saved session, then routes either into
 * the resident app (already logged in) or the (auth) welcome screen.
 */
export default function SplashScreen() {
  const { colors, typography, spacing } = useTheme();
  const { isAuthenticated, isBootstrapping } = useAuth();

  useEffect(() => {
    if (isBootstrapping) return;
    const timeout = setTimeout(() => {
      router.replace(isAuthenticated ? '/(resident)/home' : '/(auth)/welcome');
    }, 900); // brief branded pause instead of an instant jump-cut
    return () => clearTimeout(timeout);
  }, [isBootstrapping, isAuthenticated]);

  return (
    <View style={[styles.container, { backgroundColor: colors.brandNavy }]}>
      <View style={[styles.logoCircle, { borderColor: colors.brandOrange }]}>
        {/* Placeholder eye-shaped logo mark (view-based, no image asset
            required). Swap for the final logo image later — the surrounding
            circle badge and layout will not need to change. */}
        <EyeLogo size={48} />
      </View>

      <Text style={[styles.title, { color: colors.textInverse, fontSize: typography.size.xxxl }]}>
        FIRE<Text style={{ color: colors.brandOrange }}>SIGHT</Text>
      </Text>
      <Text style={[styles.subtitle, { color: colors.textMuted, marginTop: spacing.xs }]}>
        Municipal Fire Safety System
      </Text>
      <Text style={[styles.tagline, { color: colors.textMuted, marginTop: spacing.md }]}>
        Official fire reporting & awareness app{'\n'}for {APP_CONFIG.DEFAULT_MUNICIPALITY}, {APP_CONFIG.DEFAULT_PROVINCE}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
});