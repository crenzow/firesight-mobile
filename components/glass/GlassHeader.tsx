import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { router, useSegments } from 'expo-router';
import { Bell, ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';

interface GlassHeaderProps {
  title?: string;
  subtitle?: string;
  unreadCount?: number;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  variant?: 'dark' | 'light';
}

/**
 * Translucent, blurred header for BFP screens — the iOS "large title with
 * blur-on-scroll" look, always-on here for simplicity. Sits over whatever
 * content scrolls beneath it (screens should NOT add their own top padding
 * to account for it beyond the safe area).
 */
export const GlassHeader: React.FC<GlassHeaderProps> = ({
  title = 'FIRESIGHT',
  subtitle,
  unreadCount = 0,
  showBack = false,
  onBack,
  rightElement,
  variant = 'dark',
}) => {
  const { colors, spacing, typography, isDark: systemIsDark } = useTheme();
  const segments = useSegments();
  const currentTab = segments.length > 1 ? segments[1] : 'dashboard';
  const isDark = variant === 'dark';

  const backgroundColor = isDark 
    ? colors.brandNavy 
    : (systemIsDark ? 'rgba(10,15,30,0.4)' : 'rgba(255,255,255,0.55)');
  
  const textColor = isDark ? colors.textInverse : colors.textPrimary;
  
  const borderColor = isDark 
    ? 'rgba(255,255,255,0.08)' 
    : (systemIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,28,63,0.08)');
    
  const bellBg = isDark 
    ? 'rgba(255,255,255,0.08)' 
    : (systemIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,28,63,0.06)');

  const blurTint = systemIsDark ? 'dark' : 'light';

  const innerContent = (
    <SafeAreaView edges={['top']}>
      <View style={[styles.row, { height: 54, paddingHorizontal: spacing.lg }]}>
        {showBack ? (
          <Pressable onPress={() => onBack ? onBack() : router.back()} hitSlop={10} style={styles.backButton}>
            <ArrowLeft size={22} color={textColor} />
          </Pressable>
        ) : null}

        <View style={{ flex: 1 }}>
          {title === 'FIRESIGHT' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={require('../../assets/images/firesight-logo.png')} style={{ width: 34, height: 34, marginRight: 1 }} resizeMode="contain" />
              <Text
                style={{
                  color: textColor,
                  fontSize: 20,
                  fontWeight: '800',
                  letterSpacing: 1,
                }}
              >
                FIRE<Text style={{ color: colors.brandOrange }}>SIGHT</Text>
              </Text>
            </View>
          ) : (
            <Text
              style={{
                color: textColor,
                fontSize: 20,
                fontWeight: '800',
              }}
            >
              {title}
            </Text>
          )}
          
          {subtitle ? (
            <Text style={{ color: isDark ? 'rgba(255,255,255,0.7)' : colors.textMuted, fontSize: typography.size.xs, marginTop: 1 }}>{subtitle}</Text>
          ) : null}
        </View>

        {rightElement ?? (
          <Pressable
            onPress={() => router.push(`/(bfp)/notifications?from=${currentTab}` as any)}
            hitSlop={10}
            style={[
              styles.bellButton,
              { backgroundColor: bellBg },
            ]}
          >
            <Bell size={19} color={textColor} />
            {unreadCount > 0 ? (
              <View style={[styles.badge, { backgroundColor: colors.brandOrange, borderColor: isDark ? colors.brandNavy : '#FFFFFF' }]}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );

  // If we're using the dark navy variant, we drop BlurView entirely to match 
  // AppHeader's solid behavior perfectly, avoiding all Android blur color issues.
  if (isDark) {
    return (
      <View style={{ backgroundColor, borderBottomColor: borderColor, borderBottomWidth: StyleSheet.hairlineWidth }}>
        {innerContent}
      </View>
    );
  }

  return (
    <BlurView intensity={70} tint={blurTint} style={styles.container}>
      <View style={{ backgroundColor, borderBottomColor: borderColor, borderBottomWidth: StyleSheet.hairlineWidth }}>
        {innerContent}
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: { borderBottomWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 8 },
  bellButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
});