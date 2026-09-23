import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Flame, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { CommunityReport } from '../../services/api/models';
import { StatusBadge } from './StatusBadge';
import { formatRelativeDate } from '../../utils/formatters';

interface ReportListItemProps {
  report: CommunityReport;
}

export const ReportListItem: React.FC<ReportListItemProps> = ({ report }) => {
  const { colors, spacing, typography } = useTheme();
  const [locationName, setLocationName] = React.useState<string>(report.barangay_name ?? 'Loading location…');

  React.useEffect(() => {
    let isMounted = true;
    import('../../utils/geocoding').then(({ reverseGeocode }) => {
      reverseGeocode(report.latitude, report.longitude).then((name) => {
        if (isMounted) {
          setLocationName(name !== 'Unknown area' ? name : (report.barangay_name ?? 'Unknown location'));
        }
      });
    });
    return () => {
      isMounted = false;
    };
  }, [report.latitude, report.longitude, report.barangay_name]);

  return (
    <Pressable
      onPress={() => router.push(`/(resident)/reports/${report.report_id}`)}
      style={({ pressed }) => [
        styles.row, 
        { paddingVertical: spacing.md, opacity: pressed ? 0.75 : 1 }
      ]}
    >
      <View style={styles.iconWrap}>
        <LinearGradient
          colors={['#F97316', '#FFB877']} // Premium orange gradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Flame size={18} color="#FFFFFF" />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <View style={styles.topRow}>
          <Text style={[styles.barangay, { color: colors.textPrimary, fontSize: typography.size.sm, flex: 1, marginRight: spacing.xs }]} numberOfLines={1}>
            {locationName}
          </Text>
          <StatusBadge status={report.status} />
        </View>
        <Text
          numberOfLines={1}
          style={[styles.description, { color: colors.textSecondary, fontSize: typography.size.xs, marginTop: 3 }]}
        >
          {report.description || 'No description provided'}
        </Text>
        <Text style={[styles.date, { color: colors.textMuted, fontSize: typography.size.xs, marginTop: 3 }]}>
          {formatRelativeDate(report.created_at)}
        </Text>
      </View>
      <ChevronRight size={16} color={colors.textMuted} style={{ marginLeft: spacing.sm }} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { 
    width: 36, 
    height: 36, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    overflow: 'hidden',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: {},
  barangay: { fontWeight: '700' },
  description: {},
});