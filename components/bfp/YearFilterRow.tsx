import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface YearFilterRowProps {
  years: number[]; // descending, most recent first
  value: number | 'all';
  onChange: (value: number | 'all') => void;
}

export const YearFilterRow: React.FC<YearFilterRowProps> = ({ years, value, onChange }) => {
  const { colors, spacing, radius, typography } = useTheme();

  const options: (number | 'all')[] = ['all', ...years];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {options.map((option) => {
        const isActive = option === value;
        return (
          <Pressable
            key={String(option)}
            onPress={() => onChange(option)}
            style={[
              styles.chip,
              {
                borderRadius: radius.full,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm - 1,
                backgroundColor: isActive ? colors.brandOrange : 'rgba(255,255,255,0.1)',
              },
            ]}
          >
            <Text style={{ color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.75)', fontSize: typography.size.xs, fontWeight: '700' }}>
              {option === 'all' ? 'All Years' : option}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  chip: {},
});