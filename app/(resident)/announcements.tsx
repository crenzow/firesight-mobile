import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Share, BackHandler, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Megaphone, Share2 } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { SecondaryHeader } from '../../components/navigation/SecondaryHeader';
import { announcementService } from '../../services/api';
import { Announcement } from '../../services/api/models';
import { formatRelativeDate } from '../../utils/formatters';
import { Skeleton } from '../../components/ui/Skeleton';

export default function AnnouncementsScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { colors, spacing, typography, shadow, isDark } = useTheme();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleBack = useCallback(() => {
    if (from && (from.includes('notification') || from === '/(resident)/notifications')) {
      router.replace('/(resident)/notifications');
    } else {
      router.replace('/(resident)/home');
    }
  }, [from]);

  const load = useCallback(async () => {
    try {
      setAnnouncements(await announcementService.list());
    } catch {
      // Non-fatal — resident can pull to refresh.
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();

      // Poll every 15s while user views announcements
      const timer = setInterval(() => {
        load();
      }, 15000);

      const onBackPress = () => {
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        clearInterval(timer);
        subscription.remove();
      };
    }, [load, handleBack])
  );

  const handleShare = async (item: Announcement) => {
    try {
      await Share.share({
        title: item.title,
        message: `${item.title}\n\n${item.content}\n\n— Bureau of Fire Protection (BFP) Lian Fire Station`,
      });
    } catch {
      // Ignore dismiss
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SecondaryHeader title="Announcements" onBack={handleBack} />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        {isLoading ? (
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
            {[0, 1].map((key) => (
              <View
                key={key}
                style={[
                  styles.editorialCard,
                  {
                    backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  },
                  !isDark && shadow.card,
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Skeleton width={110} height={12} borderRadius={4} />
                    <Skeleton width={80} height={10} borderRadius={4} />
                  </View>
                  <Skeleton width={34} height={34} borderRadius={17} />
                </View>

                <View style={{ gap: 8, marginTop: 14 }}>
                  <Skeleton width="90%" height={18} borderRadius={4} />
                  <Skeleton width="100%" height={14} borderRadius={4} />
                  <Skeleton width="65%" height={14} borderRadius={4} />
                </View>

                <View style={[styles.footerDivider, { backgroundColor: colors.border }]} />
                <View style={styles.cardFooter}>
                  <Skeleton width={200} height={11} borderRadius={4} />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={announcements}
            keyExtractor={(item) => String(item.announcement_id)}
            contentContainerStyle={{
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.md,
              paddingBottom: spacing.xxxl,
            }}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={Platform.OS === 'android'}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => {
                  setIsRefreshing(true);
                  load();
                }}
                tintColor={colors.brandOrange}
              />
            }
            ListEmptyComponent={
              <View
                style={[
                  styles.emptyState,
                  {
                    backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  },
                  !isDark && shadow.card,
                ]}
              >
                <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                  <Megaphone size={28} color={colors.textMuted} />
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800', marginTop: 12 }}>
                  No Advisories Yet
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4, textAlign: 'center', lineHeight: 18 }}>
                  Official public bulletins and fire prevention advisories from BFP Lian will appear here.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View
                style={[
                  styles.editorialCard,
                  {
                    backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  },
                  !isDark && shadow.card,
                ]}
              >
              {/* Card Header: Eyebrow + Date & Share */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.eyebrow, { color: colors.brandOrange }]}>
                    OFFICIAL ADVISORY
                  </Text>
                  <Text style={[styles.dateText, { color: colors.textMuted }]}>
                    {formatRelativeDate(item.created_at)}
                  </Text>
                </View>

                {/* Native Apple-style Share Button */}
                <Pressable
                  onPress={() => handleShare(item)}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.shareButton,
                    {
                      backgroundColor: pressed
                        ? colors.brandOrange
                        : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.04)',
                      transform: [{ scale: pressed ? 0.94 : 1 }],
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Share advisory"
                >
                  {({ pressed }) => (
                    <Share2 size={15} color={pressed ? '#FFFFFF' : colors.textSecondary} />
                  )}
                </Pressable>
              </View>

              {/* Headline */}
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {item.title}
              </Text>

              {/* Body Content with relaxed reading line height */}
              <Text style={[styles.content, { color: colors.textSecondary }]}>
                {item.content}
              </Text>

              {/* Station Authority Stamp */}
              <View style={[styles.footerDivider, { backgroundColor: colors.border }]} />
              <View style={styles.cardFooter}>
                <Text style={[styles.footerText, { color: colors.textMuted }]}>
                  Bureau of Fire Protection · Lian Fire Station
                </Text>
              </View>
            </View>
          )}
        />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  editorialCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  shareButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 10,
    lineHeight: 24,
  },
  content: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  footerDivider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 16,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 18,
    borderWidth: 1.5,
    marginTop: 12,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});