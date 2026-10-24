import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, RefreshControl, Platform, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Search, ClipboardList } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { AppHeader } from '../../../components/navigation/AppHeader';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { IncidentListItem } from '../../../components/bfp/IncidentListItem';
import { incidentService } from '../../../services/api/incidentService';
import { BFPIncident } from '../../../services/api/bfpModels';
import { useNotifications } from '../../../context/NotificationContext';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Reported' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'resolved', label: 'Resolved' },
];

export default function IncidentsListScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { unreadCount } = useNotifications();
  const [incidents, setIncidents] = useState<BFPIncident[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
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
        // Keep whatever's already showing (fallback or last successful load).
      })
      .finally(() => {
        setIsLoading(false);
        setIsRefreshing(false);
      });

  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    const result = incidents.filter((incident) => {
      const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        (incident.barangay_name ?? '').toLowerCase().includes(query) ||
        (incident.description ?? '').toLowerCase().includes(query) ||
        (incident.reporter_name ?? '').toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });

    // Sort strictly by latest occurrence first (most recent created_at first)
    return result.sort((a, b) => {
      const timeA = new Date((a.created_at || '').replace(' ', 'T')).getTime() || 0;
      const timeB = new Date((b.created_at || '').replace(' ', 'T')).getTime() || 0;
      if (timeA !== timeB) return timeB - timeA;
      return b.report_id - a.report_id;
    });
  }, [incidents, statusFilter, search]);

  const renderItem = useCallback(
    ({ item }: { item: BFPIncident }) => <IncidentListItem incident={item} />,
    []
  );

  const keyExtractor = useCallback((item: BFPIncident) => String(item.report_id), []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader variant="dark" />

      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <Text style={{ color: colors.textPrimary, fontSize: typography.size.lg, fontWeight: '800' }}>
            Incidents
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: typography.size.xs }}>
            {`${filtered.length} record${filtered.length === 1 ? '' : 's'}`}
          </Text>
        </View>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surfaceElevated, borderRadius: radius.md, paddingHorizontal: spacing.md },
          ]}
        >
          <Search size={16} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search barangay, reporter, description…"
            placeholderTextColor={colors.textMuted}
            style={{ flex: 1, color: colors.textPrimary, fontSize: typography.size.sm, marginLeft: spacing.sm, paddingVertical: 10 }}
          />
        </View>

        <View style={{ marginTop: spacing.md }}>
          <SegmentedControl segments={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl * 2 }}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
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
          isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.brandOrange} />
              <Text style={{ color: colors.textMuted, fontSize: typography.size.sm, marginTop: spacing.md }}>
                Loading incidents…
              </Text>
              </View>
          ) : (
            <View style={styles.emptyState}>
            <ClipboardList size={32} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, fontSize: typography.size.sm, marginTop: spacing.sm }}>
              No incidents match this filter.
            </Text>
            </View>
          )
        }
      />

      {/* Temporarily disabled manual incident creation button. */}
      {/*
      <Pressable
        onPress={() => router.push('/(bfp)/incidents/create?from=incidents')}
        style={[styles.fab, { backgroundColor: colors.brandOrange, borderRadius: radius.full }, shadow.fab]}
      >
        <Plus size={26} color="#FFFFFF" />
      </Pressable>
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: { flexDirection: 'row', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
});