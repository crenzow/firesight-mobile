import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, BackHandler, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Bell, AlertTriangle, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { SecondaryHeader } from '../../components/navigation/SecondaryHeader';
import { useNotifications } from '../../context/NotificationContext';
import { Notification } from '../../services/api/models';
import { formatRelativeDate } from '../../utils/formatters';

const ICONS: Record<string, any> = {
  incident_alert: AlertTriangle,
  status_update: RefreshCw,
};

export default function BFPNotificationsScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { colors, spacing, typography, isDark } = useTheme();
  const { notifications, refresh, markRead } = useNotifications();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } catch {
      // Non-fatal
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  const handleBack = useCallback(() => {
    if (from) {
      if (from.startsWith('/(bfp)/')) {
        router.replace(from as any);
      } else if (from.startsWith('/')) {
        router.replace(`/(bfp)${from}` as any);
      } else {
        router.replace(`/(bfp)/${from}` as any);
      }
    } else {
      router.replace('/(bfp)/dashboard');
    }
  }, [from]);

  useFocusEffect(
    useCallback(() => {
      load();

      const onBackPress = () => {
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [load, handleBack])
  );

  const handlePress = async (notification: Notification) => {
    if (!notification.is_read) {
      await markRead(notification.notification_id);
    }
    if (notification.report_id) {
      router.push({
        pathname: '/(bfp)/incidents/[id]',
        params: { id: String(notification.report_id), from: '/(bfp)/notifications' },
      } as any);
    } else {
      router.push({
        pathname: '/(bfp)/incidents',
        params: { from: '/(bfp)/notifications' },
      } as any);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SecondaryHeader 
        title="Notifications" 
        onBack={handleBack} 
      />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.notification_id)}
          contentContainerStyle={{
            paddingTop: spacing.xs,
            paddingBottom: spacing.xxxl,
          }}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
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
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                <Bell size={28} color={colors.textMuted} />
              </View>
              <Text style={{ color: colors.textPrimary, fontSize: typography.size.md, fontWeight: '700', marginTop: spacing.md }}>
                No Notifications
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: typography.size.sm, marginTop: 4, textAlign: 'center' }}>
                You're all caught up — no new notifications right now.
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => (
            <View
              style={[
                styles.divider,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
            />
          )}
          renderItem={({ item }) => {
            const Icon = ICONS[item.notification_type] ?? Bell;
            const isUnread = !item.is_read;

            const unreadBg = isDark ? 'rgba(59, 130, 246, 0.18)' : '#DFEDFA';
            const readBg = 'transparent';
            const pressedBg = isDark
              ? (isUnread ? 'rgba(59, 130, 246, 0.28)' : 'rgba(255, 255, 255, 0.06)')
              : (isUnread ? '#D1E4F7' : '#EAECEF');

            return (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  handlePress(item);
                }}
                style={({ pressed }) => [
                  styles.row,
                  {
                    paddingHorizontal: spacing.lg,
                    paddingVertical: 14,
                    backgroundColor: pressed ? pressedBg : (isUnread ? unreadBg : readBg),
                  },
                ]}
              >
                {({ pressed }) => (
                  <>
                    {/* Icon Circle */}
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor: pressed
                            ? colors.brandOrange
                            : isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : '#F1F5F9',
                          borderColor: isDark
                            ? 'rgba(255, 255, 255, 0.12)'
                            : '#E2E8F0',
                        },
                      ]}
                    >
                      <Icon
                        size={18}
                        color={pressed ? '#FFFFFF' : colors.textPrimary}
                      />
                    </View>

                    {/* Content */}
                    <View style={styles.contentCol}>
                      <View style={styles.titleRow}>
                        <Text
                          style={[
                            styles.title,
                            {
                              color: colors.textPrimary,
                              fontSize: 14.5,
                              fontWeight: '700',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.message,
                          {
                            color: colors.textSecondary,
                            fontSize: 12.5,
                            fontWeight: '400',
                            lineHeight: 18,
                            marginTop: 3,
                          },
                        ]}
                      >
                        {item.message}
                      </Text>

                      <Text
                        style={[
                          styles.timeText,
                          {
                            color: colors.textMuted,
                            fontSize: 11,
                            fontWeight: '400',
                            marginTop: 4,
                          },
                        ]}
                      >
                        {formatRelativeDate(item.created_at)}
                      </Text>
                    </View>
                  </>
                )}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  contentCol: {
    flex: 1,
    marginLeft: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
  },
  message: {
    lineHeight: 17,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  timeText: {
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
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
