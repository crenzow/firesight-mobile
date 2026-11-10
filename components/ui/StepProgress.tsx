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
  const { colors, spacing, typography, isDark } = useTheme();

  const activeLineColor = colors.brandOrange;
  const inactiveLineColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#E5E7EB';

  return (
    <View style={styles.container}>
      {STEPS.map(({ step, label, icon: Icon }, index) => {
        const isComplete = step < currentStep;
        const isActive = step === currentStep;
        const isFirst = index === 0;
        const isLast = index === STEPS.length - 1;

        // Line leading into this step is active if we have reached or passed it
        const isLeftLineActive = currentStep >= step;
        // Line leading out of this step is active if we have advanced past it
        const isRightLineActive = currentStep > step;

        return (
          <View key={step} style={styles.stepColumn}>
            <View style={styles.iconRow}>
              {/* Left connector segment (flush with circle's left edge) */}
              <View
                style={[
                  styles.lineSegment,
                  {
                    backgroundColor: isLeftLineActive ? activeLineColor : inactiveLineColor,
                    opacity: isFirst ? 0 : 1,
                  },
                ]}
              />

              {/* Step Circle with Apple-style subtle depth */}
              <View
                style={[
                  styles.circle,
                  isComplete && {
                    backgroundColor: colors.brandOrange,
                    borderColor: colors.brandOrange,
                  },
                  isActive && {
                    backgroundColor: isDark ? 'rgba(244, 98, 43, 0.15)' : '#FFF5F0',
                    borderColor: colors.brandOrange,
                  },
                  !isComplete && !isActive && {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F9FAFB',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : '#E5E7EB',
                  },
                ]}
              >
                {isComplete ? (
                  <Check size={16} color="#FFFFFF" strokeWidth={2.8} />
                ) : (
                  <Icon
                    size={16}
                    color={isActive ? colors.brandOrange : (isDark ? '#9CA3AF' : '#6B7280')}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                )}
              </View>

              {/* Right connector segment (flush with circle's right edge) */}
              <View
                style={[
                  styles.lineSegment,
                  {
                    backgroundColor: isRightLineActive ? activeLineColor : inactiveLineColor,
                    opacity: isLast ? 0 : 1,
                  },
                ]}
              />
            </View>

            {/* Step Label */}
            <Text
              style={[
                styles.label,
                {
                  color: isActive
                    ? colors.brandOrange
                    : isComplete
                    ? colors.textPrimary
                    : colors.textMuted,
                  fontSize: typography.size.xs,
                  fontWeight: isActive ? '700' : isComplete ? '600' : '500',
                  marginTop: spacing.xs + 2,
                },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  stepColumn: {
    flex: 1,
    alignItems: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  lineSegment: {
    flex: 1,
    height: 2.5,
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
    textAlign: 'center',
  },
});
