import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Platform, BackHandler } from 'react-native';
import { Bell, AlertTriangle, RefreshCw, Info } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { SecondaryHeader } from '../../components/navigation/SecondaryHeader';
import { Card } from '../../components/ui/Card';
import { Notification } from '../../services/api/models';
import { formatRelativeDate, formatFullDate, formatTime } from '../../utils/formatters';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useNotifications } from '../../context/NotificationContext';

const ICONS: Record<string, any> = {
  incident_alert: AlertTriangle,
  status_update: RefreshCw,
  system: Info,
  reminder: AlertTriangle,
};

const PersonnelNotification: React.FC<{
  notification: Notification;
  onPress: () => void;
}> = ({ notification, onPress }) => {
  const { colors, spacing, typography, shadow, isDark } = useTheme();
  const Icon = ICONS[notification.notification_type] ?? Info;
  const isAlert = notification.notification_type === 'incident_alert';
  const iconColor = isAlert ? colors.danger : colors.brandOrange;
  const cardBg = isDark ? colors.surfaceElevated : '#FFFFFF';
  const pressedBg = isDark ? '#221915' : '#F9FAFB';
  const normalBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent';
  const pressedBorder = isAlert ? colors.danger : colors.brandOrange;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.notificationCard,
        {
          backgroundColor: pressed ? pressedBg : cardBg,
          borderColor: pressed ? pressedBorder : normalBorder,
          borderWidth: 1.5,
          opacity: notification.is_read ? 0.72 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        !isDark && shadow.card,
      ]}
    >
      {({ pressed }) => (
        <View style={styles.row}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: pressed
                  ? iconColor
                  : `${iconColor}1F`,
              },
            ]}
          >
            <Icon size={16} color={pressed ? '#FFFFFF' : iconColor} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <View style={styles.titleRow}>
              <Text
                style={{
                  color: pressed ? pressedBorder : colors.textPrimary,
                  fontSize: typography.size.sm,
                  fontWeight: '700',
                  flex: 1,
                }}
              >
                {notification.title}
              </Text>
              {!notification.is_read ? <View style={[styles.dot, { backgroundColor: colors.brandOrange }]} /> : null}
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs, marginTop: 2 }}>
              {notification.message}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 4 }}>
              {formatRelativeDate(notification.created_at)} · {formatFullDate(notification.created_at)}, {formatTime(notification.created_at)}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
};

export default function BFPNotificationsScreen() {
  const { colors, spacing, typography } = useTheme();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { notifications, refresh, markRead, markAllRead } = useNotifications();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      await markAllRead();
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh, markAllRead]);

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
    if (notification.is_read) return;
    await markRead(notification.notification_id);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SecondaryHeader title="Alerts" subtitle={`${unreadCount} unread`} onBack={handleBack} />

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.notification_id)}
        contentContainerStyle={{ padding: spacing.lg }}
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
            <Bell size={32} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, fontSize: typography.size.sm, marginTop: spacing.sm }}>
              No alerts right now.
            </Text>
          </View>
        }
        renderItem={({ item }) => <PersonnelNotification notification={item} onPress={() => handlePress(item)} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  notificationCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
  },
  row: { flexDirection: 'row' },
  iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
});