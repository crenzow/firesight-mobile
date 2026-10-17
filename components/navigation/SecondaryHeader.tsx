import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

interface SecondaryHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export const SecondaryHeader: React.FC<SecondaryHeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightElement,
}) => {
  const { colors, spacing } = useTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView
      style={{
        backgroundColor: colors.brandNavy,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
      }}
      edges={['top']}
    >
      <View style={[styles.row, { height: 62, paddingHorizontal: spacing.lg }]}>
        <View style={styles.leftContainer}>
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
        </View>

        <View style={styles.titleWrap}>
          <Text
            style={[styles.title, { color: colors.textInverse }]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={styles.subtitle}
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.rightContainer}>
          {rightElement ? rightElement : <View style={{ width: 38 }} />}
        </View>
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
  leftContainer: {
    minWidth: 38,
    alignItems: 'flex-start',
  },
  rightContainer: {
    minWidth: 38,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    letterSpacing: 0.2,
    marginTop: 1,
    textAlign: 'center',
  },
});
