import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Megaphone, AlertOctagon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { SecondaryHeader } from '../../components/navigation/SecondaryHeader';
import { announcementService } from '../../services/api';
import { Announcement } from '../../services/api/models';
import { formatRelativeDate } from '../../utils/formatters';

export default function AnnouncementsScreen() {
  const { colors, spacing, typography, radius, shadow } = useTheme();
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

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SecondaryHeader title="Announcements" />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <Text
        style={[
          styles.subheader,
          { color: colors.textMuted, fontSize: typography.size.sm, paddingHorizontal: spacing.lg, marginTop: spacing.sm },
        ]}
      >
        Official advisories & updates
      </Text>

      <FlatList
        data={announcements}
        keyExtractor={(item) => String(item.announcement_id)}
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
              <Megaphone size={32} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: typography.size.sm, marginTop: spacing.sm }}>
                No announcements from BFP Lian yet.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const isEmergency = item.announcement_type === 'emergency';
          return (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surfaceElevated, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
                shadow.card,
              ]}
            >
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: isEmergency ? `${colors.danger}1A` : `${colors.info}1A`, borderRadius: radius.full },
                  ]}
                >
                  {isEmergency ? <AlertOctagon size={12} color={colors.danger} /> : null}
                  <Text
                    style={{
                      color: isEmergency ? colors.danger : colors.info,
                      fontSize: typography.size.xs,
                      fontWeight: '700',
                      marginLeft: isEmergency ? 4 : 0,
                    }}
                  >
                    {isEmergency ? 'EMERGENCY' : 'ADVISORY'}
                  </Text>
                </View>
                <Text style={{ color: colors.textMuted, fontSize: typography.size.xs }}>
                  {formatRelativeDate(item.created_at)}
                </Text>
              </View>
              <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.size.base, marginTop: spacing.xs }]}>
                {item.title}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, marginTop: 4, lineHeight: 20 }}>
                {item.content}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: typography.size.xs, marginTop: spacing.sm }}>
                BFP Lian Fire Station
              </Text>
            </View>
          );
        }}
      />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontWeight: '700' },
  subheader: {},
  card: {},
  badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3 },
  title: { fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
});