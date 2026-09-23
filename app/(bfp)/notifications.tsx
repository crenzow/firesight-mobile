import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { Bell, AlertTriangle, RefreshCw, Info } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { GlassHeader } from '../../components/glass/GlassHeader';
import { GlassCard } from '../../components/glass/GlassCard';
import { notificationService } from '../../services/api';
import { Notification } from '../../services/api/models';
import { formatRelativeDate, formatFullDate, formatTime } from '../../utils/formatters';
import { router, useLocalSearchParams } from 'expo-router';

const ICONS = { alert: AlertTriangle, update: RefreshCw, system: Info } as const;

const PersonnelNotification: React.FC<{
  notification: Notification;
  onPress: () => void;
}> = ({ notification, onPress }) => {
  const { colors, spacing, typography } = useTheme();
  const Icon = ICONS[notification.notification_type];
  const iconColor = notification.notification_type === 'alert' ? colors.danger : colors.brandOrange;

  return (
    <Pressable onPress={onPress} style={{ marginBottom: spacing.sm }}>
      <GlassCard style={{ opacity: notification.is_read ? 0.7 : 1 }}>
        <View style={styles.row}>
          <View style={[styles.iconCircle, { backgroundColor: `${iconColor}1F` }]}>
            <Icon size={16} color={iconColor} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <View style={styles.titleRow}>
              <Text style={{ color: colors.textPrimary, fontSize: typography.size.sm, fontWeight: '700', flex: 1 }}>
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
      </GlassCard>
    </Pressable>
  );
};

export default function BFPNotificationsScreen() {
  const { colors, spacing, typography } = useTheme();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(() => {
    notificationService
      .list()
      .then((data) => data.length > 0 && setNotifications(data))
      .catch(() => {
        // Keep fallback / last successful data.
      })
      .finally(() => setIsRefreshing(false));
  }, []);

  useEffect(() => {
    load();
    const poller = setInterval(load, 10000);

    return () => clearInterval(poller);
  }, [load]);

  const handlePress = async (notification: Notification) => {
    if (notification.is_read) return;
    setNotifications((prev) => prev.map((n) => (n.notification_id === notification.notification_id ? { ...n, is_read: true } : n)));
    try {
      await notificationService.markRead(notification.notification_id);
    } catch {
      // Optimistic update stands regardless.
    }
  };

  const handleBack = () => {
    if (from) {
      router.navigate(`/(bfp)/${from}` as any);
    } else {
      router.back();
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GlassHeader title="Alerts" subtitle={`${unreadCount} unread`} showBack onBack={handleBack} />

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.notification_id)}
        contentContainerStyle={{ padding: spacing.lg }}
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
  row: { flexDirection: 'row' },
  iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
});