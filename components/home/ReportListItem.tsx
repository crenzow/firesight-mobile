import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Flame } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { CommunityReport } from '../../services/api/models';
import { StatusBadge } from './StatusBadge';
import { formatRelativeDate } from '../../utils/formatters';

interface ReportListItemProps {
  report: CommunityReport;
}

export const ReportListItem: React.FC<ReportListItemProps> = ({ report }) => {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <Pressable
      onPress={() => router.push(`/(resident)/reports/${report.report_id}`)}
      style={[styles.row, { paddingVertical: spacing.sm }]}
    >
      <View style={[styles.iconCircle, { backgroundColor: `${colors.brandOrange}14` }]}>
        <Flame size={16} color={colors.brandOrange} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <View style={styles.topRow}>
          <StatusBadge status={report.status} />
          <Text style={[styles.date, { color: colors.textMuted, fontSize: typography.size.xs }]}>
            {formatRelativeDate(report.created_at)}
          </Text>
        </View>
        <Text style={[styles.barangay, { color: colors.textPrimary, fontSize: typography.size.sm, marginTop: 2 }]}>
          {report.barangay_name ?? 'Brgy. Poblacion'}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.description, { color: colors.textSecondary, fontSize: typography.size.xs }]}
        >
          {report.description}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: {},
  barangay: { fontWeight: '700' },
  description: {},
});