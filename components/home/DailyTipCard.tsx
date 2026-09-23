import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Lightbulb, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../ui/Card';

interface DailyTipCardProps {
  title: string;
  tip: string;
}

export const DailyTipCard: React.FC<DailyTipCardProps> = ({ title, tip }) => {
  const { colors, spacing, typography, isDark } = useTheme();

  return (
    <Card style={{ marginTop: spacing.xl }} padding={spacing.md}>
      <View style={styles.container}>
        <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.1)' }]}>
          <Lightbulb size={18} color="#3B82F6" />
        </View>

        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <View style={styles.headerRow}>
            <View style={[styles.badgePill, { backgroundColor: isDark ? 'rgba(59,130,246,0.18)' : '#EFF6FF' }]}>
              <Sparkles size={11} color="#3B82F6" />
              <Text style={styles.badgeText}>DAILY SAFETY TIP</Text>
            </View>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.size.sm, marginTop: 6 }]}>
            {title}
          </Text>

          <Text style={[styles.tipText, { color: colors.textSecondary, fontSize: typography.size.xs, marginTop: 4 }]}>
            {tip}
          </Text>
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
    borderColor: 'rgba(59,130,246,0.3)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: 0.5,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  tipText: {
    lineHeight: 18,
    fontWeight: '400',
  },
});
