import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Flame,
  ClipboardList,
  CheckCircle2,
  CalendarDays,
  MapPinned,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { AppHeader } from '../../components/navigation/AppHeader';
import { Card } from '../../components/ui/Card';
import { StatTile } from '../../components/bfp/StatTile';
import { IncidentListItem } from '../../components/bfp/IncidentListItem';
import { InteractiveCard } from '../../components/bfp/InteractiveCard';
import { LinearGradient } from 'expo-linear-gradient';
import { incidentService } from '../../services/api/incidentService';
import { BFPIncident, DashboardAnalytics } from '../../services/api/bfpModels';
import { useNotifications } from '../../context/NotificationContext';



export default function DashboardScreen() {
  const { colors, spacing, typography, radius, shadow, isDark } = useTheme();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const [analytics, setAnalytics] = useState<DashboardAnalytics>({
    active_incidents: 0,
    pending_verification: 0,
    resolved_today: 0,
    total_this_month: 0,
  });
  const [recentIncidents, setRecentIncidents] = useState<BFPIncident[]>([]);
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
    setIsRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader variant="dark" />

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}
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
        <Text style={{ color: colors.textPrimary, fontSize: typography.size.xxl, fontWeight: '900' }}>
          Good {getTimeOfDayLabel()}, {user?.first_name ?? 'Officer'}
        </Text>
        {/* Analytics overview */}
        <View style={[styles.statsGrid, { marginTop: spacing.lg, gap: spacing.md }]}>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <StatTile
              icon={<Flame size={18} color={colors.danger} />}
              value={analytics.active_incidents}
              label="Active Incidents"
              accentColor={colors.danger}
            />
            <StatTile
              icon={<ClipboardList size={18} color={colors.warning} />}
              value={analytics.pending_verification}
              label="Pending Verification"
              accentColor={colors.warning}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <StatTile
              icon={<CheckCircle2 size={18} color={colors.success} />}
              value={analytics.resolved_today}
              label="Resolved Today"
              accentColor={colors.success}
            />
            <StatTile
              icon={<CalendarDays size={18} color={colors.info} />}
              value={analytics.total_this_month}
              label="Resolved this Month"
              accentColor={colors.info}
            />
          </View>
        </View>

        {/* GIS map monitor CTA */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            router.push('/(bfp)/map');
          }}
          style={({ pressed }) => [
            {
              marginTop: spacing.xl,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          {({ pressed }) => (
            <LinearGradient
              colors={
                pressed
                  ? ['#1E2C52', '#0A1229']
                  : [isDark ? colors.surfaceElevated : colors.brandNavy, isDark ? colors.surface : colors.brandNavyDeep]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: radius.xl,
                padding: spacing.lg,
                borderWidth: 1.5,
                borderColor: pressed ? colors.brandOrange : 'transparent',
                ...shadow.large,
              }}
            >
              <View style={styles.mapCtaRow}>
                <View style={[styles.mapIconCircle, { backgroundColor: pressed ? colors.brandOrange : 'rgba(255,255,255,0.15)' }]}>
                  <MapPinned size={22} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={{ color: '#FFFFFF', fontSize: typography.size.md, fontWeight: '800' }}>
                    Risk & Incident Map
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: typography.size.xs, marginTop: 2, fontWeight: '500' }}>
                    Monitor fire-prone zones and incident records
                  </Text>
                </View>
                <ChevronRight size={20} color={pressed ? colors.brandOrange : 'rgba(255,255,255,0.5)'} />
              </View>
            </LinearGradient>
          )}
        </Pressable>

        {/* Real-time incident list */}
        <View style={[styles.sectionHeader, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>
          <Text style={{ color: colors.textPrimary, fontSize: typography.size.md, fontWeight: '700' }}>
            Recent Incidents
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              router.push('/(bfp)/incidents');
            }}
            style={({ pressed }) => [
              styles.seeAllRow,
              {
                backgroundColor: pressed ? colors.brandOrange : 'transparent',
                paddingHorizontal: pressed ? 8 : 4,
                paddingVertical: 2,
                borderRadius: 12,
                transform: [{ scale: pressed ? 0.94 : 1 }],
              },
            ]}
          >
            {({ pressed }) => (
              <>
                <Text style={{ color: pressed ? '#FFFFFF' : colors.brandOrange, fontSize: 13, fontWeight: '700' }}>See all</Text>
                <ChevronRight size={13} color={pressed ? '#FFFFFF' : colors.brandOrange} strokeWidth={2.5} />
              </>
            )}
          </Pressable>
        </View>

        {recentIncidents.length === 0 ? (
          <Card>
            <Text style={{ color: colors.textMuted, fontSize: typography.size.sm, textAlign: 'center' }}>
              No incidents reported yet today.
            </Text>
          </Card>
        ) : (
          recentIncidents.map((incident) => <IncidentListItem key={incident.report_id} incident={incident} from="dashboard" />)
        )}
      </ScrollView>
    </View>
  );
}

function getTimeOfDayLabel(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}

const styles = StyleSheet.create({
  statsGrid: {},
  mapCtaRow: { flexDirection: 'row', alignItems: 'center' },
  mapIconCircle: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seeAllRow: { flexDirection: 'row', alignItems: 'center' },
});