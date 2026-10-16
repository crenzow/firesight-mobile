import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Bell, AlertTriangle, RefreshCw, Info, Clock } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { SecondaryHeader } from '../../components/navigation/SecondaryHeader';
import { useNotifications } from '../../context/NotificationContext';
import { Notification } from '../../services/api/models';
import { formatRelativeDate } from '../../utils/formatters';

const ICONS = { alert: AlertTriangle, update: RefreshCw, system: Info } as const;

export default function NotificationsScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { colors, spacing, typography, isDark } = useTheme();
  const { notifications, refresh, markRead, markAllRead } = useNotifications();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      await markAllRead();
    } catch {
      // Non-fatal
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh, markAllRead]);

  const handleBack = useCallback(() => {
    if (from) {
      router.replace(from as any);
    } else {
      router.back();
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
            const iconColor = item.notification_type === 'alert' ? colors.danger : colors.brandOrange;
            return (
              <Pressable
                onPress={() => handlePress(item)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    paddingHorizontal: spacing.lg,
                    paddingVertical: 14,
                    backgroundColor: pressed
                      ? (isDark ? '#221915' : '#FFF7F2')
                      : 'transparent',
                    borderLeftWidth: pressed ? 3 : 0,
                    borderLeftColor: colors.brandOrange,
                    transform: [{ scale: pressed ? 0.985 : 1 }],
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
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
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

                      <View style={styles.timeRow}>
                        <Clock size={11} color={colors.textMuted} />
                        <Text style={[styles.timeText, { color: colors.textMuted, fontSize: typography.size.xs, marginLeft: 4 }]}>
                          {formatRelativeDate(item.created_at)}
                        </Text>
                      </View>
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
    width: '100%',
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