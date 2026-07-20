import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ReportStatus } from '../../services/api/models';

const STATUS_LABEL: Record<ReportStatus, string> = {
  pending: 'Under Review',
  verified: 'Verified',
  resolved: 'Resolved',
  invalid: 'Invalid',
};

export const StatusBadge: React.FC<{ status: ReportStatus }> = ({ status }) => {
  const { colors, spacing, radius, typography } = useTheme();

  const color =
    status === 'resolved'
      ? colors.success
      : status === 'verified'
        ? colors.info
        : status === 'invalid'
          ? colors.textMuted
          : colors.warning;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: `${color}1A`, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
      ]}
    >
      <Text style={[styles.text, { color, fontSize: typography.size.xs }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start' },
  text: { fontWeight: '700' },
});