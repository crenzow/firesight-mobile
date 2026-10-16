import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export type LearnCategory = 'all' | 'prevention' | 'emergency_response' | 'awareness';

const CATEGORIES: {
  key: LearnCategory;
  label: string;
}[] = [
  { key: 'all', label: 'All' },
  { key: 'prevention', label: 'Prevention' },
  { key: 'emergency_response', label: 'Emergency' },
  { key: 'awareness', label: 'Awareness' },
];

interface CategoryFilterTabsProps {
  active: LearnCategory;
  onChange: (category: LearnCategory) => void;
}

export const CategoryFilterTabs: React.FC<CategoryFilterTabsProps> = ({ active, onChange }) => {
  const { colors, typography } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CATEGORIES.map(({ key, label }) => {
        const isActive = active === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: isActive
                  ? pressed
                    ? colors.brandOrangeDeep
                    : colors.brandOrange
                  : pressed
                  ? colors.brandOrange
                  : colors.surfaceElevated,
                borderColor: isActive || pressed ? 'transparent' : colors.border,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}
          >
            {({ pressed }) => {
              const textColor = isActive || pressed ? '#FFFFFF' : colors.textSecondary;

              return (
                <Text
                  style={[
                    styles.chipLabel,
                    {
                      color: textColor,
                      fontSize: typography.size.xs,
                      fontWeight: isActive ? '800' : '600',
                    },
                  ]}
                >
                  {label}
                </Text>
              );
            }}
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    letterSpacing: 0.2,
  },
});