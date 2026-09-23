import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { router, usePathname, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Lightbulb } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { AppHeader } from '../../components/navigation/AppHeader';
import { AreaStatusCard } from '../../components/home/AreaStatusCard';
import { QuickActionsRow } from '../../components/home/QuickActionsRow';
import { AdvisoryBanner } from '../../components/home/AdvisoryBanner';
import { DailyTipCard } from '../../components/home/DailyTipCard';
import { ReportListItem } from '../../components/home/ReportListItem';
import { ShinyCard } from '../../components/ui/ShinyCard';
import { reportService } from '../../services/api/reportService';
import { announcementService } from '../../services/api';
import { AreaStatus, CommunityReport, Announcement } from '../../services/api/models';
import { formatRelativeDate } from '../../utils/formatters';

export default function HomeScreen() {
  const { colors, spacing, typography, radius, shadow } = useTheme();
  const { user } = useAuth();
  const { refresh: refreshNotifications } = useNotifications();
  const pathname = usePathname();

  const [areaStatus, setAreaStatus] = useState<AreaStatus | null>(null);
  const [recentReports, setRecentReports] = useState<CommunityReport[]>([]);
  const [latestAdvisory, setLatestAdvisory] = useState<Announcement | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [status, reports, announcements] = await Promise.allSettled([
        reportService.getAreaStatus(),
        reportService.getMyReports(3),
        announcementService.list(),
      ]);

      if (status.status === 'fulfilled') setAreaStatus(status.value);
      if (reports.status === 'fulfilled') setRecentReports(reports.value);
      if (announcements.status === 'fulfilled' && announcements.value.length > 0) {
        setLatestAdvisory(announcements.value[0]);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
    refreshNotifications();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader variant="dark" />

      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: spacing.xxxl,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.brandOrange}
            />
          }
        >
          {/* Area Status Hero */}
          <View style={{ marginTop: 8 }}>
            <AreaStatusCard
              barangayName={areaStatus?.barangay_name ?? user?.address?.barangay_name ?? 'Your Barangay'}
              riskLevel={areaStatus?.risk_level ?? 'low'}
              incidentsThisMonth={areaStatus?.incidents_this_month ?? 0}
              advisoryText={areaStatus?.advisory_active ? 'Dry season fire advisory in effect' : undefined}
            />
          </View>

          {/* Quick Actions */}
          <View style={{ marginTop: spacing.xl }}>
            <QuickActionsRow />
          </View>


          {/* Recent Reports */}
          <View style={[styles.sectionHeader, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.size.md }]}>
              My Recent Reports
            </Text>
            <Pressable
              onPress={() => router.push({ pathname: '/(resident)/reports', params: { from: pathname } } as any)}
              style={({ pressed }) => [styles.seeAllRow, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={{ color: colors.brandOrange, fontSize: typography.size.sm, fontWeight: '600' }}>
                See all
              </Text>
              <ChevronRight size={14} color={colors.brandOrange} />
            </Pressable>
          </View>

          {/* Reports card */}
          <ShinyCard style={styles.reportsCard} padding={0}>
            {isLoading ? (
              <View style={styles.stateBox}>
                <Text style={{ color: colors.textMuted, fontSize: typography.size.sm }}>Loading…</Text>
              </View>
            ) : recentReports.length === 0 ? (
              <View style={styles.stateBox}>
                <Text style={{ color: colors.textMuted, fontSize: typography.size.sm, textAlign: 'center', lineHeight: 20 }}>
                  No reports yet. Tap the action button to submit an incident.
                </Text>
              </View>
            ) : (
              recentReports.map((report, index) => (
                <View
                  key={report.report_id}
                  style={[
                    { paddingHorizontal: spacing.md },
                    index < recentReports.length - 1
                      ? { borderBottomWidth: 1, borderBottomColor: colors.border }
                      : undefined,
                  ]}
                >
                  <ReportListItem report={report} />
                </View>
              ))
            )}
          </ShinyCard>

          {/* Safety Tip */}
          <DailyTipCard
            title="Never leave cooking unattended"
            tip="Unattended kitchen equipment is the leading cause of residential fires in Lian."
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontWeight: '700' },
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  reportsCard: { overflow: 'hidden' },
  stateBox: { padding: 20, alignItems: 'center' },
  tipCard: {},
  tipHeader: { flexDirection: 'row', alignItems: 'center' },
});