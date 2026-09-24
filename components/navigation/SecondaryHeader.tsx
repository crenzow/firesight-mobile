import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
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
      <View style={[styles.row, { height: 64, paddingHorizontal: spacing.lg }]}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <ArrowLeft size={22} color={colors.textInverse} />
        </Pressable>
        <Text style={[styles.title, { color: colors.textInverse, fontSize: 20 }]}>
          {title}
        </Text>
        <View style={{ width: 22 }} />
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
  title: {
    fontWeight: '800',
  },
});
