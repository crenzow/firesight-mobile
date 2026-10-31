import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Flame, ClipboardList, CheckCircle2, CalendarDays, MapPinned, ChevronRight, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { AppHeader } from '../../components/navigation/AppHeader';
import { StatTile } from '../../components/bfp/StatTile';
import { DashboardHero } from '../../components/bfp/DashboardHero';
import { IncidentListItem } from '../../components/bfp/IncidentListItem';
import { Skeleton } from '../../components/ui/Skeleton';
import { incidentService } from '../../services/api/incidentService';
import { BFPIncident, DashboardAnalytics } from '../../services/api/bfpModels';

const enter = (index: number) => FadeInDown.delay(index * 60).duration(380);

export default function DashboardScreen() {
  const { colors, spacing, shadow, isDark } = useTheme();
  const { user } = useAuth();

  const [analytics, setAnalytics] = useState<DashboardAnalytics>({
    active_incidents: 0,
    pending_verification: 0,
    resolved_today: 0,
    total_this_month: 0,
  });
  const [recentIncidents, setRecentIncidents] = useState<BFPIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [analyticsResult, incidentsResult] = await Promise.allSettled([
      incidentService.getDashboardAnalytics(),
      incidentService.list(),
    ]);

    if (analyticsResult.status === 'fulfilled') setAnalytics(analyticsResult.value);
    if (incidentsResult.status === 'fulfilled') {
      const sorted = [...incidentsResult.value].sort((a, b) => {
        const timeA = new Date(a.created_at.replace(' ', 'T')).getTime() || 0;
        const timeB = new Date(b.created_at.replace(' ', 'T')).getTime() || 0;
        if (timeA !== timeB) return timeB - timeA;
        return b.report_id - a.report_id;
      });
      setRecentIncidents(sorted.slice(0, 5));
    }
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const goToIncidents = () => router.push('/(bfp)/incidents');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader variant="dark" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        overScrollMode="never"
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
      >
        <DashboardHero firstName={user?.first_name} />

        <View style={{ paddingHorizontal: spacing.lg, marginTop: -28 }}>
          <View style={{ gap: spacing.sm }}>
            <Animated.View entering={enter(0)} style={[styles.kpiRow, { gap: spacing.sm }]}>
              <StatTile
                icon={<Flame size={20} color={colors.danger} strokeWidth={2.2} />}
                value={analytics.active_incidents}
                label="Active incidents"
                accentColor={colors.danger}
                isLoading={isLoading}
              />
              <StatTile
                icon={<ClipboardList size={20} color={colors.warning} strokeWidth={2.2} />}
                value={analytics.pending_verification}
                label="Pending verification"
                accentColor={colors.warning}
                isLoading={isLoading}
              />
            </Animated.View>
            <Animated.View entering={enter(1)} style={[styles.kpiRow, { gap: spacing.sm }]}>
              <StatTile
                icon={<CheckCircle2 size={20} color={colors.success} strokeWidth={2.2} />}
                value={analytics.resolved_today}
                label="Resolved today"
                accentColor={colors.success}
                isLoading={isLoading}
              />
              <StatTile
                icon={<CalendarDays size={20} color={colors.info} strokeWidth={2.2} />}
                value={analytics.total_this_month}
                label="Resolved this month"
                accentColor={colors.info}
                isLoading={isLoading}
              />
            </Animated.View>
          </View>

          {/* GIS map monitor CTA */}
          <Animated.View entering={enter(2)} style={{ marginTop: spacing.xl }}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                router.push('/(bfp)/map');
              }}
              style={({ pressed }) => [
                styles.mapCard,
                {
                  backgroundColor: pressed
                    ? (isDark ? '#221915' : '#F9FAFB')
                    : (isDark ? colors.surfaceElevated : '#FFFFFF'),
                  borderColor: pressed ? colors.brandOrange : (isDark ? 'rgba(255,255,255,0.06)' : 'transparent'),
                  borderWidth: 1.5,
                  transform: [{ scale: pressed ? 0.985 : 1 }],
                },
                !isDark && shadow.card,
              ]}
            >
              {({ pressed }) => (
                <>
                  <View
                    style={[
                      styles.mapIcon,
                      { backgroundColor: pressed ? colors.brandOrange : colors.brandNavy },
                    ]}
                  >
                    <MapPinned size={22} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={[styles.cardTitle, { color: pressed ? colors.brandOrange : colors.textPrimary }]}>Risk & Incident Map</Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                      Monitor fire-prone zones and incident records
                    </Text>
                  </View>
                  <ChevronRight size={20} color={pressed ? colors.brandOrange : colors.textMuted} />
                </>
              )}
            </Pressable>
          </Animated.View>

          {/* Real-time incident list */}
          <Animated.View entering={enter(3)}>
            <View style={[styles.sectionHeader, { marginTop: spacing.xl, marginBottom: spacing.md }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Incidents</Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  goToIncidents();
                }}
                style={({ pressed }) => [
                  styles.seeAllRow,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Text style={[styles.seeAllText, { color: colors.brandOrange }]}>See all</Text>
                <ChevronRight size={14} color={colors.brandOrange} strokeWidth={2.5} />
              </Pressable>
            </View>

            {isLoading ? (
              [0, 1, 2].map((key) => (
                <View key={key} style={styles.skeletonRow}>
                  <Skeleton width={56} height={56} borderRadius={14} />
                  <View style={{ flex: 1, marginLeft: spacing.md, gap: 8 }}>
                    <Skeleton width="70%" height={14} />
                    <Skeleton width="45%" height={12} />
                  </View>
                </View>
              ))
            ) : recentIncidents.length === 0 ? (
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
                <View style={[styles.emptyIcon, { backgroundColor: `${colors.success}1A` }]}>
                  <ShieldCheck size={26} color={colors.success} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.textPrimary, marginTop: spacing.md }]}>
                  No incidents today
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary, textAlign: 'center' }]}>
                  New reports will appear here in real time.
                </Text>
              </View>
            ) : (
              recentIncidents.map((incident) => (
                <IncidentListItem key={incident.report_id} incident={incident} from="dashboard" />
              ))
            )}
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  kpiRow: { flexDirection: 'row' },
  mapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
  },
  mapIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  cardSubtitle: { fontSize: 12.5, fontWeight: '500', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4, paddingHorizontal: 4 },
  seeAllText: { fontSize: 13, fontWeight: '600' },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  emptyState: { alignItems: 'center', padding: 24, borderRadius: 18, borderWidth: 1.5 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
