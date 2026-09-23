import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Bell, AlertTriangle, RefreshCw, Info } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { SecondaryHeader } from '../../components/navigation/SecondaryHeader';
import { useNotifications } from '../../context/NotificationContext';
import { notificationService } from '../../services/api';
import { Notification } from '../../services/api/models';
import { formatRelativeDate } from '../../utils/formatters';
import { ShinyCard } from '../../components/ui/ShinyCard';

const ICONS = { alert: AlertTriangle, update: RefreshCw, system: Info } as const;

export default function NotificationsScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { colors, spacing, typography, radius } = useTheme();
  const { markAllRead } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await notificationService.list();
      setNotifications(data);
      // Clear the global badge now that the user has seen the list
      markAllRead();
    } catch {
      // Non-fatal
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [markAllRead]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePress = async (notification: Notification) => {
    if (!notification.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === notification.notification_id ? { ...n, is_read: true } : n))
      );
      try {
        await notificationService.markRead(notification.notification_id);
      } catch {
        // Optimistic update stands even if the sync call fails.
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SecondaryHeader 
        title="Alerts" 
        onBack={() => from ? router.replace(from as any) : router.back()} 
      />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>

      <Text style={[styles.subheader, { color: colors.textMuted, fontSize: typography.size.sm, paddingHorizontal: spacing.lg, marginTop: spacing.sm }]}>
        {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
      </Text>

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.notification_id)}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.md }}
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
              <Bell size={32} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: typography.size.sm, marginTop: spacing.sm }}>
                You're all caught up — no notifications yet.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const Icon = ICONS[item.notification_type];
          const iconColor = item.notification_type === 'alert' ? colors.danger : colors.brandOrange;
          return (
            <ShinyCard
              variant="default"
              style={[styles.rowOuter, { marginBottom: spacing.sm, opacity: item.is_read ? 0.75 : 1 }]}
              padding={spacing.md}
            >
              <Pressable
                onPress={() => handlePress(item)}
                style={styles.rowInner}
              >
                <View style={[styles.iconCircle, { backgroundColor: `${iconColor}14` }]}>
                  <Icon size={16} color={iconColor} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.size.sm }]}>
                      {item.title}
                    </Text>
                    {!item.is_read ? <View style={[styles.dot, { backgroundColor: colors.brandOrange }]} /> : null}
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs, marginTop: 2 }}>
                    {item.message}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: 4 }}>
                    {formatRelativeDate(item.created_at)}
                  </Text>
                </View>
              </Pressable>
            </ShinyCard>
          );
        }}
      />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontWeight: '700' },
  subheader: {},
  row: { flexDirection: 'row', borderWidth: StyleSheet.hairlineWidth },
  rowOuter: {},
  rowInner: { flexDirection: 'row', alignItems: 'flex-start', width: '100%' },
  iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontWeight: '700', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
});