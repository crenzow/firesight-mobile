import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  PanResponder,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';

export const TEXT_SIZE_STEPS = [
  { label: 'Small', scale: 0 },
  { label: 'Default', scale: 1 },
  { label: 'Large', scale: 2 },
  { label: 'Max', scale: 3 },
] as const;

export type TextSizeStep = 0 | 1 | 2 | 3;

interface TextSizeModalProps {
  visible: boolean;
  step: TextSizeStep;
  onChange: (step: TextSizeStep) => void;
  onClose: () => void;
}

export const TextSizeModal: React.FC<TextSizeModalProps> = ({
  visible,
  step,
  onChange,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const trackRef = useRef<View>(null);
  const trackBoundsRef = useRef({ pageX: 0, width: 0 });
  const currentStepRef = useRef<TextSizeStep>(step);
  currentStepRef.current = step;

  const measureTrack = () => {
    trackRef.current?.measure((_x, _y, width, _height, pageX, _pageY) => {
      if (width > 0) {
        trackBoundsRef.current = { pageX, width };
      }
    });
  };

  const updateFromScreenX = (screenX: number) => {
    const { pageX, width } = trackBoundsRef.current;
    if (width > 0) {
      const relativeX = screenX - pageX;
      const progress = Math.max(0, Math.min(1, relativeX / width));
      const newStep = Math.round(progress * 3) as TextSizeStep;
      if (newStep !== currentStepRef.current) {
        onChange(newStep);
      }
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        const x = gestureState.x0 || evt.nativeEvent.pageX;
        updateFromScreenX(x);
      },
      onPanResponderMove: (evt, gestureState) => {
        const x = gestureState.moveX || evt.nativeEvent.pageX;
        updateFromScreenX(x);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const x = gestureState.moveX || evt.nativeEvent.pageX;
        updateFromScreenX(x);
      },
    })
  ).current;

  const thumbPercent = (step / 3) * 100;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop tap to dismiss */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Bottom Sheet Card */}
        <View
          style={[
            styles.sheetCard,
            {
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
              paddingBottom: Math.max(insets.bottom, 16) + 14,
            },
          ]}
        >
          {/* Header Row */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                Text Size
              </Text>
              <Text style={[styles.sheetSubtitle, { color: colors.textMuted }]}>
                Slide or tap a size to adjust article text
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [
                styles.closeButton,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close text size settings"
            >
              <X size={18} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* Stepped Horizontal Slider */}
          <View style={styles.sliderContainer}>
            {/* Small A Indicator */}
            <Text style={[styles.iconA, { fontSize: 13, color: colors.textSecondary }]}>
              A
            </Text>

            {/* Touch Track Container */}
            <View
              ref={trackRef}
              style={styles.trackWrapper}
              onLayout={measureTrack}
              {...panResponder.panHandlers}
            >
              {/* Background Inactive Track */}
              <View
                pointerEvents="none"
                style={[
                  styles.trackBar,
                  { backgroundColor: isDark ? '#374151' : '#E2E8F0' },
                ]}
              />

              {/* Active Orange Progress Fill */}
              <View
                pointerEvents="none"
                style={[
                  styles.activeTrackFill,
                  {
                    width: `${thumbPercent}%`,
                    backgroundColor: colors.brandOrange,
                  },
                ]}
              />

              {/* 4 Step Notches */}
              {TEXT_SIZE_STEPS.map((s, idx) => {
                const posPercent = (idx / 3) * 100;
                const isPassed = step >= idx;

                return (
                  <View
                    key={s.label}
                    pointerEvents="none"
                    style={[
                      styles.notch,
                      {
                        left: `${posPercent}%`,
                        backgroundColor: isPassed
                          ? colors.brandOrange
                          : isDark
                          ? '#4B5563'
                          : '#CBD5E1',
                      },
                    ]}
                  />
                );
              })}

              {/* Slider Thumb */}
              <View
                pointerEvents="none"
                style={[
                  styles.thumb,
                  {
                    left: `${thumbPercent}%`,
                    borderColor: colors.brandOrange,
                    backgroundColor: '#FFFFFF',
                  },
                ]}
              />
            </View>

            {/* Large A Indicator */}
            <Text style={[styles.iconA, { fontSize: 22, color: colors.textPrimary }]}>
              A
            </Text>
          </View>

          {/* Direct Size Selector Pills */}
          <View style={styles.labelsRow}>
            {TEXT_SIZE_STEPS.map((s, idx) => {
              const isSelected = step === idx;
              return (
                <Pressable
                  key={s.label}
                  onPress={() => onChange(idx as TextSizeStep)}
                  style={({ pressed }) => [
                    styles.stepLabelBtn,
                    isSelected && {
                      backgroundColor: isDark ? 'rgba(249, 115, 22, 0.15)' : '#FFF0E5',
                      borderColor: colors.brandOrange,
                    },
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text
                    style={[
                      styles.stepLabelText,
                      {
                        color: isSelected ? colors.brandOrange : colors.textMuted,
                        fontWeight: isSelected ? '800' : '600',
                      },
                    ]}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
    
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 12.5,
    marginTop: 2,
    fontWeight: '500',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  iconA: {
    fontWeight: '800',
    minWidth: 20,
    textAlign: 'center',
  },
  trackWrapper: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBar: {
    height: 4,
    borderRadius: 2,
    width: '100%',
  },
  activeTrackFill: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
  },
  notch: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
  },
  thumb: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3.5,
    marginLeft: -13,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 8,
  },
  stepLabelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  stepLabelText: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
