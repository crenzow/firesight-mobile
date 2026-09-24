import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Search, ClipboardList } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { GlassHeader } from '../../../components/glass/GlassHeader';
import { SegmentedControl } from '../../../components/glass/SegmentedControl';
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

const STATUS_PRIORITY: Record<string, number> = {
  'pending': 1,
  'accepted': 2,
  'dispatched': 3,
  'resolved': 4,
  'invalid': 5,
};

export default function IncidentsListScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { unreadCount } = useNotifications();
  const [incidents, setIncidents] = useState<BFPIncident[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(() => {
    incidentService
      .list()
      .then((data) => data.length > 0 && setIncidents(data))
      .catch(() => {
        // Keep whatever's already showing (fallback or last successful load).
      })
      .finally(() => setIsRefreshing(false));

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
        incident.barangay_name.toLowerCase().includes(query) ||
        incident.description.toLowerCase().includes(query) ||
        (incident.reporter_name ?? '').toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });

    // Sort: prioritize by status priority, then fallback to descending date (latest first)
    return result.sort((a, b) => {
      const pA = STATUS_PRIORITY[a.status] ?? 99;
      const pB = STATUS_PRIORITY[b.status] ?? 99;
      
      if (pA !== pB) {
        return pA - pB; // lower number = higher priority
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [incidents, statusFilter, search]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GlassHeader title="Incidents" subtitle={`${filtered.length} record${filtered.length === 1 ? '' : 's'}`} unreadCount={unreadCount} />

      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
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
        keyExtractor={(item) => String(item.report_id)}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl * 2 }}
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
            <ClipboardList size={32} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, fontSize: typography.size.sm, marginTop: spacing.sm }}>
              No incidents match this filter.
            </Text>
          </View>
        }
        renderItem={({ item }) => <IncidentListItem incident={item} />}
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