import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';

const firesightLogo = require('../assets/images/firesight-logo.png');

/**
 * First screen shown on launch. Waits for the AuthContext to finish
 * checking secure storage for a saved session, then routes either into
 * the resident app (already logged in) or the (auth) welcome screen.
 */
export default function SplashScreen() {
  const { colors, typography, spacing } = useTheme();
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  useEffect(() => {

    if (isBootstrapping) return;
    const timeout = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace('/(auth)/welcome');
      } else if (user?.role === 'personnel') {
        router.replace('/(bfp)/dashboard');
      } else {
        router.replace('/(resident)/home');
      }
    }, 900);
    return () => clearTimeout(timeout);
  }, [isBootstrapping, isAuthenticated, user]);

  return (
    <View style={[styles.container, { backgroundColor: colors.brandNavy }]}>

      {/* Centered brand — mirrors welcome.tsx exactly */}
      <View style={styles.hero}>
        <Image source={firesightLogo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>
          FIRE<Text style={{ color: colors.brandOrange }}>SIGHT</Text>
        </Text>
        <Text style={styles.subtitle}>MUNICIPAL FIRE SAFETY SYSTEM</Text>
        <View style={{ marginTop: 40 }}>
          <ActivityIndicator size="large" color={colors.brandOrange} />
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: -20,
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
  footer: {
    width: '100%',
    paddingBottom: 48,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
});
