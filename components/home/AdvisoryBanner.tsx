import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle, ShieldAlert } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../ui/Card';

interface AdvisoryBannerProps {
  title: string;
  message: string;
  source: string;
  date: string;
}

export const AdvisoryBanner: React.FC<AdvisoryBannerProps> = ({ title, message, source, date }) => {
  const { colors, spacing, typography, isDark } = useTheme();

  return (
    <Card padding={spacing.md}>
      <View style={styles.container}>
        <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(249,115,22,0.18)' : 'rgba(249,115,22,0.1)' }]}>
          <AlertTriangle size={18} color="#F97316" />
        </View>

        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <View style={styles.headerRow}>
            <View style={[styles.badgePill, { backgroundColor: isDark ? 'rgba(249,115,22,0.18)' : '#FFF7ED' }]}>
              <ShieldAlert size={11} color="#F97316" />
              <Text style={styles.badgeText}>FIRE SAFETY ADVISORY</Text>
            </View>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.size.sm, marginTop: 6 }]}>
            {title}
          </Text>

          <Text style={[styles.message, { color: colors.textSecondary, fontSize: typography.size.xs, marginTop: 4 }]}>
            {message}
          </Text>

          <View style={[styles.metaRow, { marginTop: spacing.xs }]}>
            <Text style={[styles.meta, { color: colors.textMuted, fontSize: typography.size.xs }]}>
              {date} · {source}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(249,115,22,0.3)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F97316',
    letterSpacing: 0.5,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  message: {
    lineHeight: 18,
    fontWeight: '400',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    fontWeight: '500',
  },
});