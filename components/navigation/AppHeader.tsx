import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

const firesightLogo = require('../../assets/images/firesight-logo.png');

interface AppHeaderProps {
  variant?: 'dark' | 'light';
}

export const AppHeader: React.FC<AppHeaderProps> = ({ variant = 'dark' }) => {
  const { colors, spacing, typography } = useTheme();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();

  const isDark = variant === 'dark';
  const backgroundColor = isDark ? colors.brandNavy : colors.surface;
  const textColor = isDark ? colors.textInverse : colors.textPrimary;
  const bellBg = isDark ? 'rgba(255,255,255,0.1)' : colors.background;

  return (
    <SafeAreaView style={{ backgroundColor }} edges={['top']}>
      <View style={[styles.row, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <View style={styles.brandContainer}>
          <Image source={firesightLogo} style={styles.headerLogo} resizeMode="contain" />
          <Text style={[styles.wordmark, { color: textColor, fontSize: 20 }]}>
            FIRE<Text style={{ color: colors.brandOrange }}>SIGHT</Text>
          </Text>
        </View>

        <Pressable
          onPress={() => router.push({ pathname: '/(resident)/notifications', params: { from: pathname } } as any)}
          hitSlop={10}
          style={[styles.bellButton, { backgroundColor: bellBg }]}
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
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 34,
    height: 34,
    marginRight: 1,
  },
  wordmark: {
    fontSize: 20,
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