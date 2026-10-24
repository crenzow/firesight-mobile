import React, { useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  Image,
  ImageSourcePropType,
  Text,
  StatusBar,
  Dimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

export interface PhotoLightboxModalProps {
  visible: boolean;
  imageSource: ImageSourcePropType | null;
  title?: string;
  subtitle?: string;
  caption?: string;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CANVAS_HEIGHT = SCREEN_HEIGHT * 0.74;

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  visible,
  imageSource,
  title,
  subtitle,
  caption,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  // Gesture transform state
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Reset positioning whenever modal is opened
  useEffect(() => {
    if (visible) {
      scale.value = 1;
      savedScale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }
  }, [visible]);

  // Pinch-to-zoom gesture
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      'worklet';
    })
    .onUpdate((e) => {
      'worklet';
      scale.value = Math.max(0.6, Math.min(5, savedScale.value * e.scale));
    })
    .onEnd(() => {
      'worklet';
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedScale.value = scale.value;
        const maxTranslateX = Math.max(0, (SCREEN_WIDTH * (scale.value - 1)) / 2);
        const maxTranslateY = Math.max(0, (CANVAS_HEIGHT * (scale.value - 1)) / 2);

        if (Math.abs(translateX.value) > maxTranslateX) {
          const clampedX = Math.sign(translateX.value) * maxTranslateX;
          translateX.value = withSpring(clampedX);
          savedTranslateX.value = clampedX;
        }
        if (Math.abs(translateY.value) > maxTranslateY) {
          const clampedY = Math.sign(translateY.value) * maxTranslateY;
          translateY.value = withSpring(clampedY);
          savedTranslateY.value = clampedY;
        }
      }
    });

  // Pan / drag gesture (allows exploring image when zoomed in)
  const panGesture = Gesture.Pan()
    .minDistance(8)
    .onStart(() => {
      'worklet';
    })
    .onUpdate((e) => {
      'worklet';
      if (scale.value <= 1) return;

      const maxTranslateX = Math.max(0, (SCREEN_WIDTH * (scale.value - 1)) / 2);
      const maxTranslateY = Math.max(0, (CANVAS_HEIGHT * (scale.value - 1)) / 2);

      const nextX = savedTranslateX.value + e.translationX;
      const nextY = savedTranslateY.value + e.translationY;

      // Soft bounce resistance outside bounds
      if (Math.abs(nextX) > maxTranslateX) {
        const over = Math.abs(nextX) - maxTranslateX;
        translateX.value = Math.sign(nextX) * (maxTranslateX + over * 0.25);
      } else {
        translateX.value = nextX;
      }

      if (Math.abs(nextY) > maxTranslateY) {
        const over = Math.abs(nextY) - maxTranslateY;
        translateY.value = Math.sign(nextY) * (maxTranslateY + over * 0.25);
      } else {
        translateY.value = nextY;
      }
    })
    .onEnd(() => {
      'worklet';
      if (scale.value <= 1) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        return;
      }

      const maxTranslateX = Math.max(0, (SCREEN_WIDTH * (scale.value - 1)) / 2);
      const maxTranslateY = Math.max(0, (CANVAS_HEIGHT * (scale.value - 1)) / 2);

      const clampedX = Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX.value));
      const clampedY = Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY.value));

      translateX.value = withSpring(clampedX);
      translateY.value = withSpring(clampedY);
      savedTranslateX.value = clampedX;
      savedTranslateY.value = clampedY;
    });

  // Double-tap to quick zoom / reset
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd((e) => {
      'worklet';
      if (scale.value > 1.2) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withSpring(2.5);
        savedScale.value = 2.5;

        const targetX = (SCREEN_WIDTH / 2 - e.x) * 1.5;
        const targetY = (CANVAS_HEIGHT / 2 - e.y) * 1.5;

        const maxTranslateX = (SCREEN_WIDTH * (2.5 - 1)) / 2;
        const maxTranslateY = (CANVAS_HEIGHT * (2.5 - 1)) / 2;

        const clampedX = Math.max(-maxTranslateX, Math.min(maxTranslateX, targetX));
        const clampedY = Math.max(-maxTranslateY, Math.min(maxTranslateY, targetY));

        translateX.value = withSpring(clampedX);
        translateY.value = withSpring(clampedY);
        savedTranslateX.value = clampedX;
        savedTranslateY.value = clampedY;
      }
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture);

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  if (!imageSource) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.95)" />
        <View style={styles.backdrop}>
          {/* Top Header Bar */}
          <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
            <View style={styles.titleWrap}>
              {title ? (
                <Text style={styles.topTitle} numberOfLines={1}>
                  {title}
                </Text>
              ) : null}
              {subtitle ? (
                <Text style={styles.topSubtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [
                styles.closeBtn,
                { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.92 : 1 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close photo viewer"
            >
              <X size={20} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>
          </View>

          {/* Interactive Zoomable / Draggable Canvas */}
          <View style={styles.canvas}>
            <GestureDetector gesture={composedGesture}>
              <Animated.View style={[styles.imageWrapper, animatedImageStyle]}>
                <Image
                  source={imageSource}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              </Animated.View>
            </GestureDetector>
          </View>

          {/* Optional Bottom Caption Bar */}
          {caption && caption.trim().length > 0 && caption.toLowerCase() !== title?.toLowerCase() ? (
            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
              <Text style={styles.captionText}>{caption}</Text>
            </View>
          ) : (
            <View style={{ height: Math.max(insets.bottom, 16) }} />
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 15, 0.97)',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
  },
  titleWrap: {
    flex: 1,
    marginRight: 16,
  },
  topTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  topSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: CANVAS_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  captionText: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
});
