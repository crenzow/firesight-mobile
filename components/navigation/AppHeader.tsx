import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';

interface AppHeaderProps {
  unreadCount?: number;
  variant?: 'dark' | 'light'; // dark = navy background (Home), light = surface background (other screens)
}

/**
 * Global header used across resident screens.
 * Per the master prompt: shows the "FIRESIGHT" wordmark top-left instead of
 * the resident's name (the name is shown in the Home body greeting instead),
 * and the notification bell is the single entry point into alerts — there is
 * no separate "Alerts" tab.
 */
export const AppHeader: React.FC<AppHeaderProps> = ({ unreadCount = 0, variant = 'dark' }) => {
  const { colors, spacing, typography } = useTheme();
  const isDark = variant === 'dark';
  const backgroundColor = isDark ? colors.brandNavy : colors.surface;
  const textColor = isDark ? colors.textInverse : colors.textPrimary;

  return (
    <SafeAreaView style={{ backgroundColor }} edges={['top']}>
      <View style={[styles.row, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <Text style={[styles.wordmark, { color: textColor, fontSize: typography.size.lg }]}>
          FIRE<Text style={{ color: colors.brandOrange }}>SIGHT</Text>
        </Text>

        <Pressable
          onPress={() => router.push('/(resident)/notifications')}
          hitSlop={10}
          style={[
            styles.bellButton,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.background },
          ]}
        >
          <Bell size={20} color={textColor} />
          {unreadCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: colors.brandOrange, borderColor: backgroundColor }]}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: {
    fontWeight: '800',
    letterSpacing: 1,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});