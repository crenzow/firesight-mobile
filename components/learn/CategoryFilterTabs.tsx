import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet, View, Platform } from 'react-native';
import { Bookmark } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

export type LearnCategory = 'all' | 'prevention' | 'emergency_response' | 'awareness' | 'saved';

interface CategoryFilterTabsProps {
  active: LearnCategory;
  onChange: (category: LearnCategory) => void;
  savedCount?: number;
}

export const CategoryFilterTabs: React.FC<CategoryFilterTabsProps> = ({
  active,
  onChange,
  savedCount = 0,
}) => {
  const { colors, typography } = useTheme();

  const categories: { key: LearnCategory; label: string; isSaved?: boolean }[] = [
    { key: 'all', label: 'All' },
    { key: 'prevention', label: 'Prevention' },
    { key: 'emergency_response', label: 'Emergency' },
    { key: 'awareness', label: 'Awareness' },
    { key: 'saved', label: 'Saved', isSaved: true },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map(({ key, label, isSaved }) => {
        const isActive = active === key;
        return (
          <Pressable
            key={key}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onChange(key);
            }}
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
                <View style={styles.chipContent}>
                  {isSaved && (
                    <Bookmark
                      size={12}
                      color={textColor}
                      fill={isActive ? textColor : 'none'}
                    />
                  )}
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
                  {isSaved && savedCount > 0 && (
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color: textColor,
                          },
                        ]}
                      >
                        {savedCount}
                      </Text>
                    </View>
                  )}
                </View>
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
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  chipLabel: {
    letterSpacing: 0.2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});