import React from 'react';
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
import { X, ZoomIn } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PhotoLightboxModalProps {
  visible: boolean;
  imageSource: ImageSourcePropType | null;
  title?: string;
  caption?: string;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  visible,
  imageSource,
  title,
  caption,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  if (!imageSource) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.95)" />
      <View style={styles.backdrop}>
        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
          <View style={styles.titleWrap}>
            {title ? (
              <Text style={styles.topTitle} numberOfLines={1}>
                {title}
              </Text>
            ) : null}
            <Text style={styles.hintText}>Pinch or double-tap to inspect</Text>
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
            <X size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Center image canvas */}
        <Pressable style={styles.canvas} onPress={onClose}>
          <Image
            source={imageSource}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </Pressable>

        {/* Bottom caption bar */}
        {caption ? (
          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
            <Text style={styles.captionText}>{caption}</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 15, 0.96)',
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
  hintText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.72,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  captionText: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
});
