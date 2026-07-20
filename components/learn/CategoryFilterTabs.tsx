import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export type LearnCategory = 'all' | 'prevention' | 'emergency_response' | 'awareness';

const CATEGORIES: { key: LearnCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'prevention', label: 'Prevention' },
  { key: 'emergency_response', label: 'Emergency Response' },
  { key: 'awareness', label: 'Awareness' },
];

interface CategoryFilterTabsProps {
  active: LearnCategory;
  onChange: (category: LearnCategory) => void;
}

export const CategoryFilterTabs: React.FC<CategoryFilterTabsProps> = ({ active, onChange }) => {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {CATEGORIES.map(({ key, label }) => {
        const isActive = active === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={[
              styles.chip,
              {
                backgroundColor: isActive ? colors.brandOrange : colors.surfaceElevated,
                borderRadius: radius.full,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              },
            ]}
          >
            <Text
              style={{
                color: isActive ? '#FFFFFF' : colors.textSecondary,
                fontSize: typography.size.xs,
                fontWeight: '700',
              }}
            >
              {label}
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