import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Info, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

interface EmailSuggestionPillProps {
  suggestion: string | null;
  onApply: (suggestedEmail: string) => void;
}

export const EmailSuggestionPill: React.FC<EmailSuggestionPillProps> = ({
  suggestion,
  onApply,
}) => {
  const { colors, spacing, radius, typography } = useTheme();

  if (!suggestion) return null;

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    onApply(suggestion);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Did you mean ${suggestion}? Tap to fix.`}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed ? 'rgba(244, 98, 43, 0.12)' : 'rgba(244, 98, 43, 0.08)',
          borderColor: 'rgba(244, 98, 43, 0.35)',
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          marginTop: -spacing.sm,
          marginBottom: spacing.md,
        },
      ]}
    >
      <View style={styles.leftRow}>
        <Info size={15} color={colors.brandOrange} style={{ marginRight: spacing.xs }} />
        <Text style={[styles.queryText, { color: colors.textSecondary, fontSize: typography.size.xs }]}>
          Did you mean{' '}
          <Text style={[styles.suggestedEmail, { color: colors.brandOrange }]}>
            {suggestion}
          </Text>
          ?
        </Text>
      </View>

      <View style={[styles.fixPill, { backgroundColor: colors.brandOrange, borderRadius: radius.sm }]}>
        <Text style={styles.fixPillText}>Fix</Text>
        <ArrowRight size={12} color="#FFFFFF" strokeWidth={2.5} style={{ marginLeft: 3 }} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  queryText: {
    flexShrink: 1,
  },
  suggestedEmail: {
    fontWeight: '700',
  },
  fixPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  fixPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
