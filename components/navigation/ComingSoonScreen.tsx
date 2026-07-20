import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { AppHeader } from '../navigation/AppHeader';

interface ComingSoonScreenProps {
  icon: React.ReactNode;
  title: string;
  message: string;
}

/**
 * TEMPORARY placeholder used only so the tab navigator has a valid route to
 * render while the Map / Learn / Profile screens are being built out in
 * subsequent batches. Each will be replaced with its full implementation.
 */
export const ComingSoonScreen: React.FC<ComingSoonScreenProps> = ({ icon, title, message }) => {
  const { colors, spacing, typography, radius } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader variant="light" />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={[styles.iconCircle, { backgroundColor: `${colors.brandOrange}14`, borderRadius: radius.full }]}>
          {icon}
        </View>
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.size.lg, marginTop: spacing.lg }]}>
          {title}
        </Text>
        <Text
          style={[
            styles.message,
            { color: colors.textSecondary, fontSize: typography.size.sm, marginTop: spacing.sm },
          ]}
        >
          {message}
        </Text>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontWeight: '700' },
  message: { textAlign: 'center', lineHeight: 20 },
});