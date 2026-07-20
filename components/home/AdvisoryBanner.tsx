import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

interface AdvisoryBannerProps {
  title: string;
  message: string;
  source: string;
  date: string;
}

export const AdvisoryBanner: React.FC<AdvisoryBannerProps> = ({ title, message, source, date }) => {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: `${colors.brandOrange}14`,
          borderColor: `${colors.brandOrange}40`,
          borderRadius: radius.md,
          padding: spacing.md,
        },
      ]}
    >
      <AlertTriangle size={18} color={colors.brandOrange} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.size.sm }]}>{title}</Text>
        <Text style={[styles.message, { color: colors.textSecondary, fontSize: typography.size.xs, marginTop: 2 }]}>
          {message}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted, fontSize: typography.size.xs, marginTop: spacing.xs }]}>
          {date} · {source}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
  },
  title: { fontWeight: '700' },
  message: { lineHeight: 16 },
  meta: {},
});