import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Share, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Megaphone, Share2, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { SecondaryHeader } from '../../components/navigation/SecondaryHeader';
import { announcementService } from '../../services/api';
import { Announcement } from '../../services/api/models';
import { formatRelativeDate } from '../../utils/formatters';

export default function AnnouncementsScreen() {
  const { colors, spacing, typography, isDark } = useTheme();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      const onBackPress = () => {
        router.back();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  useEffect(() => {
    load();
  }, [load]);

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
      <SecondaryHeader title="Announcements" />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <FlatList
          data={announcements}
          keyExtractor={(item) => String(item.announcement_id)}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: spacing.xxxl,
          }}
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
            !isLoading ? (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                  <Megaphone size={28} color={colors.textMuted} />
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: typography.size.md, fontWeight: '700', marginTop: spacing.md }}>
                  No Advisories Yet
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: typography.size.sm, marginTop: 4, textAlign: 'center', lineHeight: 20 }}>
                  Official public bulletins and fire prevention advisories from BFP Lian will appear here.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.editorialCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
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
                <ShieldCheck size={14} color={colors.brandOrange} />
                <Text style={[styles.footerText, { color: colors.textMuted }]}>
                  Bureau of Fire Protection · Lian Fire Station
                </Text>
              </View>
            </View>
          )}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  editorialCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
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
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});