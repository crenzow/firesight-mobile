import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ReportStatus } from '../../services/api/models';

const STATUS_LABEL: Record<ReportStatus, string> = {
  pending: 'Under Review',
  accepted: 'Accepted',
  dispatched: 'Dispatched',
  resolved: 'Resolved',
  invalid: 'Invalid',
};

export const StatusBadge: React.FC<{ status: ReportStatus }> = ({ status }) => {
  const { colors, spacing, radius, typography } = useTheme();

  const color =
    status === 'resolved'
      ? colors.success
      : status === 'accepted'
        ? colors.info
        : status === 'dispatched'
          ? colors.brandOrange
          : status === 'invalid'
            ? colors.textMuted
            : colors.warning; // pending

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: `${color}22`, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
      ]}
    >
      <Text style={[styles.text, { color, fontSize: typography.size.xs }]}>{STATUS_LABEL[status] || status || 'Unknown'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start' },
  text: { fontWeight: '700' },
});