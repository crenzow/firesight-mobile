import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Mask, Rect, Line } from 'react-native-svg';
import { Check, X } from 'lucide-react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useTheme } from '../../theme/ThemeContext';

interface PhotoCropModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
  onCropComplete: (croppedUri: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CROP_SIZE = Math.min(SCREEN_WIDTH - 48, 290);
const CROP_RADIUS = 44; // FireSight signature squircle curvature
const MIN_ZOOM = 1.0;
const MAX_ZOOM = 3.5;

export const PhotoCropModal: React.FC<PhotoCropModalProps> = ({
  visible,
  imageUri,
  onClose,
  onCropComplete,
}) => {
  const { colors } = useTheme();

  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [stageLayout, setStageLayout] = useState<{ width: number; height: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Native UI thread shared values for 60fps pan & pinch
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const prevTranslationX = useSharedValue(0);
  const prevTranslationY = useSharedValue(0);

  const scale = useSharedValue(1.0);
  const savedScale = useSharedValue(1.0);

  // Compute base scaling so image always covers CROP_SIZE
  const baseScale = imageSize
    ? Math.max(CROP_SIZE / imageSize.width, CROP_SIZE / imageSize.height)
    : 1;

  const baseWidth = imageSize ? imageSize.width * baseScale : CROP_SIZE;
  const baseHeight = imageSize ? imageSize.height * baseScale : CROP_SIZE;

  useEffect(() => {
    if (visible && imageUri) {
      translationX.value = 0;
      translationY.value = 0;
      prevTranslationX.value = 0;
      prevTranslationY.value = 0;
      scale.value = 1.0;
      savedScale.value = 1.0;
      Image.getSize(
        imageUri,
        (w, h) => {
          setImageSize({ width: w, height: h });
        },
        () => {
          Alert.alert('Error', 'Unable to load photo for adjustment.');
          onClose();
        }
      );
    }
  }, [visible, imageUri, onClose, scale, savedScale, translationX, translationY, prevTranslationX, prevTranslationY]);

  // Industry Standard Gesture: Pinch
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      'worklet';
      const nextScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, savedScale.value * e.scale));
      scale.value = nextScale;

      // Keep pan bounded inside the new zoom level
      const rW = baseWidth * nextScale;
      const rH = baseHeight * nextScale;
      const maxX = Math.max(0, (rW - CROP_SIZE) / 2);
      const maxY = Math.max(0, (rH - CROP_SIZE) / 2);

      translationX.value = Math.max(-maxX, Math.min(maxX, translationX.value));
      translationY.value = Math.max(-maxY, Math.min(maxY, translationY.value));
    })
    .onEnd(() => {
      'worklet';
      savedScale.value = scale.value;
      prevTranslationX.value = translationX.value;
      prevTranslationY.value = translationY.value;
    });

  // Industry Standard Gesture: Pan
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      'worklet';
      const currentScale = scale.value;
      const rW = baseWidth * currentScale;
      const rH = baseHeight * currentScale;
      const maxX = Math.max(0, (rW - CROP_SIZE) / 2);
      const maxY = Math.max(0, (rH - CROP_SIZE) / 2);

      const targetX = prevTranslationX.value + e.translationX;
      const targetY = prevTranslationY.value + e.translationY;

      translationX.value = Math.max(-maxX, Math.min(maxX, targetX));
      translationY.value = Math.max(-maxY, Math.min(maxY, targetY));
    })
    .onEnd(() => {
      'worklet';
      prevTranslationX.value = translationX.value;
      prevTranslationY.value = translationY.value;
    });

  // Combine both gestures simultaneously
  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  // Animated transform style on native thread
  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translationX.value },
        { translateY: translationY.value },
        { scale: scale.value },
      ],
    };
  });

  const onStageLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setStageLayout({ width, height });
  };

  // Perform accurate crop using expo-image-manipulator
  const handleApply = async () => {
    if (!imageUri || !imageSize || isProcessing) return;
    setIsProcessing(true);
    try {
      const currentScale = baseScale * scale.value;
      const cropOrigSize = CROP_SIZE / currentScale;

      const centerOrigX = imageSize.width / 2 - translationX.value / currentScale;
      const centerOrigY = imageSize.height / 2 - translationY.value / currentScale;

      let originX = Math.round(centerOrigX - cropOrigSize / 2);
      let originY = Math.round(centerOrigY - cropOrigSize / 2);

      originX = Math.max(0, Math.min(imageSize.width - Math.round(cropOrigSize), originX));
      originY = Math.max(0, Math.min(imageSize.height - Math.round(cropOrigSize), originY));

      const cropWidth = Math.min(imageSize.width - originX, Math.round(cropOrigSize));
      const cropHeight = Math.min(imageSize.height - originY, Math.round(cropOrigSize));

      const result = await manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX,
              originY,
              width: cropWidth,
              height: cropHeight,
            },
          },
          {
            resize: {
              width: 512,
              height: 512,
            },
          },
        ],
        {
          compress: 0.9,
          format: SaveFormat.JPEG,
        }
      );

      onCropComplete(result.uri);
      onClose();
    } catch {
      Alert.alert('Crop Failed', 'Could not apply crop. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!visible || !imageUri) return null;

  const cropLeft = stageLayout ? (stageLayout.width - CROP_SIZE) / 2 : 0;
  const cropTop = stageLayout ? (stageLayout.height - CROP_SIZE) / 2 : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#070D1E' }}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          {/* Top Header */}
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={12} style={styles.headerBtn}>
              <X size={22} color="#FFFFFF" />
            </Pressable>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.headerTitle}>Adjust Profile Photo</Text>
            </View>
            <Pressable
              onPress={handleApply}
              disabled={isProcessing}
              style={[styles.applyBtn, { backgroundColor: colors.brandOrange }]}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.applyBtnText}>Done</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Native Gesture Detector Stage */}
          <GestureDetector gesture={composedGesture}>
            <Animated.View style={styles.stage} onLayout={onStageLayout}>
              {/* Full Image in Background with Native Transform */}
              {stageLayout && imageSize ? (
                <Animated.View
                  style={[
                    styles.imageContainer,
                    {
                      left: (stageLayout.width - baseWidth) / 2,
                      top: (stageLayout.height - baseHeight) / 2,
                      width: baseWidth,
                      height: baseHeight,
                    },
                    animatedImageStyle,
                  ]}
                  pointerEvents="none"
                >
                  <Image
                    source={{ uri: imageUri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                </Animated.View>
              ) : (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={colors.brandOrange} />
                </View>
              )}

              {/* SVG Dimmed Mask with Squircle Cutout (Like Facebook) */}
              {stageLayout ? (
                <Svg style={StyleSheet.absoluteFillObject} pointerEvents="none">
                  <Defs>
                    <Mask id="avatarCutoutMask">
                      {/* White base allows dark overlay to show */}
                      <Rect x="0" y="0" width="100%" height="100%" fill="#FFFFFF" />
                      {/* Black cutout creates transparent hole for profile squircle */}
                      <Rect
                        x={cropLeft}
                        y={cropTop}
                        width={CROP_SIZE}
                        height={CROP_SIZE}
                        rx={CROP_RADIUS}
                        ry={CROP_RADIUS}
                        fill="#000000"
                      />
                    </Mask>
                  </Defs>

                  {/* Semi-transparent dark overlay over everything outside cutout */}
                  <Rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="rgba(7, 13, 30, 0.75)"
                    mask="url(#avatarCutoutMask)"
                  />

                  {/* Crisp Squircle Avatar Border Outline */}
                  <Rect
                    x={cropLeft}
                    y={cropTop}
                    width={CROP_SIZE}
                    height={CROP_SIZE}
                    rx={CROP_RADIUS}
                    ry={CROP_RADIUS}
                    stroke={colors.brandOrange}
                    strokeWidth={2.5}
                    fill="none"
                  />

                  {/* Subtle Rule-of-Thirds Grid inside the cutout */}
                  <Line
                    x1={cropLeft + CROP_SIZE / 3}
                    y1={cropTop}
                    x2={cropLeft + CROP_SIZE / 3}
                    y2={cropTop + CROP_SIZE}
                    stroke="rgba(255, 255, 255, 0.25)"
                    strokeWidth={1}
                    strokeDasharray="4, 4"
                  />
                  <Line
                    x1={cropLeft + (CROP_SIZE * 2) / 3}
                    y1={cropTop}
                    x2={cropLeft + (CROP_SIZE * 2) / 3}
                    y2={cropTop + CROP_SIZE}
                    stroke="rgba(255, 255, 255, 0.25)"
                    strokeWidth={1}
                    strokeDasharray="4, 4"
                  />
                  <Line
                    x1={cropLeft}
                    y1={cropTop + CROP_SIZE / 3}
                    x2={cropLeft + CROP_SIZE}
                    y2={cropTop + CROP_SIZE / 3}
                    stroke="rgba(255, 255, 255, 0.25)"
                    strokeWidth={1}
                    strokeDasharray="4, 4"
                  />
                  <Line
                    x1={cropLeft}
                    y1={cropTop + (CROP_SIZE * 2) / 3}
                    x2={cropLeft + CROP_SIZE}
                    y2={cropTop + (CROP_SIZE * 2) / 3}
                    stroke="rgba(255, 255, 255, 0.25)"
                    strokeWidth={1}
                    strokeDasharray="4, 4"
                  />
                </Svg>
              ) : null}
            </Animated.View>
          </GestureDetector>

          {/* Minimal Bottom Guide */}
          <View style={styles.footer}>
            <Text style={styles.hintText}>Drag to reposition · Pinch to zoom</Text>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070D1E',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  applyBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stage: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'absolute',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
});
