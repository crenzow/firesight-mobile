import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export type AlarmLevel =
  | '1st_alarm'
  | '2nd_alarm'
  | '3rd_alarm'
  | '4th_alarm'
  | '5th_alarm'
  | 'task_force_alpha'
  | 'task_force_bravo'
  | 'task_force_charlie'
  | 'task_force_delta'
  | 'task_force_echo'
  | 'task_force_hotel'
  | 'task_force_india'
  | 'general_alarm';

export const ALARM_LEVEL_LABELS: Record<AlarmLevel, string> = {
  '1st_alarm': '1st Alarm',
  '2nd_alarm': '2nd Alarm',
  '3rd_alarm': '3rd Alarm',
  '4th_alarm': '4th Alarm',
  '5th_alarm': '5th Alarm',
  'task_force_alpha': 'Task Force Alpha',
  'task_force_bravo': 'Task Force Bravo',
  'task_force_charlie': 'Task Force Charlie',
  'task_force_delta': 'Task Force Delta',
  'task_force_echo': 'Task Force Echo',
  'task_force_hotel': 'Task Force Hotel',
  'task_force_india': 'Task Force India',
  'general_alarm': 'General Alarm',
};

export const ALARM_LEVEL_OPTIONS: { id: AlarmLevel; name: string }[] = (
  Object.keys(ALARM_LEVEL_LABELS) as AlarmLevel[]
).map((key) => ({
  id: key,
  name: ALARM_LEVEL_LABELS[key],
}));

export function getAlarmColor(alarm: AlarmLevel | string | null | undefined, colors: any): string {
  if (!alarm) return colors.textMuted;
  switch (alarm) {
    case '1st_alarm':
      return '#3B82F6'; // Blue
    case '2nd_alarm':
      return '#0D9488'; // Teal
    case '3rd_alarm':
      return '#EAB308'; // Amber / Yellow
    case '4th_alarm':
      return '#F97316'; // Orange
    case '5th_alarm':
      return '#EA580C'; // Deep Orange
    case 'task_force_alpha':
    case 'task_force_bravo':
    case 'task_force_charlie':
    case 'task_force_delta':
    case 'task_force_echo':
    case 'task_force_hotel':
    case 'task_force_india':
      return '#DC2626'; // Red / Task Force
    case 'general_alarm':
      return '#991B1B'; // Dark Red / General Alarm
    default:
      return colors.brandOrange;
  }
}

export const AlarmLevelBadge: React.FC<{ alarmLevel: AlarmLevel | string }> = ({ alarmLevel }) => {
  const { colors, spacing, radius, typography } = useTheme();

  const color = getAlarmColor(alarmLevel, colors);
  const label =
    ALARM_LEVEL_LABELS[alarmLevel as AlarmLevel] ||
    String(alarmLevel).replace(/_/g, ' ').toUpperCase();

  return (
    <View
      style={[
        styles.badge,
        {
          borderColor: color,
          backgroundColor: `${color}18`,
          borderRadius: radius.full,
          paddingHorizontal: spacing.sm,
          paddingVertical: 3,
        },
      ]}
    >
      <Text style={{ color, fontSize: typography.size.xs, fontWeight: '800' }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { borderWidth: 1.5, alignSelf: 'flex-start' },
});
