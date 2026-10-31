import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, BackHandler, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Bell, AlertTriangle, RefreshCw, Info, Clock } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { SecondaryHeader } from '../../components/navigation/SecondaryHeader';
import { useNotifications } from '../../context/NotificationContext';
import { Notification } from '../../services/api/models';
import { formatRelativeDate } from '../../utils/formatters';

const ICONS: Record<string, any> = {
  incident_alert: AlertTriangle,
  status_update: RefreshCw,
  system: Info,
  reminder: Clock,
};

export default function NotificationsScreen() {
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
      if (from.startsWith('/(resident)/')) {
        router.replace(from as any);
      } else if (from.startsWith('/')) {
        router.replace(`/(resident)${from}` as any);
      } else {
        router.replace(`/(resident)/${from}` as any);
      }
    } else {
      router.replace('/(resident)/home');
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
        pathname: '/(resident)/reports/[id]',
        params: { id: String(notification.report_id), from: '/(resident)/notifications' },
      } as any);
    } else if (notification.notification_type === 'incident_alert' || notification.notification_type === 'status_update') {
      router.push({
        pathname: '/(resident)/reports',
        params: { from: '/(resident)/notifications' },
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
                You're all caught up — no new alerts right now.
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => (
            <View
              style={[
                styles.divider,
                {
                  backgroundColor: colors.border,
                  marginLeft: spacing.lg + 38 + spacing.md, // Inset divider aligned past icon
                },
              ]}
            />
          )}
          renderItem={({ item }) => {
            const Icon = ICONS[item.notification_type] ?? Info;
            const isAlert = item.notification_type === 'incident_alert';
            const iconColor = isAlert ? colors.danger : colors.brandOrange;

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
                    backgroundColor: pressed
                      ? (isDark ? '#221915' : '#F9FAFB')
                      : 'transparent',
                    borderColor: pressed ? colors.brandOrange : 'transparent',
                    borderWidth: 1.5,
                    opacity: item.is_read ? 0.72 : 1,
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
                          backgroundColor: pressed ? colors.brandOrange : `${iconColor}14`,
                          borderColor: pressed ? colors.brandOrange : `${iconColor}25`,
                        },
                      ]}
                    >
                      <Icon size={18} color={pressed ? '#FFFFFF' : iconColor} />
                    </View>

                    {/* Content */}
                    <View style={styles.contentCol}>
                      <View style={styles.titleRow}>
                        <Text
                          style={[
                            styles.title,
                            {
                              color: colors.textPrimary,
                              fontSize: typography.size.sm,
                              fontWeight: item.is_read ? '600' : '700',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        {!item.is_read && (
                          <View style={[styles.dot, { backgroundColor: colors.brandOrange }]} />
                        )}
                      </View>

                      <Text
                        style={[
                          styles.message,
                          { color: colors.textSecondary, fontSize: typography.size.xs, marginTop: 3 },
                        ]}
                      >
                        {item.message}
                      </Text>

                      <Text
                        style={[
                          styles.timeText,
                          { color: colors.textMuted, fontSize: typography.size.xs, marginTop: 4 },
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
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