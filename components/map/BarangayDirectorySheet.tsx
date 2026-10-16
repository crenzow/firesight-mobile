import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  FlatList,
  useWindowDimensions,
  Keyboard,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Search, X, MapPin, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { BarangayRiskFeature } from '../../services/api/models';

interface BarangayDirectorySheetProps {
  visible: boolean;
  onClose: () => void;
  barangays: BarangayRiskFeature[];
  userBarangayFeature?: BarangayRiskFeature | null;
  onSelectBarangay: (barangay: BarangayRiskFeature) => void;
  selectedBarangayName?: string | null;
}

const SPRING_CONFIG = {
  damping: 22,
  stiffness: 240,
  mass: 0.85,
};

export const BarangayDirectorySheet: React.FC<BarangayDirectorySheetProps> = ({
  visible,
  onClose,
  barangays,
  userBarangayFeature,
  onSelectBarangay,
  selectedBarangayName,
}) => {
  const { colors, isDark } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState('');

  // Sheet geometry:
  // Full sheet height is 88% of screen height.
  // translateY = 0 -> Full open (88% visible)
  // translateY = SNAP_HALF -> Half open (~56% visible)
  // translateY = sheetHeight -> Closed (0% visible)
  const sheetHeight = Math.round(windowHeight * 0.88);
  const snapFull = 0;
  const snapHalf = Math.round(windowHeight * 0.32);

  const translateY = useSharedValue(sheetHeight);
  const dragStartY = useSharedValue(snapHalf);

  const triggerSnapHaptic = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
  }, []);

  const handleDismiss = useCallback(() => {
    Keyboard.dismiss();
    Haptics.selectionAsync().catch(() => {});
    onClose();
  }, [onClose]);

  const animateClose = useCallback(() => {
    Keyboard.dismiss();
    translateY.value = withTiming(sheetHeight, { duration: 210 }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  }, [onClose, sheetHeight, translateY]);

  useEffect(() => {
    if (visible) {
      translateY.value = sheetHeight;
      translateY.value = withSpring(snapHalf, SPRING_CONFIG);
    } else {
      setSearchQuery('');
    }
  }, [visible, sheetHeight, snapHalf, translateY]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(() => {
          dragStartY.value = translateY.value;
        })
        .onUpdate((event) => {
          const nextY = dragStartY.value + event.translationY;
          // Allow slight upward rubber-banding above snapFull (-18px)
          translateY.value = Math.max(-18, nextY);
        })
        .onEnd((event) => {
          const currentY = translateY.value;
          const velocityY = event.velocityY;

          // Fast downward flick or dragged well below half-open -> dismiss
          if (
            (velocityY > 850 && currentY > snapHalf * 0.6) ||
            currentY > snapHalf + (sheetHeight - snapHalf) * 0.42
          ) {
            translateY.value = withTiming(sheetHeight, { duration: 200 }, (finished) => {
              if (finished) {
                runOnJS(handleDismiss)();
              }
            });
            return;
          }

          // Fast upward flick -> snap to full
          if (velocityY < -550) {
            translateY.value = withSpring(snapFull, SPRING_CONFIG);
            runOnJS(triggerSnapHaptic)();
            return;
          }

          // Fast downward flick from full -> snap to half
          if (velocityY > 550 && currentY <= snapHalf) {
            translateY.value = withSpring(snapHalf, SPRING_CONFIG);
            runOnJS(triggerSnapHaptic)();
            return;
          }

          // Otherwise snap to nearest snap point (Full vs Half)
          const midpoint = snapHalf * 0.5;
          const targetSnap = currentY < midpoint ? snapFull : snapHalf;
          translateY.value = withSpring(targetSnap, SPRING_CONFIG);
          runOnJS(triggerSnapHaptic)();
        }),
    [dragStartY, handleDismiss, sheetHeight, snapFull, snapHalf, translateY, triggerSnapHaptic]
  );

  const toggleSnapPoint = () => {
    Haptics.selectionAsync().catch(() => {});
    const isNearFull = translateY.value < snapHalf * 0.5;
    translateY.value = withSpring(isNearFull ? snapHalf : snapFull, SPRING_CONFIG);
  };

  const expandToFull = () => {
    if (translateY.value > snapFull + 10) {
      translateY.value = withSpring(snapFull, SPRING_CONFIG);
    }
  };

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.max(0, translateY.value) }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [snapFull, snapHalf, sheetHeight],
      [1, 0.75, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const filteredBarangays = useMemo(() => {
    const list = [...barangays].sort((a, b) => a.barangay_name.localeCompare(b.barangay_name));
    if (!searchQuery.trim()) return list;
    return list.filter((b) =>
      b.barangay_name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [barangays, searchQuery]);

  const riskCounts = useMemo(() => {
    let high = 0;
    let moderate = 0;
    let mild = 0;
    barangays.forEach((b) => {
      if (b.risk_level === 'high') high++;
      else if (b.risk_level === 'moderate') moderate++;
      else mild++;
    });
    return { high, moderate, mild, total: barangays.length };
  }, [barangays]);

  const userBarangayRiskColor =
    userBarangayFeature?.risk_level === 'high'
      ? colors.riskHigh
      : userBarangayFeature?.risk_level === 'moderate'
      ? colors.riskModerate
      : colors.riskMild;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={animateClose}
    >
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.container}>
          {/* Animated Dimmed Backdrop */}
          <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={animateClose} />
          </Animated.View>

          {/* Snap-Enabled Bottom Sheet */}
          <Animated.View
            style={[
              styles.sheetContainer,
              {
                height: sheetHeight,
                backgroundColor: isDark ? '#141A2E' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
              },
              sheetAnimatedStyle,
            ]}
          >
            {/* Draggable Header Zone (Grab Handle + Title Row) */}
            <GestureDetector gesture={panGesture}>
              <Animated.View style={styles.dragZone}>
                {/* Apple-style Grab Handle */}
                <Pressable onPress={toggleSnapPoint} style={styles.handleContainer}>
                  <View
                    style={[
                      styles.handleBar,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.24)' : 'rgba(0,0,0,0.2)' },
                    ]}
                  />
                </Pressable>

                {/* Header Row */}
                <View style={styles.headerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                      Lian Barangays
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                      {riskCounts.total} Areas · {riskCounts.high} High · {riskCounts.moderate} Moderate · {riskCounts.mild} Mild
                    </Text>
                  </View>

                  <Pressable
                    onPress={animateClose}
                    hitSlop={8}
                    style={[
                      styles.closeCircle,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' },
                    ]}
                  >
                    <X size={18} color={colors.textSecondary} />
                  </Pressable>
                </View>
              </Animated.View>
            </GestureDetector>

            {/* iOS Style Search Input */}
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F1F5F9',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              <Search size={16} color={colors.textMuted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={expandToFull}
                placeholder="Search barangay..."
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.textPrimary }]}
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                  <X size={14} color={colors.textMuted} />
                </Pressable>
              )}
            </View>

            {/* Barangays List */}
            <FlatList
              data={filteredBarangays}
              keyExtractor={(item) => String(item.barangay_id)}
              contentContainerStyle={{ paddingBottom: 42 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                !searchQuery.trim() ? (
                  <View style={styles.pinnedSection}>
                    {userBarangayFeature ? (
                      <>
                        <Text style={[styles.sectionHeaderTitle, { color: colors.textMuted }]}>
                          YOUR BARANGAY
                        </Text>
                    <Pressable
                      onPress={() => {
                        onSelectBarangay(userBarangayFeature);
                        animateClose();
                      }}
                      style={({ pressed }) => [
                        styles.pinnedCard,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC',
                          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                          transform: [{ scale: pressed ? 0.985 : 1 }],
                        },
                      ]}
                    >
                      <View style={[styles.itemIcon, { backgroundColor: `${userBarangayRiskColor}16` }]}>
                        <MapPin size={16} color={userBarangayRiskColor} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.itemTitle, { color: colors.textPrimary, fontWeight: '700' }]}>
                          {userBarangayFeature.barangay_name}
                        </Text>
                        <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                          Registered Resident Area
                        </Text>
                      </View>
                      <View style={[styles.pillBadge, { backgroundColor: `${userBarangayRiskColor}18` }]}>
                        <View style={[styles.badgeDot, { backgroundColor: userBarangayRiskColor }]} />
                        <Text style={[styles.pillBadgeText, { color: userBarangayRiskColor }]}>
                          {userBarangayFeature.risk_level === 'high'
                            ? 'High'
                            : userBarangayFeature.risk_level === 'moderate'
                            ? 'Moderate'
                            : 'Mild'}
                        </Text>
                      </View>
                      <ChevronRight size={16} color={colors.textMuted} style={{ marginLeft: 8 }} />
                    </Pressable>
                    <View style={[styles.sectionDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }]} />
                      </>
                    ) : null}
                    <Text style={[styles.sectionHeaderTitle, { color: colors.textMuted, marginTop: userBarangayFeature ? 10 : 2 }]}>
                      ALL LIAN BARANGAYS ({filteredBarangays.length})
                    </Text>
                  </View>
                ) : null
              }
              renderItem={({ item }) => {
                const isSelected = item.barangay_name === selectedBarangayName;
                const riskColor =
                  item.risk_level === 'high'
                    ? colors.riskHigh
                    : item.risk_level === 'moderate'
                    ? colors.riskModerate
                    : colors.riskMild;

                const riskText =
                  item.risk_level === 'high'
                    ? 'High'
                    : item.risk_level === 'moderate'
                    ? 'Moderate'
                    : 'Mild';

                return (
                  <Pressable
                    onPress={() => {
                      onSelectBarangay(item);
                      animateClose();
                    }}
                    style={({ pressed }) => [
                      styles.listItem,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(244, 98, 43, 0.16)'
                            : 'rgba(244, 98, 43, 0.08)'
                          : pressed
                          ? isDark
                            ? 'rgba(255,255,255,0.05)'
                            : '#F8FAFC'
                          : 'transparent',
                        borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                      },
                    ]}
                  >
                    <View style={[styles.itemIcon, { backgroundColor: `${riskColor}16` }]}>
                      <MapPin size={16} color={riskColor} />
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={[
                          styles.itemTitle,
                          {
                            color: isSelected ? colors.brandOrange : colors.textPrimary,
                            fontWeight: isSelected ? '700' : '600',
                          },
                        ]}
                      >
                        {item.barangay_name}
                      </Text>
                    </View>

                    <View style={[styles.pillBadge, { backgroundColor: `${riskColor}18` }]}>
                      <View style={[styles.badgeDot, { backgroundColor: riskColor }]} />
                      <Text style={[styles.pillBadgeText, { color: riskColor }]}>{riskText}</Text>
                    </View>

                    <ChevronRight size={16} color={colors.textMuted} style={{ marginLeft: 8 }} />
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    No barangay matching "{searchQuery}"
                  </Text>
                </View>
              }
            />
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  dragZone: {
    paddingBottom: 2,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handleBar: {
    width: 38,
    height: 4.5,
    borderRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  itemIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 15,
  },
  itemSubtitle: {
    fontSize: 11.5,
    marginTop: 1,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
  pinnedSection: {
    paddingBottom: 6,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  pinnedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  sectionDivider: {
    height: 1,
    marginVertical: 10,
  },
});
