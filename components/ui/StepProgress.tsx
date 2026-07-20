import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, User, MapPin, KeyRound } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

interface StepProgressProps {
  currentStep: 1 | 2 | 3;
}

const STEPS = [
  { step: 1, label: 'Personal', icon: User },
  { step: 2, label: 'Address', icon: MapPin },
  { step: 3, label: 'Account', icon: KeyRound },
] as const;

export const StepProgress: React.FC<StepProgressProps> = ({ currentStep }) => {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={styles.row}>
      {STEPS.map(({ step, label, icon: Icon }, index) => {
        const isComplete = step < currentStep;
        const isActive = step === currentStep;
        const circleColor = isComplete || isActive ? colors.brandOrange : colors.border;
        const textColor = isComplete || isActive ? colors.textPrimary : colors.textMuted;

        return (
          <React.Fragment key={step}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.circle,
                  {
                    borderColor: circleColor,
                    backgroundColor: isComplete ? colors.brandOrange : 'transparent',
                  },
                ]}
              >
                {isComplete ? (
                  <Check size={16} color={colors.textInverse} />
                ) : (
                  <Icon size={16} color={isActive ? colors.brandOrange : colors.textMuted} />
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  { color: textColor, fontSize: typography.size.xs, marginTop: spacing.xs },
                ]}
              >
                {label}
              </Text>
            </View>
            {index < STEPS.length - 1 ? (
              <View
                style={[
                  styles.connector,
                  { backgroundColor: step < currentStep ? colors.brandOrange : colors.border },
                ]}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  stepItem: {
    alignItems: 'center',
    width: 72,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
  },
  connector: {
    height: 2,
    flex: 1,
    marginTop: 17,
    marginHorizontal: -8,
  },
});