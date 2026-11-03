import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const firesightLogo = require('../../assets/images/firesight-logo.png');

export interface CompactBannerData {
  reportId: number;
  title: string;
  message: string;
  location?: string;
}

interface CompactNotificationBannerProps {
  data: CompactBannerData | null;
  onPress: (reportId: number) => void;
  onDismiss: () => void;
}

/**
 * An iOS-styled notification banner matching the layout in the reference photo:
 * - Top row: Transparent eye logo + "FIRESIGHT" on the left, "now" on the far right.
 * - Body: Full-width bold title and readable message snippet.
 * - Multi-directional gestures:
 *   * Slide left / right to dismiss with smooth fading opacity & subtle rotation.
 *   * Swipe up to tuck back into the status bar.
 *   * Release without threshold springs back to center.
 */
export const CompactNotificationBanner: React.FC<CompactNotificationBannerProps> = ({
  data,
  onPress,
  onDismiss,
}) => {
  const translateY = useRef(new Animated.Value(-180)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const opacity = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.75, 0, SCREEN_WIDTH * 0.75],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  const rotate = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-8deg', '0deg', '8deg'],
    extrapolate: 'clamp',
  });

  const dismissToLeft = () => {
    Animated.timing(translateX, {
      toValue: -SCREEN_WIDTH - 60,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const dismissToRight = () => {
    Animated.timing(translateX, {
      toValue: SCREEN_WIDTH + 60,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const dismissUpwards = () => {
    Animated.timing(translateY, {
      toValue: -180,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const snapBackToCenter = () => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        damping: 18,
        stiffness: 220,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 18,
        stiffness: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isHorizontal = Math.abs(gestureState.dx) > 8;
        const isSwipeUp = gestureState.dy < -6;
        return isHorizontal || isSwipeUp;
      },
      onPanResponderMove: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
          // Horizontal dragging dominates
          translateX.setValue(gestureState.dx);
          translateY.setValue(0);
        } else if (gestureState.dy < 0) {
          // Upward dragging
          translateY.setValue(gestureState.dy);
          translateX.setValue(0);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Horizontal fling / drag past threshold (80px or velocity 0.5)
        if (gestureState.dx > 80 || gestureState.vx > 0.5) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          dismissToRight();
        } else if (gestureState.dx < -80 || gestureState.vx < -0.5) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          dismissToLeft();
        } else if (gestureState.dy < -25 || gestureState.vy < -0.5) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          dismissUpwards();
        } else {
          snapBackToCenter();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (data) {
      translateX.setValue(0);
      translateY.setValue(-180);

      Animated.spring(translateY, {
        toValue: 0,
        damping: 18,
        stiffness: 140,
        useNativeDriver: true,
      }).start();

      // Auto dismiss after 12 seconds matching the full emergency dispatch alert duration
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        dismissUpwards();
      }, 12000);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    } else {
      dismissUpwards();
    }
  }, [data]);

  const handlePress = () => {
    if (!data) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    dismissUpwards();
    onPress(data.reportId);
  };

  if (!data) return null;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity,
          transform: [{ translateY }, { translateX }, { rotate }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.card,
            pressed && styles.cardPressed,
          ]}
        >
          {/* Top Row: [Eye Logo] FIRESIGHT ........................ now */}
          <View style={styles.topRow}>
            <View style={styles.appBrandRow}>
              <Image source={firesightLogo} style={styles.eyeIcon} resizeMode="contain" />
              <Text style={styles.appNameText}>FIRESIGHT</Text>
            </View>
            <Text style={styles.timeText}>now</Text>
          </View>

          {/* Full-width Title & Message body */}
          <View style={styles.bodySection}>
            <Text style={styles.titleText} numberOfLines={1}>
              {data.title}
            </Text>
            <Text style={styles.messageText} numberOfLines={2}>
              {data.message}
            </Text>
          </View>
        </Pressable>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999999,
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 18,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  safeArea: {
    paddingTop: Platform.OS === 'android' ? 6 : 0,
  },
  card: {
    backgroundColor: '#FFFFFF', // Clean white background
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  appBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeIcon: {
    width: 20,
    height: 20,
    marginRight: 7,
  },
  appNameText: {
    color: '#475569', // Subtle neutral slate (matching photo style)
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  timeText: {
    color: '#64748B', // Far right "now" timestamp
    fontSize: 12,
    fontWeight: '400',
  },
  bodySection: {
    // Spans full card width
  },
  titleText: {
    color: '#0F172A', // Crisp bold black
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.1,
    marginBottom: 3,
  },
  messageText: {
    color: '#475569', // Readable slate gray
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
});
