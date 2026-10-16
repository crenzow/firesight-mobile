import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

interface SecondaryHeaderProps {
  title: string;
  onBack?: () => void;
}

export const SecondaryHeader: React.FC<SecondaryHeaderProps> = ({ title, onBack }) => {
  const { colors, spacing, typography } = useTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: colors.brandNavy }} edges={['top']}>
      <View style={[styles.row, { height: 60, paddingHorizontal: spacing.lg }]}>
        <Pressable
          onPress={handleBack}
          hitSlop={8}
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor: pressed ? colors.brandOrange : 'rgba(255, 255, 255, 0.12)',
              borderColor: pressed ? colors.brandOrange : 'rgba(255, 255, 255, 0.2)',
              transform: [{ scale: pressed ? 0.94 : 1 }],
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={20} color={colors.textInverse} strokeWidth={2.5} />
        </Pressable>

        <Text
          style={[styles.title, { color: colors.textInverse, fontSize: 18, flex: 1, textAlign: 'center', marginHorizontal: 8 }]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.3}
        >
          {title}
        </Text>

        {/* Balancer to keep title centered */}
        <View style={{ width: 38 }} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
