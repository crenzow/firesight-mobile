import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
  Platform,
  ActivityIndicator,
  Pressable,
  BackHandler,
  Linking,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Search, ClipboardList, X, ShieldCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../theme/ThemeContext';
import { AppHeader } from '../../../components/navigation/AppHeader';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { IncidentListItem } from '../../../components/bfp/IncidentListItem';
import { incidentService } from '../../../services/api/incidentService';
import { BFPIncident } from '../../../services/api/bfpModels';
import { useNotifications } from '../../../context/NotificationContext';

export default function IncidentsListScreen() {
  const { colors, spacing, typography, radius, isDark } = useTheme();
  const { unreadCount } = useNotifications();
  const [incidents, setIncidents] = useState<BFPIncident[]>([]);
  const [statusFilter, setStatusFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(() => {
    incidentService
      .list()
      .then((data) => {
        if (Array.isArray(data)) {
          setIncidents(data);
        }
      })
      .catch(() => {
        // Keep whatever is already visible (cached/fallback)
      })
      .finally(() => {
        setIsLoading(false);
        setIsRefreshing(false);
      });
  }, []);

  // Live polling every 10s while officer is on screen + Android back button handling
  useFocusEffect(
    useCallback(() => {
      load();

      const timer = setInterval(() => {
        load();
      }, 10000);

      const onBackPress = () => {
        if (search.trim().length > 0) {
          setSearch('');
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        clearInterval(timer);
        subscription.remove();
      };
    }, [load, search])
  );

  // Active incidents count (Reported / Accepted / Dispatched)
  const activeCount = useMemo(() => {
    return incidents.filter(
      (inc) => inc.status === 'pending' || inc.status === 'accepted' || inc.status === 'dispatched'
    ).length;
  }, [incidents]);

  // Smart, operational status filter segments (Active first for emergency readiness)
  const filterSegments = useMemo(
    () => [
      {
        key: 'active',
        label: activeCount > 0 ? `Active (${activeCount})` : 'Active',
      },
      { key: 'resolved', label: 'Resolved' },
      { key: 'invalid', label: 'Invalid' },
      { key: 'all', label: 'All' },
    ],
    [activeCount]
  );

  const filtered = useMemo(() => {
    const result = incidents.filter((incident) => {
      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus =
          incident.status === 'pending' ||
          incident.status === 'accepted' ||
          incident.status === 'dispatched';
      } else if (statusFilter === 'resolved') {
        matchesStatus = incident.status === 'resolved';
      } else if (statusFilter === 'invalid') {
        matchesStatus = incident.status === 'invalid';
      }

      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        (incident.barangay_name ?? '').toLowerCase().includes(query) ||
        (incident.description ?? '').toLowerCase().includes(query) ||
        (incident.reporter_name ?? '').toLowerCase().includes(query) ||
        String(incident.report_id).includes(query);

      return matchesStatus && matchesSearch;
    });

    // Sort strictly by latest occurrence first
    return result.sort((a, b) => {
      const timeA = new Date((a.created_at || '').replace(' ', 'T')).getTime() || 0;
      const timeB = new Date((b.created_at || '').replace(' ', 'T')).getTime() || 0;
      if (timeA !== timeB) return timeB - timeA;
      return b.report_id - a.report_id;
    });
  }, [incidents, statusFilter, search]);

  const renderItem = useCallback(
    ({ item }: { item: BFPIncident }) => <IncidentListItem incident={item} from="incidents" />,
    []
  );

  const keyExtractor = useCallback((item: BFPIncident) => String(item.report_id), []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader variant="dark" />

      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xxxl * 2,
        }}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
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
        ListHeaderComponent={
          <View style={{ paddingTop: spacing.md }}>
            {/* Apple-style search field with instant clear button */}
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F2F2F7',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  borderWidth: isDark ? 1 : 0,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                },
              ]}
            >
              <Search size={16} color={colors.textMuted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search barangay, reporter, ID…"
                placeholderTextColor={colors.textMuted}
                style={{
                  flex: 1,
                  color: colors.textPrimary,
                  fontSize: typography.size.sm,
                  marginLeft: spacing.sm,
                  paddingVertical: Platform.OS === 'ios' ? 10 : 8,
                }}
              />
              {search.length > 0 ? (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setSearch('');
                  }}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.clearBtn,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <View
                    style={[
                      styles.clearCircle,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.25)',
                      },
                    ]}
                  >
                    <X size={10} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                </Pressable>
              ) : null}
            </View>

            {/* Segmented Filter Pills */}
            <View style={{ marginTop: spacing.sm }}>
              <SegmentedControl
                segments={filterSegments}
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </View>

            {/* Section Header */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeaderText, { color: colors.textMuted }]}>
                {statusFilter === 'active'
                  ? 'ACTIVE INCIDENT REPORTS'
                  : statusFilter === 'resolved'
                  ? 'RESOLVED STATION ARCHIVE'
                  : statusFilter === 'invalid'
                  ? 'CLOSED / INVALID REPORTS'
                  : 'INCIDENT LOG ARCHIVE'}
              </Text>
              <Text style={[styles.sectionHeaderCount, { color: colors.textMuted }]}>
                {`${filtered.length} record${filtered.length === 1 ? '' : 's'}`}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.brandOrange} />
              <Text style={{ color: colors.textMuted, fontSize: typography.size.sm, marginTop: spacing.md }}>
                Loading incidents…
              </Text>
            </View>
          ) : (() => {
            const isActiveClear = statusFilter === 'active' && !search.trim();
            const iconColor = isDark ? 'rgba(255, 255, 255, 0.55)' : '#64748B';

            return (
              <View style={styles.emptyState}>
                <View
                  style={[
                    styles.emptyIconContainer,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F3F5',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E6EA',
                    },
                  ]}
                >
                  {isActiveClear ? (
                    <ShieldCheck size={28} color={iconColor} strokeWidth={1.9} />
                  ) : search.trim() ? (
                    <Search size={24} color={iconColor} strokeWidth={1.9} />
                  ) : (
                    <ClipboardList size={24} color={iconColor} strokeWidth={1.9} />
                  )}
                </View>
                <Text
                  style={[
                    styles.emptyTitle,
                    {
                      color: colors.textPrimary,
                      fontSize: typography.size.sm + 1,
                    },
                  ]}
                >
                  {isActiveClear
                    ? 'No Active Incidents'
                    : search.trim()
                    ? 'No Matching Incidents'
                    : 'No Incidents Found'}
                </Text>
                <Text
                  style={[
                    styles.emptySubtitle,
                    {
                      color: colors.textMuted,
                      fontSize: typography.size.xs,
                    },
                  ]}
                >
                  {isActiveClear
                    ? 'There are currently no active incidents reported in Lian.'
                    : search.trim()
                    ? `No incidents match "${search.trim()}".`
                    : 'No incidents recorded in this category.'}
                </Text>
              </View>
            );
          })()
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearBtn: {
    padding: 4,
  },
  clearCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  sectionHeaderCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 56,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 280,
  },
});
