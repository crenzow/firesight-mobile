import React from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Shared uppercase section header used on the resident dashboard.
 * - Muted, tracked uppercase title on the left.
 * - Optional orange action link ("See all") on the right.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, actionLabel, onAction, style }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, style]}>
      <Text style={[styles.title, { color: colors.textMuted }]}>{title}</Text>

      {actionLabel && onAction && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            onAction();
          }}
          style={({ pressed }) => [
            styles.action,
            {
              backgroundColor: pressed ? colors.brandOrange : 'transparent',
              paddingHorizontal: pressed ? 8 : 4,
              transform: [{ scale: pressed ? 0.94 : 1 }],
            },
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel} ${title.toLowerCase()}`}
        >
          {({ pressed }) => (
            <>
              <Text style={[styles.actionText, { color: pressed ? '#FFFFFF' : colors.brandOrange }]}>
                {actionLabel}
              </Text>
              <ChevronRight size={13} color={pressed ? '#FFFFFF' : colors.brandOrange} strokeWidth={2.5} />
            </>
          )}
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 2,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
