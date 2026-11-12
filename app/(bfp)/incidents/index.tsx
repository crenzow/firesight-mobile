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
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Search, ClipboardList, X, Calendar, ChevronDown, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { AppHeader } from '../../../components/navigation/AppHeader';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { IncidentListItem } from '../../../components/bfp/IncidentListItem';
import { Skeleton } from '../../../components/ui/Skeleton';
import { DateRangeModal } from '../../../components/bfp/DateRangeModal';
import { incidentService } from '../../../services/api/incidentService';
import { BFPIncident } from '../../../services/api/bfpModels';
import { useNotifications } from '../../../context/NotificationContext';

function getIncidentResolutionDate(incident: BFPIncident): Date | null {
  const dateStr = incident.time_fire_out || incident.incident_datetime || incident.created_at;
  if (!dateStr) return null;
  const parsed = new Date(dateStr.replace(' ', 'T'));
  return isNaN(parsed.getTime()) ? null : parsed;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isSameMonth(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth()
  );
}

export default function IncidentsListScreen() {
  const { colors, spacing, typography, radius, shadow, isDark } = useTheme();
  const { unreadCount } = useNotifications();
  const { filter, datePreset } = useLocalSearchParams<{
    filter?: string;
    datePreset?: 'today' | 'month';
  }>();
  const [incidents, setIncidents] = useState<BFPIncident[]>([]);
  const [statusFilter, setStatusFilter] = useState(filter || 'active');

  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>(() => {
    const now = new Date();
    if (datePreset === 'today') {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      return { start: s, end: e };
    }
    if (datePreset === 'month') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { start: s, end: e };
    }
    return { start: null, end: null };
  });

  const [showDateModal, setShowDateModal] = useState(false);

  React.useEffect(() => {
    if (filter) {
      setStatusFilter(filter);
    }
  }, [filter]);

  React.useEffect(() => {
    if (datePreset === 'today') {
      const now = new Date();
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      setDateRange({ start: s, end: e });
    } else if (datePreset === 'month') {
      const now = new Date();
      const s = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      setDateRange({ start: s, end: e });
    }
  }, [datePreset]);
  const [search, setSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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
        router.replace('/(bfp)/dashboard');
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        clearInterval(timer);
        subscription.remove();
      };
    }, [load, search])
  );

  // Active incidents count (Accepted / Dispatched)
  const activeCount = useMemo(() => {
    return incidents.filter(
      (inc) => inc.status === 'accepted' || inc.status === 'dispatched'
    ).length;
  }, [incidents]);

  // Pending verification count
  const pendingCount = useMemo(() => {
    return incidents.filter((inc) => inc.status === 'pending').length;
  }, [incidents]);

  // Smart, operational status filter segments (Active first for emergency readiness)
  const filterSegments = useMemo(
    () => [
      {
        key: 'active',
        label: activeCount > 0 ? `Active (${activeCount})` : 'Active',
      },
      {
        key: 'pending',
        label: pendingCount > 0 ? `Pending (${pendingCount})` : 'Pending',
      },
      { key: 'resolved', label: 'Resolved' },
      { key: 'invalid', label: 'Invalid' },
      { key: 'all', label: 'All' },
    ],
    [activeCount, pendingCount]
  );

  const datePillLabel = useMemo(() => {
    if (!dateRange.start || !dateRange.end) {
      return 'All Dates';
    }
    const now = new Date();
    const isToday = isSameDay(dateRange.start, now) && isSameDay(dateRange.end, now);
    if (isToday) {
      return `Today · ${dateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    const isStartOfMonth = dateRange.start.getDate() === 1;
    const daysInMonth = new Date(dateRange.start.getFullYear(), dateRange.start.getMonth() + 1, 0).getDate();
    const isEndOfMonth = dateRange.end.getDate() === daysInMonth;
    if (isStartOfMonth && isEndOfMonth && isSameMonth(dateRange.start, dateRange.end)) {
      return `This Month · ${dateRange.start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    }
    if (isSameDay(dateRange.start, dateRange.end)) {
      return dateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    const startStr = dateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = dateRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} – ${endStr}`;
  }, [dateRange]);

  const hasDateFilter = Boolean(dateRange.start && dateRange.end);

  const filtered = useMemo(() => {
    const result = incidents.filter((incident) => {
      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = incident.status === 'accepted' || incident.status === 'dispatched';
      } else if (statusFilter === 'pending') {
        matchesStatus = incident.status === 'pending';
      } else if (statusFilter === 'resolved') {
        matchesStatus = incident.status === 'resolved';
      } else if (statusFilter === 'invalid') {
        matchesStatus = incident.status === 'invalid';
      }

      // Date Range Filter
      let matchesDate = true;
      if (dateRange.start && dateRange.end) {
        const d = getIncidentResolutionDate(incident);
        if (d) {
          const t = d.getTime();
          matchesDate = t >= dateRange.start.getTime() && t <= dateRange.end.getTime();
        } else {
          matchesDate = false;
        }
      }

      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        (incident.barangay_name ?? '').toLowerCase().includes(query) ||
        (incident.description ?? '').toLowerCase().includes(query) ||
        (incident.reporter_name ?? '').toLowerCase().includes(query) ||
        String(incident.report_id).includes(query);

      return matchesStatus && matchesDate && matchesSearch;
    });

    // Sort strictly by latest occurrence first
    return result.sort((a, b) => {
      const timeA = new Date((a.created_at || '').replace(' ', 'T')).getTime() || 0;
      const timeB = new Date((b.created_at || '').replace(' ', 'T')).getTime() || 0;
      if (timeA !== timeB) return timeB - timeA;
      return b.report_id - a.report_id;
    });
  }, [incidents, statusFilter, dateRange, search]);

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
            {/* Search Input Bar + Date Filter Icon Button */}
            <View style={styles.searchRow}>
              <View
                style={[
                  styles.searchBar,
                  {
                    backgroundColor: isSearchFocused
                      ? (isDark ? 'rgba(255, 255, 255, 0.12)' : '#FFFFFF')
                      : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#F2F2F7'),
                    borderRadius: 14,
                    paddingHorizontal: 12,
                    borderWidth: 1.5,
                    borderColor: isSearchFocused
                      ? colors.brandOrange
                      : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent'),
                  },
                ]}
              >
                <Search
                  size={17}
                  color={isSearchFocused ? colors.brandOrange : colors.textMuted}
                  strokeWidth={isSearchFocused ? 2.2 : 2}
                />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Search barangay, reporter, ID…"
                  placeholderTextColor={colors.textMuted}
                  style={{
                    flex: 1,
                    color: colors.textPrimary,
                    fontSize: typography.size.sm,
                    marginLeft: spacing.sm,
                    height: '100%',
                    paddingVertical: 0,
                  }}
                />
                {search.length > 0 ? (
                  <Pressable
                    onPress={() => setSearch('')}
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

              {/* Date Filter Icon Button */}
              <Pressable
                onPress={() => setShowDateModal(true)}
                style={({ pressed }) => [
                  styles.dateFilterIconBtn,
                  {
                    backgroundColor: hasDateFilter
                      ? (isDark ? 'rgba(244, 98, 43, 0.22)' : 'rgba(244, 98, 43, 0.14)')
                      : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#F2F2F7'),
                    borderColor: hasDateFilter
                      ? colors.brandOrange
                      : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent'),
                    transform: [{ scale: pressed ? 0.94 : 1 }],
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Filter incidents by date range"
              >
                <Calendar
                  size={19}
                  color={hasDateFilter ? colors.brandOrange : (isDark ? colors.textPrimary : colors.brandNavy)}
                  strokeWidth={2.2}
                />
              </Pressable>
            </View>

            {/* Active Date Filter Tag (Only visible when date filter is on) */}
            {hasDateFilter && (
              <View style={styles.activeFilterTagRow}>
                <View
                  style={[
                    styles.activeFilterTag,
                    {
                      backgroundColor: isDark ? 'rgba(244, 98, 43, 0.16)' : 'rgba(244, 98, 43, 0.10)',
                      borderColor: colors.brandOrange,
                    },
                  ]}
                >
                  <Text style={[styles.activeFilterTagText, { color: colors.brandOrange }]}>
                    {datePillLabel}
                  </Text>
                  <Pressable
                    onPress={() => setDateRange({ start: null, end: null })}
                    hitSlop={8}
                    style={styles.activeFilterTagClear}
                    accessibilityRole="button"
                    accessibilityLabel="Clear date filter"
                  >
                    <X size={12} color={colors.brandOrange} strokeWidth={2.4} />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Segmented Filter Pills */}
            <View style={{ marginTop: hasDateFilter ? spacing.xs : spacing.sm }}>
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
                  : statusFilter === 'pending'
                  ? 'PENDING VERIFICATION QUEUE'
                  : statusFilter === 'resolved'
                  ? 'RESOLVED STATION ARCHIVE'
                  : statusFilter === 'invalid'
                  ? 'CLOSED / INVALID REPORTS'
                  : 'INCIDENT LOG ARCHIVE'}
              </Text>
              <Text style={[styles.sectionHeaderCount, { color: colors.textMuted }]}>
                {isLoading ? '...' : `${filtered.length} record${filtered.length === 1 ? '' : 's'}`}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingTop: spacing.xs }}>
              {[0, 1, 2, 3].map((key) => (
                <View
                  key={key}
                  style={[
                    styles.skeletonCard,
                    {
                      backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    },
                    !isDark && shadow.card,
                  ]}
                >
                  <Skeleton width={72} height={72} borderRadius={14} />
                  <View style={styles.skeletonContentCol}>
                    <View style={styles.skeletonTopRow}>
                      <Skeleton width={68} height={18} borderRadius={6} />
                      <Skeleton width={52} height={12} borderRadius={4} />
                    </View>
                    <Skeleton width="82%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
                    <Skeleton width="55%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
                    <Skeleton width={110} height={18} borderRadius={6} />
                  </View>
                </View>
              ))}
            </View>
          ) : (() => {
            const isActiveClear = statusFilter === 'active' && !search.trim();
            const iconColor = isDark ? 'rgba(255, 255, 255, 0.55)' : '#64748B';

            return (
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

      <DateRangeModal
        visible={showDateModal}
        onClose={() => setShowDateModal(false)}
        startDate={dateRange.start}
        endDate={dateRange.end}
        onApply={(s, e) => setDateRange({ start: s, end: e })}
        onClear={() => setDateRange({ start: null, end: null })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
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
  dateFilterIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilterTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  activeFilterTagText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  activeFilterTagClear: {
    paddingLeft: 2,
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
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderRadius: 18,
    borderWidth: 1.5,
    marginTop: 8,
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
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  skeletonContentCol: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  skeletonTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
});
